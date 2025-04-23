"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton as WalletButton } from "@solana/wallet-adapter-react-ui"
import { useEffect, useState } from "react"

export function WalletMultiButton() {
  const { publicKey } = useWallet()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <WalletButton className="bg-[#512da8] hover:bg-[#673ab7] text-white rounded-md" />
}
