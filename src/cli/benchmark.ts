/**
 * Head-to-head bot benchmark: run N complete games between two AI brains
 * and report win rates with Wilson 95% CI to quantify improvement.
 *
 * Usage:
 *   npm run benchmark
 *   npm run benchmark -- --p0 greedy --p1 mcts-fast
 *   npm run benchmark -- --p0 greedy --p1 mcts --games 50 --sims 20
 *   npm run benchmark -- --p0 mcts-fast --p1 mcts --games 100 --quiet
 *   npm run benchmark -- --seed 42
 *
 * Defaults: --p0 greedy  --p1 mcts-fast  --games 20  --sims 10  --seed 0
 *
 * Statistical note:
 *   Non-overlapping CI95 bands ≈ p < 0.05.  With 20 games the bands are
 *   wide (~±20 pp); use --games 100+ for publishable conclusions.
 */

import {
  createInitialGameState,
  getLegalMoves,
  applyMove,
  getWinner,
} from "../engine";
import type { PlayerId } from "../engine";
import type { BotBrain } from "../ai/botBrain";
import { BOT_BRAIN_LABELS, BOT_BRAIN_OPTIONS, BOT_BRAIN_SIMS, pickBotMove } from "../ai/botBrain";

// ── Arg parsing ──────────────────────────────────────────────────────────────

function opt(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}
function flag(name: string): boolean {
  return process.argv.includes(name);
}
function asBrain(raw: string, which: string): BotBrain {
  if (BOT_BRAIN_OPTIONS.includes(raw as BotBrain)) return raw as BotBrain;
  console.error(`Unknown brain "${raw}" for ${which}. Options: ${BOT_BRAIN_OPTIONS.join(", ")}`);
  process.exit(1);
}

const P0_BRAIN = asBrain(opt("--p0", "greedy"), "--p0");
const P1_BRAIN = asBrain(opt("--p1", "mcts-fast"), "--p1");
const GAMES     = Math.max(1, parseInt(opt("--games", "20"), 10));
const SIMS      = Math.max(1, parseInt(opt("--sims", "10"), 10));
const BASE_SEED = parseInt(opt("--seed", "0"), 10);
const QUIET     = flag("--quiet");

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Plays one complete game between two AI brains.
 * Returns the winner (0 or 1).
 */
function playGame(gameSeed: number): PlayerId {
  let state = createInitialGameState(gameSeed);
  let turn = 0;

  while (getWinner(state) === null) {
    const moves = getLegalMoves(state);
    if (moves.length === 0) break;

    // Draw is mandatory — no AI decision needed.
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
    // Derive a unique seed per (game, turn, player) for reproducible MCTS.
    const moveSeed = gameSeed * 100_000 + turn * 10 + actor;

    const move = pickBotMove(state, actor, brain, moveSeed);
    if (!move) break;
    state = applyMove(state, move);
    turn++;

    if (turn > 2_000) {
      // Guard against infinite loops (should never happen with legal moves).
      console.warn(`Game ${gameSeed} exceeded 2000 turns — aborting.`);
      break;
    }
  }

  return getWinner(state) ?? 0;
}

// ── Banner ───────────────────────────────────────────────────────────────────

const W = 72;
const rule = "═".repeat(W);
const thin  = "─".repeat(W);

function brainDesc(brain: BotBrain): string {
  const sims = BOT_BRAIN_SIMS[brain];
  return sims !== undefined
    ? `${BOT_BRAIN_LABELS[brain]} (${SIMS} sims/move overridden to match --sims)`
    : BOT_BRAIN_LABELS[brain];
}

console.log(rule);
console.log(`Head-to-head benchmark`);
console.log(`  P0: ${BOT_BRAIN_LABELS[P0_BRAIN]}   vs   P1: ${BOT_BRAIN_LABELS[P1_BRAIN]}`);
console.log(`  ${GAMES} games · MCTS sims/move: ${SIMS} · base seed: ${BASE_SEED}`);
console.log(rule);
console.log();

// Override the MCTS sim counts so --sims applies to both sides.
BOT_BRAIN_SIMS["mcts-fast"] = SIMS;
BOT_BRAIN_SIMS["mcts"]      = SIMS;

// ── Run games ─────────────────────────────────────────────────────────────────

let p0Wins = 0;
let p1Wins = 0;
const startMs = Date.now();

for (let g = 0; g < GAMES; g++) {
  const gameSeed = BASE_SEED + g;
  const winner = playGame(gameSeed);
  if (winner === 0) p0Wins++;
  else p1Wins++;

  if (!QUIET) {
    const gamesPlayed = g + 1;
    const p0Rate = p0Wins / gamesPlayed;
    const p1Rate = p1Wins / gamesPlayed;
    const lead = p0Wins >= p1Wins ? "P0" : "P1";
    console.log(
      `  [${String(gamesPlayed).padStart(String(GAMES).length)}/${GAMES}]` +
      `  winner=P${winner}` +
      `  running: P0 ${pct(p0Rate)} — P1 ${pct(p1Rate)}` +
      `  (${lead} leads)`
    );
  } else {
    const bar = "█".repeat(Math.round(((g + 1) / GAMES) * 30)).padEnd(30, "░");
    process.stdout.write(`\r  ${bar}  ${g + 1}/${GAMES} games`);
  }
}

if (QUIET) process.stdout.write("\n");

const elapsedMs = Date.now() - startMs;

// ── Results ───────────────────────────────────────────────────────────────────

const [p0Lo, p0Hi] = wilsonCI(p0Wins, GAMES);
const [p1Lo, p1Hi] = wilsonCI(p1Wins, GAMES);

console.log();
console.log(rule);
console.log(`Results after ${GAMES} games  (${elapsedMs}ms total)`);
console.log(thin);

const col1 = 16;
console.log(
  `${"P0 " + BOT_BRAIN_LABELS[P0_BRAIN]}`.padEnd(col1 + 10) +
  `wins: ${String(p0Wins).padStart(3)}  (${pct(p0Wins / GAMES)})` +
  `  CI95=[${pct(p0Lo)}, ${pct(p0Hi)}]`
);
console.log(
  `${"P1 " + BOT_BRAIN_LABELS[P1_BRAIN]}`.padEnd(col1 + 10) +
  `wins: ${String(p1Wins).padStart(3)}  (${pct(p1Wins / GAMES)})` +
  `  CI95=[${pct(p1Lo)}, ${pct(p1Hi)}]`
);

console.log(thin);

// Significance note.
const ciOverlap = p0Hi > p1Lo && p1Hi > p0Lo;
if (ciOverlap) {
  console.log("CI95 bands overlap — cannot claim statistical significance.");
  console.log(`Tip: run with --games ${GAMES * 5} for tighter intervals.`);
} else {
  const faster = p0Wins > p1Wins ? `P0 (${BOT_BRAIN_LABELS[P0_BRAIN]})` : `P1 (${BOT_BRAIN_LABELS[P1_BRAIN]})`;
  console.log(`CI95 bands do NOT overlap — ${faster} wins significantly (p<0.05).`);
}
console.log(rule);
