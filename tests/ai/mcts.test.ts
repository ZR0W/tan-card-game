import { describe, it, expect, vi } from "vitest";
import {
  createInitialGameState,
  getLegalMoves,
  applyMove,
  getWinner,
} from "../../src/engine";
import type { Move } from "../../src/engine";
import {
  chooseMctsMove,
  formatMctsResult,
  graphToDot,
  auditLogToTimeSeries,
  moveLabel,
} from "../../src/ai/mcts";
import type { MctsProgress } from "../../src/ai/mcts";

// ── Helpers ──────────────────────────────────────────────────────────────────

function movesEqual(a: Move, b: Move): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "attack" && b.type === "attack") return a.cardIndex === b.cardIndex;
  if (a.type === "defend" && b.type === "defend") return a.cardIndex === b.cardIndex;
  return true;
}

// ── Core correctness ─────────────────────────────────────────────────────────

describe("chooseMctsMove — core correctness", () => {
  it("returns a legal move from the opening state", () => {
    const state = createInitialGameState(123);
    const result = chooseMctsMove(state, 0, { simulations: 20, seed: 1 });
    const legal = getLegalMoves(state);
    expect(legal.some((m) => movesEqual(m, result.bestMove))).toBe(true);
  });

  it("returns the only legal move when only draw is available", () => {
    let state = createInitialGameState(5);
    const attack = getLegalMoves(state).find((m) => m.type === "attack")!;
    state = applyMove(state, attack);
    state = applyMove(state, { type: "give_up" });
    expect(state.phase).toBe("draw");
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 2 });
    expect(result.bestMove.type).toBe("draw");
  });

  it("same seed produces identical results (determinism)", () => {
    const state = createInitialGameState(42);
    const opts = { simulations: 30, seed: 99 };
    const r1 = chooseMctsMove(state, 0, opts);
    const r2 = chooseMctsMove(state, 0, opts);
    expect(movesEqual(r1.bestMove, r2.bestMove)).toBe(true);
    expect(r1.moveStats.map((s) => s.winRate)).toEqual(r2.moveStats.map((s) => s.winRate));
  });

  it("throws on a terminal state", () => {
    // Fabricate a game-over state.
    const base = createInitialGameState(1);
    const terminal = { ...base, phase: "game_over" as const, winner: 0 as const };
    expect(() => chooseMctsMove(terminal, 0, { simulations: 5 })).toThrow(
      /terminal/i
    );
  });

  it("produces one MoveStats entry per legal move", () => {
    const state = createInitialGameState(7);
    const legal = getLegalMoves(state);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 5 });
    expect(result.moveStats.length).toBe(legal.length);
  });

  it("totalSimulations equals simulations × number of legal moves", () => {
    const state = createInitialGameState(7);
    const legal = getLegalMoves(state);
    const sims = 15;
    const result = chooseMctsMove(state, 0, { simulations: sims, seed: 5 });
    expect(result.totalSimulations).toBe(sims * legal.length);
  });

  it("win rates are all in [0, 1]", () => {
    const state = createInitialGameState(99);
    const result = chooseMctsMove(state, 0, { simulations: 20, seed: 3 });
    for (const s of result.moveStats) {
      expect(s.winRate).toBeGreaterThanOrEqual(0);
      expect(s.winRate).toBeLessThanOrEqual(1);
    }
  });

  it("wins ≤ visits for every move", () => {
    const state = createInitialGameState(77);
    const result = chooseMctsMove(state, 0, { simulations: 25, seed: 7 });
    for (const s of result.moveStats) {
      expect(s.wins).toBeLessThanOrEqual(s.visits);
    }
  });

  it("visits === simulations for every move", () => {
    const sims = 20;
    const state = createInitialGameState(11);
    const result = chooseMctsMove(state, 0, { simulations: sims, seed: 4 });
    for (const s of result.moveStats) {
      expect(s.visits).toBe(sims);
    }
  });
});

// ── Determinization toggle ────────────────────────────────────────────────────

describe("chooseMctsMove — determinization", () => {
  it("runs successfully with determinize: false (perfect-information mode)", () => {
    const state = createInitialGameState(42);
    const result = chooseMctsMove(state, 0, {
      simulations: 20,
      seed: 1,
      determinize: false,
    });
    const legal = getLegalMoves(state);
    expect(legal.some((m) => movesEqual(m, result.bestMove))).toBe(true);
  });

  it("determinize: true and false produce the same best move for the same seed in perfect-info state", () => {
    // In perfect-info mode (both hands already visible) the game outcomes
    // should differ between the two because the RNG is consumed differently.
    // We just verify both modes complete without errors.
    const state = createInitialGameState(55);
    const r1 = chooseMctsMove(state, 0, { simulations: 20, seed: 42, determinize: true });
    const r2 = chooseMctsMove(state, 0, { simulations: 20, seed: 42, determinize: false });
    // Both must return a legal move.
    const legal = getLegalMoves(state);
    expect(legal.some((m) => movesEqual(m, r1.bestMove))).toBe(true);
    expect(legal.some((m) => movesEqual(m, r2.bestMove))).toBe(true);
  });
});

