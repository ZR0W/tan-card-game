import {
  applyMove,
  getWinner,
} from "@engine/index";
import type { Move } from "@engine/rules";
import type { GameState } from "@engine/gameState";
import type { BotBrain } from "../ai/botBrain";
import { pickBotMove } from "../ai/botBrain";
import { buildLogEvents } from "../ui/gameLog";

export function shouldBotAct(state: GameState, vsBot: boolean): boolean {
  if (!vsBot) return false;
  if (state.phase === "draw") return true;
  if (state.phase === "attacker_lead") return state.currentAttacker === 1;
  if (state.phase === "defender_respond") return state.currentDefender === 1;
  return false;
}

/**
 * Applies `move` then chains any bot moves, collecting log events for each.
 *
 * `botBrain` — which AI to use for Player 1; `null` = human vs human (no bot).
 */
export function advanceSession(
  prev: GameState,
  move: Move,
  botBrain: BotBrain | null
): { next: GameState; events: string[] } {
  const events: string[] = [];
  let next = applyMove(prev, move);
  events.push(...buildLogEvents(prev, move, next));

  while (
    botBrain !== null &&
    getWinner(next) === null &&
    shouldBotAct(next, true)
  ) {
    const bm = pickBotMove(next, 1, botBrain);
    if (!bm) break;
    const before = next;
    next = applyMove(next, bm);
    events.push(...buildLogEvents(before, bm, next));
  }

  return { next, events };
}
