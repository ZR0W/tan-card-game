/**
 * CLI entry: human vs human (hot-seat), optional human vs bot, or --auto spectator.
 */
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  applyMove,
  createInitialGameState,
  createRng,
  getLegalMoves,
  getWinner,
  IllegalMoveError,
} from "../engine";
import type { GameState } from "../engine/gameState";
import type { Move } from "../engine/rules";
import { parsePlayArgs, playCliHelpText } from "./args";
import { describeMove, formatGameState } from "./format";

function shouldBotAct(state: GameState, botMode: boolean): boolean {
  if (!botMode) return false;
  if (state.phase === "draw") return true;
  if (state.phase === "attacker_lead") return state.currentAttacker === 1;
  if (state.phase === "defender_respond") return state.currentDefender === 1;
  return false;
}

function pickBotMove(
  moves: Move[],
  rng: { nextInt: (min: number, max: number) => number }
): Move {
  return moves[rng.nextInt(0, moves.length - 1)]!;
}

function parseMoveIndex(line: string, moves: Move[]): number | null {
  const t = line.trim().toLowerCase();
  if (t === "d" || t === "draw") {
    const i = moves.findIndex((m) => m.type === "draw");
    return i >= 0 ? i : null;
  }
  const n = parseInt(t, 10);
  if (Number.isNaN(n) || n < 0 || n >= moves.length) return null;
  return n;
}

async function promptMove(
  rl: readline.Interface,
  state: GameState,
  moves: Move[]
): Promise<Move> {
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i]!;
    console.log(`  ${i}: ${describeMove(m, state)}`);
  }
  for (;;) {
    const line = await rl.question("Enter move index (or d for draw): ");
    const idx = parseMoveIndex(line, moves);
    if (idx !== null) return moves[idx]!;
    console.log(`Invalid input. Enter 0..${moves.length - 1}${moves.some((m) => m.type === "draw") ? " or d" : ""}.`);
  }
}

async function runInteractive(
  seed: number,
  botMode: boolean
): Promise<void> {
  let state = createInitialGameState(seed);
  const rng = createRng(seed + 9999);
  const rl = readline.createInterface({ input, output });

  try {
    while (getWinner(state) === null) {
      console.log(formatGameState(state));
      const moves = getLegalMoves(state);
      if (moves.length === 0) {
        console.log("No legal moves (unexpected).");
        break;
      }

      let move: Move;
      if (shouldBotAct(state, botMode)) {
        move = pickBotMove(moves, rng);
        const who =
          state.phase === "draw" ? "Auto" : "Bot (P1)";
        console.log(`${who}: ${describeMove(move, state)}`);
      } else {
        move = await promptMove(rl, state, moves);
      }

      try {
        state = applyMove(state, move);
      } catch (e) {
        if (e instanceof IllegalMoveError) {
          console.log(`Illegal move: ${e.message}`);
          continue;
        }
        throw e;
      }
    }

    const w = getWinner(state);
    console.log(formatGameState(state));
    if (w !== null) {
      console.log(`\nGame over. Winner: Player ${w}`);
    }
  } finally {
    rl.close();
  }
}

function runAutoSpectator(seed: number): void {
  let state = createInitialGameState(seed);
  const rng = createRng(seed + 1);

  while (getWinner(state) === null) {
    console.log(formatGameState(state));
    const moves = getLegalMoves(state);
    if (moves.length === 0) break;
    const move = pickBotMove(moves, rng);
    console.log(`→ ${describeMove(move, state)}`);
    state = applyMove(state, move);
  }

  console.log(formatGameState(state));
  const w = getWinner(state);
  if (w !== null) {
    console.log(`\nGame over. Winner: Player ${w}`);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const args = parsePlayArgs(argv);

  if (args.help) {
    console.log(playCliHelpText());
    process.exit(0);
  }

  if (args.auto) {
    runAutoSpectator(args.seed);
    return;
  }

  await runInteractive(args.seed, args.bot);
}

await main();
