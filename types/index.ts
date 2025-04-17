import { BN } from "@project-serum/anchor"

export type StakeStatus = "unstaked" | "staked" | "cooldown"

export interface UserStake {
  amount: BN
  stakeTime: BN
  cooldownStart: BN
  status: StakeStatus
}

// Program Error Codes and Messages
export const STAKING_ERRORS: { [code: number]: { name: string; msg: string } } = {
  6000: {
    name: "BelowMinimumStake",
    msg: "Stake amount is below the minimum of 1 SOL.",
  },
  6001: {
    name: "AlreadyStaked",
    msg: "Already staked.",
  },
  6002: {
    name: "NotStaked",
    msg: "Not currently staked.",
  },
  6003: {
    name: "NotInCooldown",
    msg: "Not in cooldown.",
  },
  6004: {
    name: "CooldownNotElapsed",
    msg: "Cooldown period not elapsed.",
  },
  6005: {
    name: "InvalidVault",
    msg: "Vault PDA is incorrect.",
  },
}

// Instruction Args Types
export interface StakeArgs {
  amount: BN
}

export interface ClaimUnstakeArgs {
  vaultBump: number
}

export const VAULT_SEED = Buffer.from("vault")
export const USER_STAKE_SEED = Buffer.from("user-stake")

// Program Constants
export const MINIMUM_STAKE_AMOUNT = new BN(1_000_000_000) // 1 SOL in lamports
