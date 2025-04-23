"use client"

import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { BN } from "@project-serum/anchor"
import { useCallback, useState, useEffect } from "react"
import type { StakeStatus } from "@/types"

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "8vDcMPAPjXDCy7zgNmN9u3JNTWJAvBzuwt9Lhztub82Y")
const VAULT_SEED = Buffer.from("vault")
const USER_STAKE_SEED = Buffer.from("user-stake")
const MINIMUM_STAKE_AMOUNT = new BN(1_000_000_000)
const STAKE_DISCRIMINATOR = Buffer.from([206, 176, 202, 18, 200, 209, 179, 108])
const START_UNSTAKE_DISCRIMINATOR = Buffer.from([200, 243, 106, 111, 170, 72, 31, 117])
const CLAIM_UNSTAKE_DISCRIMINATOR = Buffer.from([172, 113, 117, 178, 223, 245, 247, 118])
const ERROR_MESSAGES: { [code: number]: string } = {
  6000: "Stake amount is below the minimum of 1 SOL.",
  6001: "Already staked.",
  6002: "Not currently staked.",
  6003: "Not in cooldown.",
  6004: "Cooldown period not elapsed.",
  6005: "Vault PDA is incorrect.",
}
interface UserStakeData {
  amount: BN
  stakeTime: BN
  cooldownStart: BN
  status: StakeStatus
}

