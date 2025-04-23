import type React from "react"
import "@/app/globals.css"
import { WalletProvider } from "@/components/wallet-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/use-toast"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DegenDAO - Solana DAO Platform",
  description: "Stake SOL, create and vote on proposals in the DegenDAO",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#121212] text-white">
        <ThemeProvider attribute="class" defaultTheme="dark">
          <WalletProvider>
            <ToastProvider>{children}</ToastProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
