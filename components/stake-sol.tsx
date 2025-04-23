"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useStaking } from "@/hooks/useStaking"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

export function StakeSol() {
  const { publicKey, connected } = useWallet()
  const { toast } = useToast()
  const {
    userStake,
    loading,
    error,
    walletBalance,
    stake,
    startUnstake,
    claimUnstake,
    convertLamportsToSol,
    convertSolToLamports,
    getCooldownRemaining,
  } = useStaking()

  const [amount, setAmount] = useState("")
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  // Update cooldown timer
  useEffect(() => {
    if (!userStake || userStake.status !== "cooldown") {
      setCooldownRemaining(null)
      return
    }

    const updateCooldown = () => {
      const remaining = getCooldownRemaining()
      setCooldownRemaining(remaining)
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 1000)
    return () => clearInterval(interval)
  }, [userStake, getCooldownRemaining])

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleStake = async () => {
    if (!amount || isNaN(Number(amount)) || !publicKey) return

    const amountLamports = convertSolToLamports(Number(amount))

    // Check if amount is at least 1 SOL
    if (amountLamports.lt(LAMPORTS_PER_SOL)) {
      toast({
        title: "Error",
        description: "You must stake at least 1 SOL",
        variant: "destructive",
      })
      return
    }

    // Check if wallet has enough balance
    if (amountLamports.gt(walletBalance)) {
      toast({
        title: "Error",
        description: "Insufficient funds in your wallet",
        variant: "destructive",
      })
      return
    }

    setIsStaking(true)
    try {
      await stake(amountLamports)
      toast({
        title: "Success",
        description: `Staked ${amount} SOL successfully`,
      })
      setAmount("")
    } catch (error: any) {
      console.error("Staking error:", error)
    } finally {
      setIsStaking(false)
    }
  }

  const handleRequestUnstake = async () => {
    if (!publicKey || !userStake || userStake.status !== "staked") return

    setIsUnstaking(true)
    try {
      await startUnstake()
      toast({
        title: "Success",
        description: "Unstake requested. Funds will be available after a 5-minute cooldown period.",
      })
    } catch (error) {
      console.error("Unstaking error:", error)
    } finally {
      setIsUnstaking(false)
    }
  }

  const handleClaimUnstake = async () => {
    if (!publicKey || !userStake || userStake.status !== "cooldown") return

    setIsClaiming(true)
    try {
      await claimUnstake()
      toast({
        title: "Success",
        description: "Successfully claimed unstaked SOL",
      })
    } catch (error: any) {
      console.error("Claim unstake error:", error)
    } finally {
      setIsClaiming(false)
    }
  }

  if (!connected) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333]">
        <CardContent className="pt-6">
          <p className="text-center text-gray-400">Please connect your wallet to stake SOL</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1e1e1e] border-[#333]">
      <CardHeader>
        <CardTitle>Stake SOL</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="py-2 px-4 bg-[#252525] rounded-md">
              <p className="text-sm text-gray-400">Wallet Balance</p>
              <p className="text-xl font-bold">{convertLamportsToSol(walletBalance)} SOL</p>
            </div>

            {userStake && userStake.status !== "unstaked" && (
              <div className="py-2 px-4 bg-[#252525] rounded-md">
                <p className="text-sm text-gray-400">Currently staked</p>
                <p className="text-xl font-bold">{convertLamportsToSol(userStake.amount)} SOL</p>

                {userStake.status === "cooldown" && (
                  <div className="mt-2">
                    <p className="text-sm text-amber-400">Unstake requested</p>
                    {cooldownRemaining && <p className="text-xs text-gray-400">{cooldownRemaining}</p>}
                  </div>
                )}
              </div>
            )}

            {(!userStake || userStake.status === "unstaked") && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Amount (SOL)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter SOL amount (min 1 SOL)"
                  className="bg-[#252525] border-[#333] text-white"
                  min="1"
                  step="0.1"
                />
                <p className="text-xs text-gray-400 mt-1">Max: {convertLamportsToSol(walletBalance)} SOL</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {(!userStake || userStake.status === "unstaked") && (
                <Button
                  onClick={handleStake}
                  disabled={
                    !amount ||
                    isStaking ||
                    isNaN(Number(amount)) ||
                    Number(amount) < 1 ||
                    convertSolToLamports(Number(amount)).gt(walletBalance)
                  }
                  className="bg-[#512da8] hover:bg-[#673ab7] text-white"
                >
                  {isStaking ? "Staking..." : "Stake SOL"}
                </Button>
              )}

              {userStake && userStake.status === "staked" && (
                <Button
                  onClick={handleRequestUnstake}
                  disabled={isUnstaking}
                  variant="outline"
                  className="border-[#512da8] text-[#512da8] hover:bg-[#512da8]/10"
                >
                  {isUnstaking ? "Processing..." : "Request Unstake"}
                </Button>
              )}

              {userStake && userStake.status === "cooldown" && (
                <Button
                  onClick={handleClaimUnstake}
                  disabled={isClaiming || cooldownRemaining !== null}
                  className="bg-[#512da8] hover:bg-[#673ab7] text-white"
                >
                  {isClaiming ? "Processing..." : "Claim Unstaked SOL"}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
