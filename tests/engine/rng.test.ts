import { describe, it, expect } from "vitest";
import { createRng } from "../../src/engine/rng";

describe("rng", () => {
  it("same seed produces same sequence", () => {
    const a = createRng(12345);
    const b = createRng(12345);
    for (let i = 0; i < 20; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it("different seeds produce different sequence", () => {
    const a = createRng(1);
    const b = createRng(2);
    const valsA = Array.from({ length: 10 }, () => a.next());
    const valsB = Array.from({ length: 10 }, () => b.next());
    expect(valsA).not.toEqual(valsB);
  });

  it("next() returns values in [0, 1)", () => {
    const rng = createRng(999);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("nextInt(min, max) returns integers in [min, max] inclusive", () => {
    const rng = createRng(42);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const v = rng.nextInt(0, 51);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(51);
      seen.add(v);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
