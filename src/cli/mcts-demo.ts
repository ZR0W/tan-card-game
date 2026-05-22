/**
 * MCTS demo / manual-testing script.
 *
 * Usage:
 *   npm run mcts-demo                  # seed 42, 100 sims/move
 *   npm run mcts-demo -- --seed 7      # custom seed
 *   npm run mcts-demo -- --sims 200    # more simulations
 *   npm run mcts-demo -- --no-det      # disable determinization
 *   npm run mcts-demo -- --dot         # also emit Graphviz DOT to mcts.dot
 *   npm run mcts-demo -- --series      # print win-rate convergence table
 */

import * as fs from "node:fs";
import { createInitialGameState, getLegalMoves, applyMove, getWinner } from "../engine";
import {
  chooseMctsMove,
  formatMctsResult,
  graphToDot,
  auditLogToTimeSeries,
} from "../ai/mcts";
import type { MctsProgress } from "../ai/mcts";

// ── Arg parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1]! : fallback;
};

const SEED = parseInt(opt("--seed", "42"), 10);
const SIMS = parseInt(opt("--sims", "100"), 10);
const DETERMINIZE = !flag("--no-det");
const EMIT_DOT = flag("--dot");
const SHOW_SERIES = flag("--series");

// ── Setup ────────────────────────────────────────────────────────────────────

const state = createInitialGameState(SEED);

console.log("═".repeat(72));
console.log(`MCTS demo  seed=${SEED}  sims/move=${SIMS}  determinize=${DETERMINIZE}`);
console.log("═".repeat(72));
console.log();
console.log(`Legal moves: ${getLegalMoves(state).length}`);
console.log(`Trump suit:  ${state.trumpSuit}`);
console.log(`Deck size:   ${state.deck.length}`);
console.log(`P0 hand:     [${state.players[0].hand.map(c => `${c.rank}${c.suit[0]}`).join(", ")}]`);
console.log(`P1 hand:     [${state.players[1].hand.map(c => `${c.rank}${c.suit[0]}`).join(", ")}]`);
console.log();

// ── Run MCTS ─────────────────────────────────────────────────────────────────

const progressSnapshots: MctsProgress[] = [];

console.log("Running MCTS…");
const result = chooseMctsMove(state, 0, {
  simulations: SIMS,
  seed: SEED + 1,
  determinize: DETERMINIZE,
  enableAuditLog: true,
  progressInterval: Math.max(1, Math.floor((SIMS * getLegalMoves(state).length) / 10)),
  onProgress(p) {
    progressSnapshots.push(p);
    const pct = ((p.simulationsCompleted / p.totalSimulations) * 100).toFixed(0);
    const lead = p.moveStats[0]!;
    process.stdout.write(
      `\r  ${pct.padStart(3)}%  lead=${lead.label} @ ${(lead.winRate * 100).toFixed(1)}%   `
    );
  },
});
process.stdout.write("\r" + " ".repeat(60) + "\r");

// ── Results table ─────────────────────────────────────────────────────────────

console.log(formatMctsResult(result));
console.log();
console.log(`Elapsed: ${result.elapsedMs}ms`);
console.log();

// ── Win-rate convergence (--series) ──────────────────────────────────────────

if (SHOW_SERIES) {
  console.log("Win-rate convergence (every 10th simulation per move):");
  console.log("─".repeat(72));
  const ts = auditLogToTimeSeries(result.auditLog);
  const labels = [...ts.keys()];

  // Header row
  const header = "Sim".padEnd(6) + labels.map(l => l.padEnd(14)).join("");
  console.log(header);
  console.log("─".repeat(header.length));

  // Sample every 10th sim per move (use the first move's series as the index)
  const firstSeries = ts.get(labels[0]!)!;
  const step = Math.max(1, Math.floor(firstSeries.length / 20));
  for (let i = step - 1; i < firstSeries.length; i += step) {
    const row = String(i + 1).padEnd(6) +
      labels.map(label => {
        const s = ts.get(label)!;
        return ((s[i]?.[1] ?? 0) * 100).toFixed(1).padStart(5) + "%     ";
      }).join("");
    console.log(row);
  }
  // Final row
  const lastRow = String(firstSeries.length).padEnd(6) +
    labels.map(label => {
      const s = ts.get(label)!;
      return ((s[s.length - 1]![1]) * 100).toFixed(1).padStart(5) + "%     ";
    }).join("");
  console.log(lastRow);
  console.log();
}

// ── DOT graph (--dot) ─────────────────────────────────────────────────────────

if (EMIT_DOT) {
  const dot = graphToDot(result.graph);
  fs.writeFileSync("mcts.dot", dot, "utf8");
  console.log("Graphviz DOT written to: mcts.dot");
  console.log("Render with:");
  console.log("  dot -Tsvg mcts.dot -o mcts.svg   (Graphviz)");
  console.log("  dot -Tpng mcts.dot -o mcts.png");
  console.log();
  console.log("Or paste the DOT below into https://dreampuf.github.io/GraphvizOnline/");
  console.log();
  console.log(dot);
  console.log();
}

// ── Audit log summary ─────────────────────────────────────────────────────────

console.log("Audit log summary:");
console.log(`  Total entries : ${result.auditLog.length}`);
const wins = result.auditLog.filter(e => e.isWin).length;
const nulls = result.auditLog.filter(e => e.winner === null).length;
console.log(`  Overall wins  : ${wins} / ${result.totalSimulations} (${(wins / result.totalSimulations * 100).toFixed(1)}%)`);
if (nulls > 0) console.log(`  No-winner sims: ${nulls} (stalemate)`);
console.log();
console.log("Per-move breakdown:");
for (const stat of [...result.moveStats].sort((a, b) => b.winRate - a.winRate)) {
  const [lo, hi] = stat.ci95;
  const chosen = stat.move === result.bestMove ? " ◀ CHOSEN" : "";
  console.log(
    `  ${stat.label.padEnd(16)}  ${stat.wins}/${stat.visits}` +
    `  CI95=[${(lo * 100).toFixed(1)}%, ${(hi * 100).toFixed(1)}%]${chosen}`
  );
}
