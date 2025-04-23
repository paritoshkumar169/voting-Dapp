"use client"

import { useState, useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"
import { BN } from "@coral-xyz/anchor"
import { useToast } from "@/components/ui/use-toast"

import { type CreateProposalArgs, GOV_STATE_SEED, PROPOSAL_SEED, GOVERNANCE_ERRORS } from "../types"
import { findProgramAddress } from "../utils/pda"


const GOVERNANCE_PROGRAM_ID = new PublicKey("ATXzVzuB9dvwCQnAGoWrhEwLcZnueZqcE6izMBwQwkwa")


const CREATE_PROPOSAL_DISCRIMINATOR = Buffer.from([132, 116, 68, 174, 216, 160, 198, 22])


function serializeString(str: string): Buffer {
  const buf = Buffer.from(str, "utf8")
  const len = Buffer.alloc(4)
  len.writeUInt32LE(buf.length, 0)
  return Buffer.concat([len, buf])
}

function serializeStringVec(vec: string[]): Buffer {
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32LE(vec.length, 0)
  return Buffer.concat([lenBuf, ...vec.map(serializeString)])
}


function parseGovernanceError(error: any): string {
  const hex = error?.logs?.find((l: string) => l.includes("custom program error: 0x"))?.match(/0x([0-9a-fA-F]+)/)?.[1]
  if (hex) {
    const code = Number.parseInt(hex, 16)
    return GOVERNANCE_ERRORS[code]?.msg ?? `Unknown governance error code: ${code} (0x${hex})`
  }
  return error?.message ?? "An unknown error occurred"
}

export function useCreateProposal() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const createProposal = useCallback(
    async ({ heading, description, options }: CreateProposalArgs) => {
      if (!publicKey || !connection || !sendTransaction) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to create proposals.",
          variant: "destructive",
        })
        return
      }
      setIsLoading(true)

      try {
        // 1️⃣ Derive PDAs
        const [govStatePda] = findProgramAddress(GOV_STATE_SEED, GOVERNANCE_PROGRAM_ID)

        // Fetch gov-state to get proposal_count
        const acct = await connection.getAccountInfo(govStatePda)
        if (!acct?.data) {
          throw new Error("Governance state not found. Initialize governance first.")
        }
        const count = new BN(acct.data.slice(8, 16), "le")
        const countBytes = Buffer.from(count.toArray("le", 8))
        const [proposalPda] = findProgramAddress(PROPOSAL_SEED, GOVERNANCE_PROGRAM_ID, countBytes)

        // 2️⃣ Build instruction data
        const data = Buffer.concat([
          CREATE_PROPOSAL_DISCRIMINATOR,
          serializeString(heading),
          serializeString(description),
          serializeStringVec(options),
        ])

        // 3️⃣ Build the instruction
        const ix = new TransactionInstruction({
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: govStatePda, isSigner: false, isWritable: true },
            { pubkey: proposalPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: GOVERNANCE_PROGRAM_ID,
          data,
        })

        // 4️⃣ Prepare transaction
        const tx = new Transaction().add(ix)
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = publicKey

        // 5️⃣ SIMULATE, so we always get logs
        const sim = await connection.simulateTransaction(tx)
        if (sim.value.err) {
          console.error("Simulation failed:", sim.value.err, sim.value.logs)
          toast({
            title: "Simulation failed",
            description: sim.value.logs?.join("\n") ?? "No logs available",
            variant: "destructive",
          })
          return
        }

        // 6️⃣ Send for real
        const sig = await sendTransaction(tx, connection)
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed")

        toast({
          title: "Proposal Created",
          description: `Successfully created: ${heading}`,
        })
        return sig
      } catch (err: any) {
        console.error("CreateProposal Error:", err)
        const msg = parseGovernanceError(err)
        toast({
          title: "Error Creating Proposal",
          description: msg,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, connection, sendTransaction, toast],
  )

  return { createProposal, isLoading }
}
