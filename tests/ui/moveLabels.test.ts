import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/engine";
import { describeMove } from "../../src/ui/moveLabels";

describe("moveLabels", () => {
  it("describeMove labels draw", () => {
    const state = createInitialGameState(1);
    expect(describeMove({ type: "draw" }, state)).toContain("Draw");
  });
});
