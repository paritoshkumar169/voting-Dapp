"use client"

import { useState, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js"
import { useToast } from "@/components/ui/use-toast"
import { type VoteArgs, GOVERNANCE_ERRORS } from "../types"

// Constants
const GOVERNANCE_PROGRAM_ID = new PublicKey("ATXzVzuB9dvwCQnAGoWrhEwLcZnueZqcE6izMBwQwkwa")
const VOTE_DISCRIMINATOR = Buffer.from([227, 110, 155, 23, 136, 126, 172, 25])

// Helper to parse Governance Error Code
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

interface UseVoteProps {
  proposalAccountKey: PublicKey | null // Allow null initially
}

export function useVote({ proposalAccountKey }: UseVoteProps) {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const vote = useCallback(
    async ({ optionIndex }: VoteArgs) => {
      if (!publicKey || !connection || !sendTransaction) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to vote.",
          variant: "destructive",
        })
        return
      }
      if (!proposalAccountKey) {
        toast({
          title: "Proposal not selected",
          description: "Please select a proposal to vote on.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)

      try {
        // Manually Construct Instruction Data
        const instructionData = Buffer.concat([
          VOTE_DISCRIMINATOR,
          Buffer.from([optionIndex]), // optionIndex is u8
        ])

        // Create Transaction Instruction
        const instruction = new TransactionInstruction({
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true }, // user (signer)
            { pubkey: proposalAccountKey, isSigner: false, isWritable: true }, // proposal (writable for vote tally)
          ],
          programId: GOVERNANCE_PROGRAM_ID,
          data: instructionData,
        })

        // Send and Confirm Transaction
        const transaction = new Transaction().add(instruction)
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signature = await sendTransaction(transaction, connection)
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")

        toast({
          title: "Vote Cast",
          description: `Successfully voted for option ${optionIndex}.`,
        })
        return signature
      } catch (error: any) {
        console.error("Vote Error:", error)
        const errorMessage = parseGovernanceError(error)
        toast({
          title: "Error Casting Vote",
          description: errorMessage || "An unknown error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [proposalAccountKey, publicKey, connection, sendTransaction, toast], // Dependencies
  )

  return { vote, isLoading }
}
