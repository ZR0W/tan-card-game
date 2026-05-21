import { applyMove, getWinner } from "@engine/index";
import type { Move } from "@engine/rules";
import type { GameState } from "@engine/gameState";
import {
  chooseMonteCarloMove,
  DEFAULT_MONTE_CARLO_CONFIG,
} from "../ai/monteCarlo";
import type { MonteCarloChooseOptions } from "../ai/monteCarlo";
import { buildLogEvents } from "../ui/gameLog";

export function shouldBotAct(state: GameState, vsBot: boolean): boolean {
  if (!vsBot) return false;
  if (state.phase === "draw") return true;
  if (state.phase === "attacker_lead") return state.currentAttacker === 1;
  if (state.phase === "defender_respond") return state.currentDefender === 1;
  return false;
}

/** Context for Monte Carlo bot (Epic 4.2+): monotonic `nextMcWorkSalt` per bot decision; optional Story 4.3 debug sink. */
export type AdvanceSessionContext = {
  nextMcWorkSalt: () => number;
  /** When set, each bot MC choice emits one structured record (dev / audit). */
  monteCarloOptions?: Pick<MonteCarloChooseOptions, "onDecision">;
};

/**
 * Applies `move` then any chained bot moves; collects `buildLogEvents` for each atomic transition.
 * Bot uses Monte Carlo on determinized worlds (Epic 4).
 */
export function advanceSession(
  prev: GameState,
  move: Move,
  vsBot: boolean,
  ctx: AdvanceSessionContext
): { next: GameState; events: string[] } {
  const events: string[] = [];
  let next = applyMove(prev, move);
  events.push(...buildLogEvents(prev, move, next));

  while (
    vsBot &&
    getWinner(next) === null &&
    shouldBotAct(next, vsBot)
  ) {
    const bm = chooseMonteCarloMove(
      next,
      1,
      DEFAULT_MONTE_CARLO_CONFIG,
      ctx.nextMcWorkSalt(),
      ctx.monteCarloOptions
    );
    if (!bm) break;
    const before = next;
    next = applyMove(next, bm);
    events.push(...buildLogEvents(before, bm, next));
  }

  return { next, events };
}
