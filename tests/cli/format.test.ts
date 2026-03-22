import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/engine";
import { formatCard, describeMove, formatGameState } from "../../src/cli/format";

describe("format", () => {
  it("formatCard", () => {
    expect(formatCard({ rank: "Ace", suit: "Spades" })).toBe("Ace Spades");
  });

  it("describeMove draw", () => {
    const state = createInitialGameState(1);
    expect(describeMove({ type: "draw" }, state)).toBe("draw");
  });

  it("formatGameState includes phase", () => {
    const state = createInitialGameState(2);
    expect(formatGameState(state)).toContain("Phase:");
  });
});
