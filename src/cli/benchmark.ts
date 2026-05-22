/**
 * Head-to-head bot benchmark.
 *
 * Runs N complete games between two AI brains and reports win rates with
 * Wilson 95% confidence intervals so you can judge whether one brain is
 * genuinely better or just got lucky.
 *
 * Usage — always name both sides explicitly:
 *
 *   npm run benchmark -- --p0 greedy    --p1 random                      # sanity check: greedy should beat random
 *   npm run benchmark -- --p0 random    --p1 mcts-fast                   # sanity check: mcts should beat random
 *   npm run benchmark -- --p0 greedy    --p1 mcts-fast  --sims 25        # main validation
 *   npm run benchmark -- --p0 greedy    --p1 mcts        --sims 50       # stronger MCTS
 *   npm run benchmark -- --p0 mcts-fast --p1 mcts        --sims 25       # fast vs full MCTS
 *   npm run benchmark -- --p0 greedy    --p1 mcts        --games 100 --sims 25 --quiet
 *
 * Flags:
 *   --p0 <brain>   Brain for Player 0 (default: greedy)
 *   --p1 <brain>   Brain for Player 1 (default: mcts-fast)
 *   --games  N     Number of complete games to play (default: 20)
 *   --sims   N     Simulations per move for MCTS brains (default: 10)
 *   --seed   N     Base seed for game deals (default: 0)
 *   --quiet        Show a progress bar instead of per-game lines
 *
 * Available brains: random | greedy | mcts-fast | mcts
 *
 * Diagnostic ladder — run these in order to isolate a broken brain:
 *   1. greedy vs random    → greedy should win clearly  (validates greedy)
 *   2. mcts   vs random    → mcts   should win clearly  (validates mcts baseline)
 *   3. mcts   vs greedy    → mcts   should win          (validates mcts improvement)
 *   If step 1 passes but step 2 fails, MCTS is likely the broken component.
 *
 * Statistical note:
 *   Non-overlapping CI95 bands ≈ p < 0.05.
 *   With 20 games the bands span ~±20 pp — use --games 100+ for firm conclusions.
 */

import {
  createInitialGameState,
  getLegalMoves,
  applyMove,
  getWinner,
} from "../engine";
import type { PlayerId } from "../engine";
import type { BotBrain } from "../ai/botBrain";
import {
  BOT_BRAIN_LABELS,
  BOT_BRAIN_OPTIONS,
  BOT_BRAIN_SIMS,
  isMctsBrain,
  pickBotMove,
} from "../ai/botBrain";

// ── Arg parsing ───────────────────────────────────────────────────────────────

function opt(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}
function flag(name: string): boolean {
  return process.argv.includes(name);
}
function asBrain(raw: string, flag: string): BotBrain {
  if ((BOT_BRAIN_OPTIONS as readonly string[]).includes(raw)) return raw as BotBrain;
  console.error(
    `Unknown brain "${raw}" for ${flag}.\n` +
    `Available: ${BOT_BRAIN_OPTIONS.join(" | ")}`
  );
  process.exit(1);
}

const P0_BRAIN  = asBrain(opt("--p0",    "greedy"),    "--p0");
const P1_BRAIN  = asBrain(opt("--p1",    "mcts-fast"), "--p1");
const GAMES     = Math.max(1, parseInt(opt("--games",  "20"),  10));
const SIMS      = Math.max(1, parseInt(opt("--sims",   "10"),  10));
const BASE_SEED = parseInt(opt("--seed", "0"), 10);
const QUIET     = flag("--quiet");

// Apply --sims to MCTS brains. Has no effect when neither brain is MCTS.
BOT_BRAIN_SIMS["mcts-fast"] = SIMS;
BOT_BRAIN_SIMS["mcts"]      = SIMS;

// ── Helpers ───────────────────────────────────────────────────────────────────

