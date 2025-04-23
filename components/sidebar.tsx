"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { Square, ArrowUpRight, CheckSquare, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { connected } = useWallet()

  return (
    <div className="w-64 bg-[#1a1a1a] border-r border-[#333] p-4">
      <div className="mt-8 space-y-2">
        <button
          onClick={() => setActiveTab("stake")}
          className={cn(
            "flex items-center gap-3 w-full p-3 rounded-md text-left transition-colors",
            activeTab === "stake" ? "bg-[#333] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white",
          )}
          disabled={!connected}
        >
          <Square size={18} />
          <span>Stake SOL</span>
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={cn(
            "flex items-center gap-3 w-full p-3 rounded-md text-left transition-colors",
            activeTab === "create" ? "bg-[#333] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white",
          )}
          disabled={!connected}
        >
          <ArrowUpRight size={18} />
          <span>Create Proposal</span>
        </button>

        <button
          onClick={() => setActiveTab("vote")}
          className={cn(
            "flex items-center gap-3 w-full p-3 rounded-md text-left transition-colors",
            activeTab === "vote" ? "bg-[#333] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white",
          )}
          disabled={!connected}
        >
          <CheckSquare size={18} />
          <span>Vote on Proposal</span>
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className={cn(
            "flex items-center gap-3 w-full p-3 rounded-md text-left transition-colors",
            activeTab === "admin" ? "bg-[#333] text-white" : "text-gray-400 hover:bg-[#222] hover:text-white",
          )}
          disabled={!connected}
        >
          <Settings size={18} />
          <span>Admin</span>
        </button>
      </div>
    </div>
  )
}
