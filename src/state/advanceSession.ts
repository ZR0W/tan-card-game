import {
  applyMove,
  getWinner,
} from "@engine/index";
import type { Move } from "@engine/rules";
import type { GameState } from "@engine/gameState";
import { chooseGreedyMove } from "../ai/heuristicBot";
import { buildLogEvents } from "../ui/gameLog";

export function shouldBotAct(state: GameState, vsBot: boolean): boolean {
  if (!vsBot) return false;
  if (state.phase === "draw") return true;
  if (state.phase === "attacker_lead") return state.currentAttacker === 1;
  if (state.phase === "defender_respond") return state.currentDefender === 1;
  return false;
}

/**
 * Applies `move` then any chained bot moves; collects `buildLogEvents` for each atomic transition.
 */
export function advanceSession(
  prev: GameState,
  move: Move,
  vsBot: boolean
): { next: GameState; events: string[] } {
  const events: string[] = [];
  let next = applyMove(prev, move);
  events.push(...buildLogEvents(prev, move, next));

  while (
    vsBot &&
    getWinner(next) === null &&
    shouldBotAct(next, vsBot)
  ) {
    const bm = chooseGreedyMove(next, 1);
    if (!bm) break;
    const before = next;
    next = applyMove(next, bm);
    events.push(...buildLogEvents(before, bm, next));
  }

  return { next, events };
}