export const useStaking = () => {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [userStake, setUserStake] = useState<UserStakeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [vaultBump, setVaultBump] = useState<number | null>(null)

  const fetchWalletBalance = useCallback(async () => {
    if (!publicKey || !connection) return

    try {
      const balance = await connection.getBalance(publicKey)
      setWalletBalance(balance)
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
    }
  }, [publicKey, connection])

  useEffect(() => {
    if (publicKey && connection) {
      fetchWalletBalance()
      const intervalId = setInterval(fetchWalletBalance, 10000)
      return () => clearInterval(intervalId)
    }
  }, [publicKey, connection, fetchWalletBalance])

  const findPDAs = useCallback(() => {
    if (!publicKey) return { userStakePda: null, vaultPda: null, vaultBump: null }

    const [userStakePda] = PublicKey.findProgramAddressSync([USER_STAKE_SEED, publicKey.toBuffer()], PROGRAM_ID)
    const [vaultPda, bump] = PublicKey.findProgramAddressSync([VAULT_SEED, publicKey.toBuffer()], PROGRAM_ID)

    return { userStakePda, vaultPda, vaultBump: bump }
  }, [publicKey])

  const parseUserStakeData = (data: Buffer): UserStakeData => {
    let offset = 8

    const amount = new BN(data.slice(offset, offset + 8), "le")
    offset += 8

    const stakeTime = new BN(data.slice(offset, offset + 8), "le")
    offset += 8

    const cooldownStart = new BN(data.slice(offset, offset + 8), "le")
    offset += 8

    const statusValue = data[offset]
    let status: StakeStatus
    switch (statusValue) {
      case 0:
        status = "unstaked"
        break
      case 1:
        status = "staked"
        break
      case 2:
        status = "cooldown"
        break
      default:
        status = "unstaked"
    }

    return { amount, stakeTime, cooldownStart, status }
  }

  const fetchUserStake = useCallback(async () => {
    if (!publicKey || !connection) return null

    setLoading(true)
    setError(null)

    try {
      const { userStakePda, vaultPda, vaultBump } = findPDAs()
      if (!userStakePda || !vaultPda || vaultBump === null) return null

      setVaultBump(vaultBump)

      try {
        const accountInfo = await connection.getAccountInfo(userStakePda)
        if (!accountInfo || !accountInfo.data) {
          console.log("Stake account not found, will be created on first stake")
          setUserStake(null)
          return null
        }

        const stakeData = parseUserStakeData(accountInfo.data)
        setUserStake(stakeData)
        return stakeData
      } catch (err) {
        console.log("Error fetching stake account:", err)
        setUserStake(null)
        return null
      }
    } catch (err: any) {
      console.error("Failed to fetch stake:", err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [publicKey, connection, findPDAs])

  useEffect(() => {
    if (publicKey && connection) {
      fetchUserStake()
    }
  }, [publicKey, connection, fetchUserStake])

  const stake = useCallback(
    async (amount: BN) => {
      if (!publicKey || !connection || !sendTransaction) return

      setLoading(true)
      setError(null)

      try {
        const { userStakePda, vaultPda } = findPDAs()
        if (!userStakePda || !vaultPda) return

        const data = Buffer.concat([STAKE_DISCRIMINATOR, Buffer.from(amount.toArray("le", 8))])

        const instruction = new TransactionInstruction({
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: userStakePda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: PROGRAM_ID,
          data,
        })

        const transaction = new Transaction().add(instruction)
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        // Use the standard sendTransaction method
        const signature = await sendTransaction(transaction, connection)
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")

        console.log("Stake tx:", signature)
        await fetchUserStake()
        await fetchWalletBalance()
      } catch (err: any) {
        console.error("Staking error:", err)
        const errorCode = err?.logs
          ?.find((log: string) => log.includes("custom program error"))
          ?.match(/custom program error: (\d+)/)?.[1]

        setError(errorCode ? ERROR_MESSAGES[Number(errorCode)] || "Transaction failed" : "Transaction failed")
      } finally {
        setLoading(false)
      }
    },
    [publicKey, connection, sendTransaction, findPDAs, fetchUserStake, fetchWalletBalance],
  )

  const startUnstake = useCallback(async () => {
    if (!publicKey || !connection || !sendTransaction) return

    setLoading(true)
    setError(null)

    try {
      const { userStakePda, vaultPda } = findPDAs()
      if (!userStakePda || !vaultPda) return

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: userStakePda, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: START_UNSTAKE_DISCRIMINATOR,
      })

      const transaction = new Transaction().add(instruction)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")

      console.log("StartUnstake tx:", signature)
      await fetchUserStake()
    } catch (err: any) {
      console.error("Unstake error:", err)
      const errorCode = err?.logs
        ?.find((log: string) => log.includes("custom program error"))
        ?.match(/custom program error: (\d+)/)?.[1]

      setError(errorCode ? ERROR_MESSAGES[Number(errorCode)] || "Transaction failed" : "Transaction failed")
    } finally {
      setLoading(false)
    }
  }, [publicKey, connection, sendTransaction, findPDAs, fetchUserStake])

  const claimUnstake = useCallback(async () => {
    if (!publicKey || !connection || !sendTransaction || vaultBump === null) return

    setLoading(true)
    setError(null)

    try {
      const { userStakePda, vaultPda } = findPDAs()
      if (!userStakePda || !vaultPda) return

      const data = Buffer.concat([
        CLAIM_UNSTAKE_DISCRIMINATOR,
        Buffer.from([vaultBump]), // u8
      ])

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: vaultPda, isSigner: false, isWritable: true },
          { pubkey: userStakePda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      })

      const transaction = new Transaction().add(instruction)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")

      console.log("ClaimUnstake tx:", signature)
      await fetchUserStake()
      await fetchWalletBalance()
    } catch (err: any) {
      console.error("ClaimUnstake error:", err)
      const errorCode = err?.logs
        ?.find((log: string) => log.includes("custom program error"))
        ?.match(/custom program error: (\d+)/)?.[1]

      setError(errorCode ? ERROR_MESSAGES[Number(errorCode)] || "Transaction failed" : "Transaction failed")
    } finally {
      setLoading(false)
    }
  }, [publicKey, connection, sendTransaction, vaultBump, findPDAs, fetchUserStake, fetchWalletBalance])

  const convertLamportsToSol = (lamports: BN | number) => {
    return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(2)
  }
  const convertSolToLamports = (sol: number) => {
    return new BN(Math.floor(sol * LAMPORTS_PER_SOL))
  }

  const getCooldownRemaining = useCallback(() => {
    if (!userStake || userStake.status !== "cooldown") return null

    const cooldownEnds = new Date((userStake.cooldownStart.toNumber() + 300) * 1000) // 5 minutes in seconds
    const now = new Date()

    if (cooldownEnds <= now) return null

    const remainingTime = Math.floor((cooldownEnds.getTime() - now.getTime()) / 1000)
    const minutes = Math.floor(remainingTime / 60)
    const seconds = remainingTime % 60

    return `${minutes}m ${seconds}s remaining`
  }, [userStake])

  return {
    userStake,
    loading,
    error,
    walletBalance,
    stake,
    startUnstake,
    claimUnstake,
    fetchUserStake,
    convertLamportsToSol,
    convertSolToLamports,
    getCooldownRemaining,
  }
}
