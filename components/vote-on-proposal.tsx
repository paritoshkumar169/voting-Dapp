"use client"
import { useWallet } from "@solana/wallet-adapter-react"
import { useConnection } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"


export function VoteOnProposal() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  
  const { toast } = useToast()

  // const [proposals, setProposals] = useState<any[]>([])
  // const [selectedProposal, setSelectedProposal] = useState<string | null>(null)
  // const [voteOption, setVoteOption] = useState("Yes")
  // const [isVoting, setIsVoting] = useState(false)
  // const [isLoading, setIsLoading] = useState(false)
  // const [stakeAccount, setStakeAccount] = useState<any>(null)
  // const [stakeAccountPda, setStakeAccountPda] = useState<any>(null)
  // const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  // const [walletBalance, setWalletBalance] = useState<number>(0)

  // const fetchWalletBalance = async () => {
  //   if (!publicKey || !connection) return

  //   try {
  //     const balance = await getWalletBalance(connection, publicKey)
  //     setWalletBalance(balance)
  //   } catch (error) {
  //     console.error("Error fetching wallet balance:", error)
  //   }
  // }

  // const fetchStakeAccount = async () => {
  //   if (!publicKey || !program) return

  //   try {
  //     // Get the PDA for this user's stake account
  //     const pda = findStakeAccountPda(publicKey)
  //     setStakeAccountPda(pda)

  //     try {
  //       // Try to fetch the stake account
  //       const account = await program.account.stakeAccount.fetch(pda)
  //       setStakeAccount(account)
  //     } catch (error) {
  //       // Account doesn't exist yet
  //       setStakeAccount(null)
  //     }
  //   } catch (error) {
  //     console.error("Error fetching stake account:", error)
  //   }
  // }

  // const fetchProposals = async () => {
  //   if (!program) return

  //   setIsLoading(true)
  //   try {
  //     // Fetch all proposals
  //     const allProposals = await program.account.proposal.all()

  //     // Parse metadata and add additional info
  //     const parsedProposals = allProposals.map((item) => {
  //       let metadata = { title: "Untitled Proposal", description: "No description" }
  //       try {
  //         metadata = JSON.parse(item.account.metadataUri)
  //       } catch (e) {
  //         console.error("Failed to parse metadata:", e)
  //       }

  //       return {
  //         pubkey: item.publicKey,
  //         ...item.account,
  //         metadata,
  //         timeRemaining: getTimeRemaining(item.account.endTime.toNumber()),
  //         isActive: item.account.status.active !== undefined,
  //       }
  //     })

  //     setProposals(parsedProposals)

  //     // If user is connected, check their votes
  //     if (publicKey) {
  //       const votes: Record<string, string> = {}

  //       for (const proposal of parsedProposals) {
  //         try {
  //           const voteRecordPda = findVoteRecordPda(proposal.pubkey, publicKey)

  //           try {
  //             const voteRecord = await program.account.voteRecord.fetch(voteRecordPda)
  //             votes[proposal.pubkey.toString()] = voteRecord.voteChoice.yes !== undefined ? "Yes" : "No"
  //           } catch (error) {
  //             // No vote record found for this proposal
  //           }
  //         } catch (error) {
  //           console.error("Error checking vote record:", error)
  //         }
  //       }

  //       setUserVotes(votes)
  //     }
  //   } catch (error) {
  //     console.error("Error fetching proposals:", error)
  //     toast({
  //       title: "Error",
  //       description: "Failed to fetch proposals",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // useEffect(() => {
  //   if (connected && publicKey) {
  //     fetchWalletBalance()
  //   }
  // }, [connected, publicKey, connection])

  // useEffect(() => {
  //   if (program) {
  //     fetchProposals()

  //     // Set up interval to refresh proposals every 30 seconds
  //     const interval = setInterval(fetchProposals, 30000)
  //     return () => clearInterval(interval)
  //   }
  // }, [program])

  // useEffect(() => {
  //   if (connected && publicKey && program) {
  //     fetchStakeAccount()
  //   } else {
  //     setStakeAccount(null)
  //     setStakeAccountPda(null)
  //   }
  // }, [connected, publicKey, program])

  // const handleVote = async (proposalId: string) => {
  //   if (!publicKey || !program || !stakeAccount || !stakeAccountPda) return

  //   // Check if user has staked at least 1 SOL
  //   if (stakeAccount.stakedAmount.toString() < LAMPORTS_PER_SOL) {
  //     toast({
  //       title: "Error",
  //       description: "You must stake at least 1 SOL to vote on proposals",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   setIsVoting(true)
  //   try {
  //     const proposalPubkey = new PublicKey(proposalId)
  //     const voteRecordPda = findVoteRecordPda(proposalPubkey, publicKey)

  //     // Call the castVote method from our program interface
  //     await program.castVote(proposalPubkey, voteRecordPda, stakeAccountPda, voteOption.toLowerCase() as "yes" | "no")

  //     toast({
  //       title: "Success",
  //       description: `Voted ${voteOption} successfully!`,
  //     })

  //     setSelectedProposal(null)
  //     fetchProposals()
  //   } catch (error: any) {
  //     console.error("Voting error:", error)

  //     let errorMessage = "Failed to cast vote"
  //     if (error.message) {
  //       if (error.message.includes("VotingPeriodEnded")) {
  //         errorMessage = "Voting period has ended"
  //       } else if (error.message.includes("InsufficientStake")) {
  //         errorMessage = "You must stake at least 1 SOL to vote"
  //       }
  //     }

  //     toast({
  //       title: "Error",
  //       description: errorMessage,
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsVoting(false)
  //   }
  // }

  // const handleFinalizeProposal = async (proposalId: string) => {
  //   if (!program) return

  //   try {
  //     const proposalPubkey = new PublicKey(proposalId)

  //     // Call the finalizeProposal method from our program interface
  //     await program.finalizeProposal(proposalPubkey)

  //     toast({
  //       title: "Success",
  //       description: "Proposal finalized successfully!",
  //     })

  //     fetchProposals()
  //   } catch (error: any) {
  //     console.error("Finalize error:", error)

  //     let errorMessage = "Failed to finalize proposal"
  //     if (error.message && error.message.includes("VotingPeriodNotEnded")) {
  //       errorMessage = "Voting period has not ended yet"
  //     }

  //     toast({
  //       title: "Error",
  //       description: errorMessage,
  //       variant: "destructive",
  //     })
  //   }
  // }

  if (!connected) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333]">
        <CardContent className="pt-6">
          <p className="text-center text-gray-400">Please connect your wallet to vote on proposals</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1e1e1e] border-[#333]">
      <CardHeader>
        <CardTitle>Vote on Proposal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-amber-900/20 border border-amber-700/30 rounded-md">
          <p className="text-amber-400">Voting functionality will be implemented soon</p>
          <p className="text-sm text-gray-400 mt-2">
            This feature is currently under development. Please check back later.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
