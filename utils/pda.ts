import { PublicKey } from "@solana/web3.js"

/**
 * Finds a Program Derived Address (PDA).
 *
 * @param seedPrefix - The constant seed prefix buffer.
 * @param programId - The program ID.
 * @param extraSeeds - Optional additional seeds (like user public key or index buffers).
 * @returns The PDA and its bump.
 */
export function findProgramAddress(
  seedPrefix: Buffer,
  programId: PublicKey,
  ...extraSeeds: (PublicKey | Buffer)[]
): [PublicKey, number] {
  const seeds = [
    seedPrefix,
    ...extraSeeds.map((s) => {
      if (s instanceof PublicKey) {
        return s.toBuffer()
      }
      return s
    }),
  ]
  return PublicKey.findProgramAddressSync(seeds, programId)
}
