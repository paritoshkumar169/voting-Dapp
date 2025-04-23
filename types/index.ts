import { BN } from "@project-serum/anchor"
import type { PublicKey } from "@solana/web3.js"

export type StakeStatus = "unstaked" | "staked" | "cooldown"

export interface UserStake {
  amount: BN
  stakeTime: BN
  cooldownStart: BN
  status: StakeStatus
}


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

// --- Governance Types ---

export interface GovState {
  proposalCount: BN
}

export interface Proposal {
  proposer: PublicKey
  heading: string
  description: string
  options: string[]
  votes: BN[]
  createdAt: BN
}

// Governance Program Error Codes and Messages
export const GOVERNANCE_ERRORS: { [code: number]: { name: string; msg: string } } = {
  6000: {
    name: "InvalidOptionsCount",
    msg: "Proposal must have between 1 and 6 options.",
  },
  6001: {
    name: "InvalidOption",
    msg: "That option index is out of range.",
  },
  6002: {
    name: "ProposalExpired",
    msg: "This proposal is no longer active.",
  },
}

// Governance Instruction Args Types
export interface CreateProposalArgs {
  heading: string
  description: string
  options: string[]
}

export interface VoteArgs {
  optionIndex: number // u8 maps to number
}

// Governance Seeds
export const GOV_STATE_SEED = Buffer.from("gov-state")
export const PROPOSAL_SEED = Buffer.from("proposal")

// Governance Program Constants (from Rust code)
export const GOVERNANCE_PROPOSAL_LIFETIME = 86400 // seconds (1 day)
export const GOVERNANCE_MAX_OPTIONS = 6
