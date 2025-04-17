"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@solana/wallet-adapter-react"

export function CreateProposal() {
  const { connected } = useWallet()

  if (!connected) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333]">
        <CardContent className="pt-6">
          <p className="text-center text-gray-400">Please connect your wallet to create proposals</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1e1e1e] border-[#333]">
      <CardHeader>
        <CardTitle>Create Proposal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-amber-900/20 border border-amber-700/30 rounded-md">
          <p className="text-amber-400">Proposal creation functionality will be implemented soon</p>
          <p className="text-sm text-gray-400 mt-2">
            This feature is currently under development. Please check back later.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
