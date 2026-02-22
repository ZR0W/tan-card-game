/**
 * Seedable PRNG for deterministic shuffle and simulations.
 * Same seed → same sequence. No Math.random() in engine.
 */

export interface Rng {
  /** Returns next value in [0, 1). */
  next(): number;
  /** Returns next integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number;
}

/**
 * Mulberry32 - simple seeded PRNG, reproducible.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0; // 32-bit
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    nextInt(min: number, max: number): number {
      const n = this.next();
      return min + Math.floor(n * (max - min + 1));
    },
  };
}
