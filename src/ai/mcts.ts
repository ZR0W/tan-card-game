/**
 * Monte Carlo Move Evaluation (Story 4.2).
 *
 * Algorithm — flat Monte Carlo with determinization:
 *   For each legal move M:
 *     For each simulation 1..N:
 *       1. Sample a determinized world state (shuffles opponent hand + deck).
 *       2. Apply M to that world.
 *       3. Play out randomly to terminal.
 *       4. Record win/loss for `botPlayer`.
 *   Pick the move with the highest win rate.
 *
 * The audit API (MctsResult.auditLog + MctsResult.graph) lets callers
 * inspect every simulation and render the search as a graph.
 */

import type { GameState, PlayerId } from "@engine/gameState";
import type { Move } from "@engine/rules";
import { getLegalMoves, applyMove, getWinner } from "@engine/rules";
import { runFromState } from "@engine/simulator";
import { createRng } from "@engine/rng";
import { generateDeterminizedState } from "./determinization";

// ── Public types ────────────────────────────────────────────────────────────

export interface MctsOptions {
  /** Simulations run per legal move (default: 100). */
  simulations?: number;
  /** Base seed for the RNG — same seed ⇒ identical result (default: Date.now()). */
  seed?: number;
  /**
   * Resample opponent hand + deck for each simulation (default: true).
   * Set false for perfect-information benchmarks or tests.
   */
  determinize?: boolean;
  /** Fired every `progressInterval` simulations across all moves. */
  onProgress?: (progress: MctsProgress) => void;
  /** How frequently to invoke `onProgress` (default: 10). */
  progressInterval?: number;
  /** Collect per-simulation audit entries (default: true). */
  enableAuditLog?: boolean;
}

/** Win-rate statistics for one legal move. */
export interface MoveStats {
  move: Move;
  /** Human-readable label, e.g. "attack[2]", "defend[0]", "pass_attack". */
  label: string;
  visits: number;
  wins: number;
  winRate: number;
  /** Wilson score 95 % confidence interval [lo, hi]. Both 0 when visits === 0. */
  ci95: [number, number];
}

/** Snapshot emitted by `onProgress` during the search. */
export interface MctsProgress {
  simulationsCompleted: number;
  totalSimulations: number;
  elapsedMs: number;
  /** All moves sorted by descending win rate at this point in time. */
  moveStats: MoveStats[];
}

/** One row in the per-simulation audit log. */
export interface MctsAuditEntry {
  /** Global simulation index (0-based, across all moves). */
  sim: number;
  move: Move;
  moveLabel: string;
  winner: PlayerId | null;
  isWin: boolean;
  /** Win rate for this specific move up to and including this simulation. */
  runningWinRate: number;
}

// ── Graph types (visualization API) ─────────────────────────────────────────

/** One node in the search result graph. Root = current position, leaves = moves. */
export interface MctsGraphNode {
  id: string;
  label: string;
  visits: number;
  wins: number;
  winRate: number;
  ciLow: number;
  ciHigh: number;
  isRoot: boolean;
  isBestMove: boolean;
}

/** Directed edge from the root node to a move-node. */
export interface MctsGraphEdge {
  from: string;
  to: string;
  move: Move;
  moveLabel: string;
  /** Equal to the child node's win rate — useful as a visual weight. */
  weight: number;
}

/** Serializable graph of the MCTS search result, ready for any graph renderer. */
export interface MctsGraph {
  nodes: MctsGraphNode[];
  edges: MctsGraphEdge[];
  /** ISO 8601 timestamp of when the search completed. */
  timestamp: string;
  bestMove: Move;
  totalSimulations: number;
  elapsedMs: number;
}

