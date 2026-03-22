import { describe, it, expect } from "vitest";
import { parsePlayArgs } from "../../src/cli/args";

describe("parsePlayArgs", () => {
  it("defaults seed when no number given", () => {
    expect(parsePlayArgs([]).seed).toBe(12345);
  });

  it("parses numeric seed", () => {
    expect(parsePlayArgs(["99"]).seed).toBe(99);
    expect(parsePlayArgs(["--bot", "7"]).seed).toBe(7);
  });

  it("parses flags", () => {
    expect(parsePlayArgs(["--bot"])).toMatchObject({
      bot: true,
      auto: false,
      seed: 12345,
    });
    expect(parsePlayArgs(["--vs-bot"])).toMatchObject({ bot: true });
    expect(parsePlayArgs(["--auto"])).toMatchObject({ auto: true });
    expect(parsePlayArgs(["--simulate", "3"])).toMatchObject({
      auto: true,
      seed: 3,
    });
  });

  it("sets help", () => {
    expect(parsePlayArgs(["--help"]).help).toBe(true);
    expect(parsePlayArgs(["-h"]).help).toBe(true);
  });
});
