"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInitializeGovernance } from "../hooks/use-initialize-governance"

export function InitializeGovernance() {
  const { connected } = useWallet()
  const { initializeGovernance, isLoading } = useInitializeGovernance()

  // Only show to connected admin
  if (!connected) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333]">
        <CardContent className="pt-6">
          <p className="text-center text-gray-400">Connect your wallet to initialize governance.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1e1e1e] border-[#333]">
      <CardHeader>
        <CardTitle>Initialize Governance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300">
          This will create the on‑chain "gov-state" account (if it doesn't already exist) and set proposal_count = 0.
        </p>
        <Button onClick={initializeGovernance} disabled={isLoading} className="w-full">
          {isLoading ? "Initializing…" : "Initialize Governance"}
        </Button>
      </CardContent>
    </Card>
  )
}
