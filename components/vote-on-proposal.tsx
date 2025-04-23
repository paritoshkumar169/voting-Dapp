"use client"
import { useState, useEffect, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { BN } from "@coral-xyz/anchor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useVote } from "../hooks/use-vote"
import { type Proposal as ProposalData, GOVERNANCE_PROPOSAL_LIFETIME } from "../types"

// Constants from Governance Program
const GOVERNANCE_PROGRAM_ID = new PublicKey("ATXzVzuB9dvwCQnAGoWrhEwLcZnueZqcE6izMBwQwkwa")
// Proposal account discriminator (from IDL)
const PROPOSAL_DISCRIMINATOR = Buffer.from([26, 94, 189, 187, 116, 136, 53, 33])

interface ParsedProposal extends ProposalData {
  publicKey: PublicKey
  totalVotes: number
  isActive: boolean
  timeRemaining: string
}

// Helper to parse Proposal account data manually
function parseProposalData(data: Buffer, publicKey: PublicKey): ParsedProposal | null {
  if (!data.slice(0, 8).equals(PROPOSAL_DISCRIMINATOR)) {
    return null // Not a Proposal account
  }

  let offset = 8 // Skip discriminator

  try {
    const proposer = new PublicKey(data.slice(offset, offset + 32))
    offset += 32

    const headingLen = data.readUInt32LE(offset)
    offset += 4
    const heading = data.slice(offset, offset + headingLen).toString("utf8")
    offset += headingLen

    const descriptionLen = data.readUInt32LE(offset)
    offset += 4
    const description = data.slice(offset, offset + descriptionLen).toString("utf8")
    offset += descriptionLen

    const optionsLen = data.readUInt32LE(offset)
    offset += 4
    const options: string[] = []
    for (let i = 0; i < optionsLen; i++) {
      const optionLen = data.readUInt32LE(offset)
      offset += 4
      options.push(data.slice(offset, offset + optionLen).toString("utf8"))
      offset += optionLen
    }

    const votesLen = data.readUInt32LE(offset)
    offset += 4
    const votes: BN[] = []
    let totalVotes = 0
    for (let i = 0; i < votesLen; i++) {
      const voteCount = new BN(data.slice(offset, offset + 8), "le")
      votes.push(voteCount)
      totalVotes += voteCount.toNumber() // Sum up votes for progress bar
      offset += 8
    }

    const createdAt = new BN(data.slice(offset, offset + 8), "le")
    offset += 8

    // Calculate expiry and status
    const now = Date.now() / 1000
    const expiresAt = createdAt.toNumber() + GOVERNANCE_PROPOSAL_LIFETIME
    const isActive = now <= expiresAt
    const timeRemaining = getTimeRemaining(expiresAt)

    return {
      publicKey,
      proposer,
      heading,
      description,
      options,
      votes,
      createdAt,
      totalVotes,
      isActive,
      timeRemaining,
    }
  } catch (e) {
    console.error("Error parsing proposal data:", publicKey.toBase58(), e)
    return null // Handle parsing errors gracefully
  }
}

function getTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = endTime - now

  if (diff <= 0) return "Ended"

  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const minutes = Math.floor((diff % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  if (minutes > 0) return `${minutes}m left`
  return "< 1m left"
}

export function VoteOnProposal() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()

  const [proposals, setProposals] = useState<ParsedProposal[]>([])
  const [isLoadingProposals, setIsLoadingProposals] = useState(false)
  const [selectedProposalKey, setSelectedProposalKey] = useState<PublicKey | null>(null)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null)

  // Initialize the useVote hook - it needs proposalAccountKey which changes
  const { vote, isLoading: isVoting } = useVote({ proposalAccountKey: selectedProposalKey })

  const fetchProposals = useCallback(async () => {
    if (!connection) return
    setIsLoadingProposals(true)
    try {
      const accounts = await connection.getProgramAccounts(GOVERNANCE_PROGRAM_ID)
      const parsed = accounts
        .map((acc) => parseProposalData(acc.account.data, acc.pubkey))
        .filter((p): p is ParsedProposal => p !== null)
        // Sort by creation time, newest first
        .sort((a, b) => b.createdAt.cmp(a.createdAt))

      setProposals(parsed)
    } catch (error) {
      console.error("Error fetching proposals:", error)
      toast({
        title: "Error Fetching Proposals",
        description: "Could not load proposals from the network.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProposals(false)
    }
  }, [connection, toast])

  // Fetch proposals on mount and connection change
  useEffect(() => {
    fetchProposals()
    // Optional: Add interval refresh
    const interval = setInterval(fetchProposals, 60000) // Refresh every 60s
    return () => clearInterval(interval)
  }, [fetchProposals])

  const handleVote = async () => {
    if (selectedOptionIndex === null) {
      toast({
        title: "No Option Selected",
        description: "Please select an option to vote for.",
        variant: "destructive",
      })
      return
    }

    const signature = await vote({ optionIndex: selectedOptionIndex })
    if (signature) {
      // Refresh proposals after successful vote to show updated counts
      fetchProposals()
      setSelectedOptionIndex(null) // Reset selection
    }
  }

  // Find the selected proposal object only if a key is selected
  const selectedProposal = selectedProposalKey ? proposals.find((p) => p.publicKey.equals(selectedProposalKey)) : null

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
        <CardTitle>Vote on Proposals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoadingProposals && <p className="text-gray-400">Loading proposals...</p>}
        {!isLoadingProposals && proposals.length === 0 && <p className="text-gray-400">No proposals found.</p>}

        {proposals.length > 0 && (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <Card
                  key={proposal.publicKey.toBase58()}
                  className={`cursor-pointer transition-all ${selectedProposalKey?.equals(proposal.publicKey) ? "border-blue-500 bg-[#2a2a2a]" : "border-gray-700 bg-gray-800 hover:bg-gray-700/50"}`}
                  onClick={() => {
                    setSelectedProposalKey(proposal.publicKey)
                    setSelectedOptionIndex(null) // Reset option selection when changing proposal
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-gray-100">{proposal.heading}</CardTitle>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${proposal.isActive ? "bg-green-800/70 text-green-300" : "bg-red-800/70 text-red-300"}`}
                      >
                        {proposal.timeRemaining}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 pt-1 truncate">{proposal.description}</p>
                  </CardHeader>
                  {selectedProposalKey?.equals(proposal.publicKey) && (
                    <CardContent className="pt-4 space-y-4">
                      <RadioGroup
                        value={selectedOptionIndex?.toString()}
                        onValueChange={(value) => setSelectedOptionIndex(Number.parseInt(value))}
                        className="space-y-2"
                      >
                        {proposal.options.map((option, index) => {
                          const votesForOption = proposal.votes[index]?.toNumber() ?? 0
                          const percentage = proposal.totalVotes > 0 ? (votesForOption / proposal.totalVotes) * 100 : 0
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={index.toString()}
                                  id={`${proposal.publicKey.toBase58()}-opt-${index}`}
                                  disabled={!proposal.isActive || isVoting}
                                />
                                <Label
                                  htmlFor={`${proposal.publicKey.toBase58()}-opt-${index}`}
                                  className="flex-grow text-gray-300 cursor-pointer"
                                >
                                  {option}
                                </Label>
                                <span className="text-xs text-gray-400">({votesForOption} votes)</span>
                              </div>
                              <Progress value={percentage} className="h-1 bg-gray-600 [&>*]:bg-blue-500" />
                            </div>
                          )
                        })}
                      </RadioGroup>
                      {proposal.isActive && (
                        <Button
                          onClick={handleVote}
                          disabled={isVoting || selectedOptionIndex === null}
                          className="w-full mt-4"
                        >
                          {isVoting ? "Casting Vote..." : "Cast Vote"}
                        </Button>
                      )}
                      {!proposal.isActive && (
                        <p className="text-center text-sm text-red-400 pt-2">Voting period has ended.</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
