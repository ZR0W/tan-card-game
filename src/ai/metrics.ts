import type { Card } from "@engine/types";
import { rankOrder } from "@engine/rules";
import type { GameState, PlayerId } from "@engine/gameState";

/** Named features from `GameState` for one player’s perspective (tunable weights in evaluation). */
export interface EvalMetrics {
  handEconomy: number;
  trumpEquity: number;
  rankStrength: number;
  roundPressure: number;
  phaseUtility: number;
}

function opponentOf(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}

function trumpValue(card: Card, trumpSuit: Card["suit"]): number {
  if (card.suit !== trumpSuit) return 0;
  return 1 + rankOrder(card.rank) / 12;
}

function sumRankPower(hand: Card[]): number {
  let s = 0;
  for (const c of hand) s += rankOrder(c.rank);
  return s;
}

/**
 * Pure numeric features for `player`: higher combined (after weights) ⇒ better for that player.
 */
export function evaluateMetrics(state: GameState, player: PlayerId): EvalMetrics {
  const opp = opponentOf(player);
  const self = state.players[player];
  const other = state.players[opp];
  const nSelf = self.hand.length;
  const nOpp = other.hand.length;

  // Prefer fewer cards in hand; slight pull when opponent holds more cards (race to empty).
  const handEconomy = -nSelf + 0.35 * (nOpp - nSelf);

  let ownTrump = 0;
  let oppTrump = 0;
  for (const c of self.hand) ownTrump += trumpValue(c, state.trumpSuit);
  for (const c of other.hand) oppTrump += trumpValue(c, state.trumpSuit);
  const trumpEquity = ownTrump - oppTrump;

  const sumSelf = sumRankPower(self.hand);
  const sumOpp = sumRankPower(other.hand);
  const rankStrength = (sumSelf - sumOpp) / 96;

  let roundPressure = 0;
  if (state.phase === "defender_respond" && state.currentDefender === player) {
    const attacks = state.currentRound.attacks.length;
    const defences = state.currentRound.defences.length;
    roundPressure -= 2 * Math.max(0, attacks - defences);
  } else if (
    state.phase === "attacker_lead" &&
    state.currentAttacker === player &&
    state.currentRound.attacks.length > 0 &&
    state.currentRound.attacks.length === state.currentRound.defences.length
  ) {
    roundPressure += 0.4 * state.currentRound.attacks.length;
  }

  let phaseUtility = 0;
  if (nSelf <= 3) phaseUtility += (3 - nSelf) * 0.6;
  if (state.deck.length < 12) phaseUtility += (12 - state.deck.length) * 0.02;

  return {
    handEconomy,
    trumpEquity,
    rankStrength,
    roundPressure,
    phaseUtility,
  };
}