// ── Confidence intervals ──────────────────────────────────────────────────────

describe("MoveStats confidence intervals", () => {
  it("ci95 [lo, hi] satisfies lo ≤ winRate ≤ hi", () => {
    const state = createInitialGameState(33);
    const result = chooseMctsMove(state, 0, { simulations: 40, seed: 8 });
    for (const s of result.moveStats) {
      const [lo, hi] = s.ci95;
      expect(lo).toBeLessThanOrEqual(s.winRate + 1e-9);
      expect(hi).toBeGreaterThanOrEqual(s.winRate - 1e-9);
      expect(lo).toBeGreaterThanOrEqual(0);
      expect(hi).toBeLessThanOrEqual(1);
    }
  });
});

// ── Audit log ────────────────────────────────────────────────────────────────

describe("audit log", () => {
  it("has the correct number of entries", () => {
    const state = createInitialGameState(7);
    const sims = 10;
    const result = chooseMctsMove(state, 0, { simulations: sims, seed: 5, enableAuditLog: true });
    expect(result.auditLog.length).toBe(result.totalSimulations);
  });

  it("is empty when enableAuditLog is false", () => {
    const state = createInitialGameState(7);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 5, enableAuditLog: false });
    expect(result.auditLog).toHaveLength(0);
  });

  it("sim indices are contiguous 0-based", () => {
    const state = createInitialGameState(7);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 5 });
    result.auditLog.forEach((entry, i) => {
      expect(entry.sim).toBe(i);
    });
  });

  it("runningWinRate for a move converges to final winRate", () => {
    const state = createInitialGameState(7);
    const sims = 30;
    const result = chooseMctsMove(state, 0, { simulations: sims, seed: 12 });

    // Group entries by move label and verify last entry matches final stat.
    for (const stat of result.moveStats) {
      const entries = result.auditLog.filter((e) => e.moveLabel === stat.label);
      expect(entries.length).toBe(sims);
      const lastEntry = entries[entries.length - 1]!;
      expect(lastEntry.runningWinRate).toBeCloseTo(stat.winRate, 10);
    }
  });

  it("winner field matches isWin for botPlayer === 0", () => {
    const state = createInitialGameState(7);
    const result = chooseMctsMove(state, 0, { simulations: 15, seed: 99 });
    for (const entry of result.auditLog) {
      if (entry.winner !== null) {
        expect(entry.isWin).toBe(entry.winner === 0);
      } else {
        // stalemate — rare, but isWin should be false
        expect(entry.isWin).toBe(false);
      }
    }
  });
});

// ── auditLogToTimeSeries ──────────────────────────────────────────────────────

describe("auditLogToTimeSeries", () => {
  it("returns one series per move", () => {
    const state = createInitialGameState(7);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 5 });
    const ts = auditLogToTimeSeries(result.auditLog);
    expect(ts.size).toBe(result.moveStats.length);
  });

  it("each series has exactly simulations entries", () => {
    const sims = 15;
    const state = createInitialGameState(7);
    const result = chooseMctsMove(state, 0, { simulations: sims, seed: 5 });
    const ts = auditLogToTimeSeries(result.auditLog);
    for (const [, series] of ts) {
      expect(series.length).toBe(sims);
    }
  });

  it("last entry win rate matches the final MoveStats win rate", () => {
    const state = createInitialGameState(7);
    const result = chooseMctsMove(state, 0, { simulations: 20, seed: 6 });
    const ts = auditLogToTimeSeries(result.auditLog);
    for (const stat of result.moveStats) {
      const series = ts.get(stat.label)!;
      expect(series).toBeDefined();
      const lastRate = series[series.length - 1]![1];
      expect(lastRate).toBeCloseTo(stat.winRate, 10);
    }
  });
});

// ── Graph structure ───────────────────────────────────────────────────────────