/** Full result returned by `chooseMctsMove`. */
export interface MctsResult {
  bestMove: Move;
  /** Stats for every legal move, in the same order as `getLegalMoves`. */
  moveStats: MoveStats[];
  totalSimulations: number;
  elapsedMs: number;
  /** Per-simulation log (empty when `enableAuditLog: false`). */
  auditLog: MctsAuditEntry[];
  /** Graph structure for external visualization (see `graphToDot`). */
  graph: MctsGraph;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

export function moveLabel(move: Move): string {
  switch (move.type) {
    case "attack":
      return `attack[${move.cardIndex}]`;
    case "defend":
      return `defend[${move.cardIndex}]`;
    default:
      return move.type;
  }
}

/**
 * Wilson score confidence interval for a proportion.
 * More accurate than the normal approximation for small n.
 */
function wilsonCI(wins: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96; // 95 %
  const p = wins / n;
  const denom = n + z * z;
  const center = (wins + (z * z) / 2) / denom;
  const margin = (z * Math.sqrt(n * p * (1 - p) + (z * z) / 4)) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

function buildMoveStats(move: Move, wins: number, visits: number): MoveStats {
  const winRate = visits > 0 ? wins / visits : 0;
  return {
    move,
    label: moveLabel(move),
    visits,
    wins,
    winRate,
    ci95: wilsonCI(wins, visits),
  };
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Chooses the best move for `botPlayer` via flat Monte Carlo simulation.
 *
 * `botPlayer` must be the player whose turn it is in `state`; this is the
 * same convention as `chooseGreedyMove`.
 *
 * Story 4.2 deliverable.
 */
export function chooseMctsMove(
  state: GameState,
  botPlayer: PlayerId,
  options: MctsOptions = {}
): MctsResult {
  const {
    simulations = 100,
    seed = Date.now(),
    determinize = true,
    onProgress,
    progressInterval = 10,
    enableAuditLog = true,
  } = options;

  if (getWinner(state) !== null) {
    throw new Error("chooseMctsMove called on a terminal state");
  }
  const moves = getLegalMoves(state);
  if (moves.length === 0) {
    throw new Error("No legal moves in current state");
  }

  const startMs = Date.now();
  const rng = createRng(seed);
  const totalPlanned = moves.length * simulations;

  const visitCounts = new Array<number>(moves.length).fill(0);
  const winCounts = new Array<number>(moves.length).fill(0);
  const auditLog: MctsAuditEntry[] = [];
  let globalSim = 0;

  for (let mi = 0; mi < moves.length; mi++) {
    const move = moves[mi]!;
    const label = moveLabel(move);

    for (let s = 0; s < simulations; s++) {
      // Step 1: sample a world (determinize or use as-is).
      const worldState = determinize
        ? generateDeterminizedState(state, botPlayer, rng)
        : state;

      // Step 2: apply the candidate move in that world.
      const nextState = applyMove(worldState, move);

      // Step 3: random playout to terminal.
      const finalState = runFromState(nextState, rng);

      // Step 4: record outcome.
      const winner = getWinner(finalState);
      const isWin = winner === botPlayer;
      visitCounts[mi]++;
      if (isWin) winCounts[mi]++;
      globalSim++;

      const runningWinRate = winCounts[mi]! / visitCounts[mi]!;

      if (enableAuditLog) {
        auditLog.push({
          sim: globalSim - 1,
          move,
          moveLabel: label,
          winner,
          isWin,
          runningWinRate,
        });
      }

      if (onProgress && globalSim % progressInterval === 0) {
        const elapsed = Date.now() - startMs;
        const stats = moves.map((m, i) =>
          buildMoveStats(m, winCounts[i]!, visitCounts[i]!)
        );
        stats.sort((a, b) => b.winRate - a.winRate);
        onProgress({
          simulationsCompleted: globalSim,
          totalSimulations: totalPlanned,
          elapsedMs: elapsed,
          moveStats: stats,
        });
      }
    }
  }

  // Build final move stats.
  const moveStats = moves.map((m, i) =>
    buildMoveStats(m, winCounts[i]!, visitCounts[i]!)
  );

  // Best move = highest win rate; ties go to the move listed first.
  let bestIdx = 0;
  for (let i = 1; i < moveStats.length; i++) {
    if (moveStats[i]!.winRate > moveStats[bestIdx]!.winRate) {
      bestIdx = i;
    }
  }
  const bestMove = moves[bestIdx]!;
  const elapsedMs = Date.now() - startMs;

  // Build the graph representation.
  const ROOT_ID = "root";
  const graphNodes: MctsGraphNode[] = [
    {
      id: ROOT_ID,
      label: "Current Position",
      visits: globalSim,
      wins: winCounts.reduce((a, b) => a + b, 0),
      winRate:
        winCounts.reduce((a, b) => a + b, 0) /
        Math.max(1, visitCounts.reduce((a, b) => a + b, 0)),
      ciLow: 0,
      ciHigh: 0,
      isRoot: true,
      isBestMove: false,
    },
  ];
  const graphEdges: MctsGraphEdge[] = [];

  for (let i = 0; i < moves.length; i++) {
    const stat = moveStats[i]!;
    const nodeId = `move_${i}`;
    const [ciLow, ciHigh] = stat.ci95;
    graphNodes.push({
      id: nodeId,
      label: stat.label,
      visits: stat.visits,
      wins: stat.wins,
      winRate: stat.winRate,
      ciLow,
      ciHigh,
      isRoot: false,
      isBestMove: i === bestIdx,
    });
    graphEdges.push({
      from: ROOT_ID,
      to: nodeId,
      move: moves[i]!,
      moveLabel: stat.label,
      weight: stat.winRate,
    });
  }

  const graph: MctsGraph = {
    nodes: graphNodes,
    edges: graphEdges,
    timestamp: new Date().toISOString(),
    bestMove,
    totalSimulations: globalSim,
    elapsedMs,
  };

  return { bestMove, moveStats, totalSimulations: globalSim, elapsedMs, auditLog, graph };
}

// ── Logging / visualization utilities ────────────────────────────────────────

/**
 * Formats a search result as a human-readable console table.
 *
 * Example output:
 *   MCTS: 500 simulations in 42ms | best: attack[3]
 *   attack[3]     ████████████░░░░░░░░  62.0% (62/100)  CI95=[52.2%, 71.0%]
 *   defend[1]     ██████████░░░░░░░░░░  51.0% (51/100)  CI95=[41.1%, 60.9%]
 *   give_up       ████░░░░░░░░░░░░░░░░  18.0% (18/100)  CI95=[11.0%, 27.3%]
 */
export function formatMctsResult(result: MctsResult): string {
  const lines: string[] = [
    `MCTS: ${result.totalSimulations} simulations in ${result.elapsedMs}ms | best: ${moveLabel(result.bestMove)}`,
    "",
    "Move              Win rate              Wins/Visits  CI95",
    "─".repeat(72),
  ];

  const sorted = [...result.moveStats].sort((a, b) => b.winRate - a.winRate);
  for (const stat of sorted) {
    const pct = (stat.winRate * 100).toFixed(1).padStart(5);
    const filled = Math.round(stat.winRate * 20);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);
    const [lo, hi] = stat.ci95;
    const ci = `[${(lo * 100).toFixed(1)}%, ${(hi * 100).toFixed(1)}%]`;
    const best = stat.move === result.bestMove ? " ◀" : "";
    lines.push(
      `${stat.label.padEnd(16)}  ${bar}  ${pct}%  (${String(stat.wins).padStart(3)}/${stat.visits})  CI95=${ci}${best}`
    );
  }
  return lines.join("\n");
}

/**
 * Exports the search graph as a Graphviz DOT string.
 *
 * Render with: `dot -Tsvg mcts.dot -o mcts.svg`
 *
 * Best-move node is shaded green; root is shaded yellow.
 */
export function graphToDot(graph: MctsGraph): string {
  const lines: string[] = [
    "digraph MCTS {",
    '  rankdir=LR;',
    '  node [shape=box fontname="Courier"];',
    `  label="MCTS search — ${graph.totalSimulations} sims, ${graph.elapsedMs}ms\\nbest: ${moveLabel(graph.bestMove)}";`,
    '  labelloc=t;',
  ];

  for (const node of graph.nodes) {
    const pct = (node.winRate * 100).toFixed(1);
    const ci = node.isRoot
      ? ""
      : `\\nCI95: [${(node.ciLow * 100).toFixed(0)}%, ${(node.ciHigh * 100).toFixed(0)}%]`;
    const label = node.isRoot
      ? `Current Position\\n${graph.totalSimulations} sims`
      : `${node.label}\\n${pct}% (${node.wins}/${node.visits})${ci}`;
    const fill = node.isBestMove
      ? "lightgreen"
      : node.isRoot
        ? "lightyellow"
        : "white";
    lines.push(
      `  "${node.id}" [label="${label}" style=filled fillcolor=${fill}];`
    );
  }

  for (const edge of graph.edges) {
    const pct = (edge.weight * 100).toFixed(1);
    lines.push(
      `  "${edge.from}" -> "${edge.to}" [label="${pct}%"];`
    );
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * Summarises how each move's win rate evolved over time.
 *
 * Returns a map from move label → array of [simIndex, runningWinRate] pairs,
 * one entry per simulation for that move. Suitable for plotting time-series
 * charts (e.g. win-rate convergence curves).
 */
export function auditLogToTimeSeries(
  auditLog: MctsAuditEntry[]
): Map<string, Array<[number, number]>> {
  const series = new Map<string, Array<[number, number]>>();
  for (const entry of auditLog) {
    if (!series.has(entry.moveLabel)) series.set(entry.moveLabel, []);
    series.get(entry.moveLabel)!.push([entry.sim, entry.runningWinRate]);
  }
  return series;
}
