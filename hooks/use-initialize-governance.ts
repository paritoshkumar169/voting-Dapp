"use client"

import { useState, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"
import { useToast } from "@/components/ui/use-toast"
import { GOV_STATE_SEED, GOVERNANCE_ERRORS } from "../types" // Assuming GOVERNANCE_ERRORS might be relevant if init fails
import { findProgramAddress } from "../utils/pda"

// Constants
const GOVERNANCE_PROGRAM_ID = new PublicKey("ATXzVzuB9dvwCQnAGoWrhEwLcZnueZqcE6izMBwQwkwa")
const INITIALIZE_GOV_DISCRIMINATOR = Buffer.from([175, 151, 72, 150, 248, 86, 141, 91])

// Re-use error parsing function if needed, or create a simpler one
function parseGovernanceError(error: any): string | null {
  const errorCodeHex = error?.logs
    ?.find((log: string) => log.includes("custom program error: 0x"))
    ?.match(/custom program error: 0x([0-9a-fA-F]+)/)?.[1]

  if (errorCodeHex) {
    const code = Number.parseInt(errorCodeHex, 16)
    return GOVERNANCE_ERRORS[code]?.msg || `Unknown governance error code: ${code} (0x${errorCodeHex})`
  }
  return error.message || "An unknown error occurred"
}

export function useInitializeGovernance() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const initializeGovernance = useCallback(async () => {
    if (!publicKey || !connection || !sendTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to initialize governance.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 1. Find PDA for GovState
      const [govStatePda] = findProgramAddress(GOV_STATE_SEED, GOVERNANCE_PROGRAM_ID)

      // Check if already initialized (optional but good practice)
      const accountInfo = await connection.getAccountInfo(govStatePda)
      if (accountInfo !== null) {
        toast({
          title: "Already Initialized",
          description: "Governance state account already exists.",
        })
        setIsLoading(false)
        return // Don't try to initialize again
      }

      // 2. Create Transaction Instruction
      const instruction = new TransactionInstruction({
        keys: [
          // Accounts based on InitGov struct
          { pubkey: govStatePda, isSigner: false, isWritable: true }, // gov_state (writable, to be initialized)
          { pubkey: publicKey, isSigner: true, isWritable: true }, // admin (signer, payer)
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program (required for init)
        ],
        programId: GOVERNANCE_PROGRAM_ID,
        data: INITIALIZE_GOV_DISCRIMINATOR,
      })

      // 3. Send and Confirm Transaction
      const transaction = new Transaction().add(instruction)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey // The 'admin' pays

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")

      toast({
        title: "Governance Initialized",
        description: "Successfully created the governance state account.",
      })
      return signature
    } catch (error: any) {
      console.error("Initialize Governance Error:", error)
      const errorMessage = parseGovernanceError(error)
      toast({
        title: "Error Initializing Governance",
        description: errorMessage || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, connection, sendTransaction, toast])

  return { initializeGovernance, isLoading }
}