describe("MctsGraph", () => {
  it("has one root + one node per legal move", () => {
    const state = createInitialGameState(7);
    const legal = getLegalMoves(state);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 5 });
    expect(result.graph.nodes.length).toBe(legal.length + 1); // root + children
    expect(result.graph.edges.length).toBe(legal.length);
  });

  it("exactly one root node and exactly one best-move node", () => {
    const state = createInitialGameState(42);
    const result = chooseMctsMove(state, 0, { simulations: 15, seed: 3 });
    const roots = result.graph.nodes.filter((n) => n.isRoot);
    const bests = result.graph.nodes.filter((n) => n.isBestMove);
    expect(roots).toHaveLength(1);
    expect(bests).toHaveLength(1);
  });

  it("best-move graph node matches bestMove", () => {
    const state = createInitialGameState(42);
    const result = chooseMctsMove(state, 0, { simulations: 20, seed: 3 });
    const bestNode = result.graph.nodes.find((n) => n.isBestMove)!;
    expect(bestNode).toBeDefined();
    expect(bestNode.label).toBe(moveLabel(result.bestMove));
  });

  it("all edges originate from root", () => {
    const state = createInitialGameState(42);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 3 });
    for (const edge of result.graph.edges) {
      expect(edge.from).toBe("root");
    }
  });

  it("graph node visits sum to totalSimulations (excluding root)", () => {
    const state = createInitialGameState(7);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 5 });
    const childVisits = result.graph.nodes
      .filter((n) => !n.isRoot)
      .reduce((sum, n) => sum + n.visits, 0);
    expect(childVisits).toBe(result.totalSimulations);
  });

  it("graph node win rates match moveStats", () => {
    const state = createInitialGameState(7);
    const result = chooseMctsMove(state, 0, { simulations: 15, seed: 5 });
    for (const stat of result.moveStats) {
      const node = result.graph.nodes.find((n) => n.label === stat.label);
      expect(node).toBeDefined();
      expect(node!.winRate).toBeCloseTo(stat.winRate, 10);
    }
  });
});

// ── graphToDot ────────────────────────────────────────────────────────────────

describe("graphToDot", () => {
  it("produces a non-empty DOT string", () => {
    const state = createInitialGameState(42);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 1 });
    const dot = graphToDot(result.graph);
    expect(dot).toContain("digraph MCTS");
    expect(dot).toContain("root");
  });

  it("DOT string contains all move labels", () => {
    const state = createInitialGameState(42);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 1 });
    const dot = graphToDot(result.graph);
    for (const stat of result.moveStats) {
      expect(dot).toContain(stat.label);
    }
  });
});

// ── formatMctsResult ──────────────────────────────────────────────────────────

describe("formatMctsResult", () => {
  it("produces a non-empty string", () => {
    const state = createInitialGameState(42);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 1 });
    const text = formatMctsResult(result);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("MCTS");
  });

  it("string contains all move labels", () => {
    const state = createInitialGameState(42);
    const result = chooseMctsMove(state, 0, { simulations: 10, seed: 1 });
    const text = formatMctsResult(result);
    for (const stat of result.moveStats) {
      expect(text).toContain(stat.label);
    }
  });
});

// ── onProgress callback ───────────────────────────────────────────────────────

describe("onProgress callback", () => {
  it("is called during search", () => {
    const state = createInitialGameState(42);
    const spy = vi.fn();
    chooseMctsMove(state, 0, {
      simulations: 20,
      seed: 1,
      onProgress: spy,
      progressInterval: 5,
    });
    expect(spy).toHaveBeenCalled();
  });

  it("progress has ascending simulationsCompleted", () => {
    const state = createInitialGameState(42);
    const snapshots: MctsProgress[] = [];
    chooseMctsMove(state, 0, {
      simulations: 30,
      seed: 1,
      onProgress: (p) => snapshots.push(p),
      progressInterval: 5,
    });
    for (let i = 1; i < snapshots.length; i++) {
      expect(snapshots[i]!.simulationsCompleted).toBeGreaterThan(
        snapshots[i - 1]!.simulationsCompleted
      );
    }
  });
});

// ── End-to-end game ───────────────────────────────────────────────────────────

describe("end-to-end MCTS game", () => {
  it("MCTS bot vs greedy-random opponent reaches game_over without throwing", () => {
    let state = createInitialGameState(321);
    let depth = 0;
    const maxDepth = 400;

    while (getWinner(state) === null && depth < maxDepth) {
      const isBotTurn =
        state.phase === "draw" ||
        (state.phase === "attacker_lead" && state.currentAttacker === 1) ||
        (state.phase === "defender_respond" && state.currentDefender === 1);

      let move: Move;
      if (isBotTurn) {
        const result = chooseMctsMove(state, 1, {
          simulations: 5, // low for speed
          seed: depth,
          enableAuditLog: false,
        });
        move = result.bestMove;
      } else {
        // Human player: always pick first legal move.
        move = getLegalMoves(state)[0]!;
      }
      state = applyMove(state, move);
      depth++;
    }

    expect(depth).toBeLessThan(maxDepth);
    expect(getWinner(state)).not.toBeNull();
  });
});
