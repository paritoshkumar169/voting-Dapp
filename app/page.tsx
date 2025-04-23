"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { StakeSol } from "@/components/stake-sol"
import { CreateProposal } from "@/components/create-proposal"
import { VoteOnProposal } from "@/components/vote-on-proposal"
import { InitializeGovernance } from "@/components/initialize-governance"
import { WalletMultiButton } from "@/components/wallet-multi-button"

export default function Home() {
  const [activeTab, setActiveTab] = useState("stake")

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-6">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">DegenDAO</h1>
          <WalletMultiButton />
        </header>

        <div className="max-w-3xl mx-auto">
          {activeTab === "stake" && <StakeSol />}
          {activeTab === "create" && <CreateProposal />}
          {activeTab === "vote" && <VoteOnProposal />}
          {activeTab === "admin" && <InitializeGovernance />}
        </div>
      </main>
    </div>
  )
}
