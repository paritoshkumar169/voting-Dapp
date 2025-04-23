"use client"

import { PublicKey, LAMPORTS_PER_SOL, type Connection } from "@solana/web3.js"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { useMemo } from "react"

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "8vDcMPAPjXDCy7zgNmN9u3JNTWJAvBzuwt9Lhztub82Y",
)
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com"


export function useProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null
    }

    return {
      
    }
  }, [connection, wallet])
}


export function convertLamportsToSol(lamports: string | number) {
  return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(2)
}

export function convertSolToLamports(sol: number) {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}


export async function getWalletBalance(connection: Connection, publicKey: PublicKey) {
  try {
    const balance = await connection.getBalance(publicKey)
    return balance
  } catch (error) {
    console.error("Error getting balance:", error)
    return 0
  }
}