function wilsonCI(wins: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const z = 1.96;
  const p = wins / n;
  const denom = n + z * z;
  const center = (wins + (z * z) / 2) / denom;
  const margin = (z * Math.sqrt(n * p * (1 - p) + (z * z) / 4)) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function simsNote(brain: BotBrain): string {
  return isMctsBrain(brain) ? `  [--sims ${SIMS}]` : "";
}

/**
 * Plays one complete game between P0_BRAIN and P1_BRAIN.
 * Returns the index of the winning player (0 or 1).
 */
function playGame(gameSeed: number): PlayerId {
  let state = createInitialGameState(gameSeed);
  let turn = 0;

  while (getWinner(state) === null) {
    const moves = getLegalMoves(state);
    if (moves.length === 0) break;

    // Draw is mandatory — no AI decision.
    if (state.phase === "draw") {
      state = applyMove(state, { type: "draw" });
      turn++;
      continue;
    }

    const actor: PlayerId =
      state.phase === "attacker_lead"
        ? state.currentAttacker
        : state.currentDefender;

    const brain = actor === 0 ? P0_BRAIN : P1_BRAIN;
    // Unique seed per (game × turn × player) keeps MCTS and random reproducible.
    const moveSeed = gameSeed * 100_000 + turn * 10 + actor;

    const move = pickBotMove(state, actor, brain, moveSeed);
    if (!move) break;
    state = applyMove(state, move);
    turn++;

    if (turn > 2_000) {
      console.warn(`  Warning: game seed=${gameSeed} hit 2000-turn safety limit.`);
      break;
    }
  }

  return getWinner(state) ?? 0;
}

// ── Banner ────────────────────────────────────────────────────────────────────

const W    = 72;
const rule = "═".repeat(W);
const thin = "─".repeat(W);

console.log(rule);
console.log("Head-to-head benchmark");
console.log(
  `  P0  --p0 ${P0_BRAIN.padEnd(10)}  ${BOT_BRAIN_LABELS[P0_BRAIN]}${simsNote(P0_BRAIN)}`
);
console.log(
  `  P1  --p1 ${P1_BRAIN.padEnd(10)}  ${BOT_BRAIN_LABELS[P1_BRAIN]}${simsNote(P1_BRAIN)}`
);
console.log(`  --games ${GAMES}  --seed ${BASE_SEED}`);
if (!isMctsBrain(P0_BRAIN) && !isMctsBrain(P1_BRAIN)) {
  console.log("  Note: --sims has no effect when neither brain is MCTS.");
}
console.log(rule);
console.log();

// ── Run games ─────────────────────────────────────────────────────────────────

let p0Wins = 0;
let p1Wins = 0;
const startMs = Date.now();

for (let g = 0; g < GAMES; g++) {
  const winner = playGame(BASE_SEED + g);
  if (winner === 0) p0Wins++;
  else p1Wins++;

  const played = g + 1;

  if (!QUIET) {
    const lead = p0Wins >= p1Wins ? "P0" : "P1";
    console.log(
      `  [${String(played).padStart(String(GAMES).length)}/${GAMES}]` +
      `  winner=P${winner}` +
      `  running: P0 ${pct(p0Wins / played)} — P1 ${pct(p1Wins / played)}` +
      `  (${lead} leads)`
    );
  } else {
    const bar = "█".repeat(Math.round((played / GAMES) * 30)).padEnd(30, "░");
    process.stdout.write(`\r  ${bar}  ${played}/${GAMES} games`);
  }
}

if (QUIET) process.stdout.write("\n");

const elapsedMs = Date.now() - startMs;

// ── Results ───────────────────────────────────────────────────────────────────

const [p0Lo, p0Hi] = wilsonCI(p0Wins, GAMES);
const [p1Lo, p1Hi] = wilsonCI(p1Wins, GAMES);

console.log();
console.log(rule);
console.log(`Results after ${GAMES} games  (${elapsedMs}ms)`);
console.log(thin);
console.log(
  `P0  ${BOT_BRAIN_LABELS[P0_BRAIN].padEnd(22)}` +
  `wins: ${String(p0Wins).padStart(3)}  (${pct(p0Wins / GAMES)})` +
  `  CI95=[${pct(p0Lo)}, ${pct(p0Hi)}]`
);
console.log(
  `P1  ${BOT_BRAIN_LABELS[P1_BRAIN].padEnd(22)}` +
  `wins: ${String(p1Wins).padStart(3)}  (${pct(p1Wins / GAMES)})` +
  `  CI95=[${pct(p1Lo)}, ${pct(p1Hi)}]`
);
console.log(thin);

const ciOverlap = p0Hi > p1Lo && p1Hi > p0Lo;
if (ciOverlap) {
  console.log("CI95 bands overlap — cannot claim statistical significance.");
  console.log(`Tip: rerun with --games ${GAMES * 5} for tighter intervals.`);
} else {
  const winner = p0Wins > p1Wins
    ? `P0 (${BOT_BRAIN_LABELS[P0_BRAIN]})`
    : `P1 (${BOT_BRAIN_LABELS[P1_BRAIN]})`;
  console.log(`CI95 bands do NOT overlap — ${winner} wins significantly (p<0.05).`);
}
console.log(rule);
