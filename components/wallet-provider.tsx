"use client"

import type React from "react"
import { useMemo } from "react"
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"

// Import the styles
import "@solana/wallet-adapter-react-ui/styles.css"

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Use the RPC endpoint from environment variable
  const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com"

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking
  // We're explicitly only using Phantom and Solflare to avoid mobile adapter issues
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
