import type { GameState, PlayerId } from "@engine/gameState";
import type { Rng } from "@engine/rng";

function shuffled<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Generates a determinized copy of `state` from `perspectivePlayer`'s view.
 *
 * The opponent's hand and remaining deck are pooled together, shuffled, then
 * re-split: opponent still gets the same *count* of cards and the deck still
 * gets the rest.  The same `rng` seed produces the same assignment, making
 * each determinization reproducible and testable.
 *
 * Known-information cards (perspective player's own hand, current-round
 * attacks/defences, and the discard pile) are never touched.
 *
 * Story 4.1 deliverable: `generateDeterminizedState`.
 */
export function generateDeterminizedState(
  state: GameState,
  perspectivePlayer: PlayerId,
  rng: Rng
): GameState {
  const opp: PlayerId = perspectivePlayer === 0 ? 1 : 0;
  const oppHandSize = state.players[opp].hand.length;

  // Pool = everything unknown to perspectivePlayer: opponent's hand + deck.
  const pool = shuffled([...state.players[opp].hand, ...state.deck], rng);

  const newOppHand = pool.slice(0, oppHandSize);
  const newDeck = pool.slice(oppHandSize);

  const newPlayers: GameState["players"] = [
    { ...state.players[0] },
    { ...state.players[1] },
  ];
  newPlayers[opp] = { ...state.players[opp], hand: newOppHand };

  return { ...state, players: newPlayers, deck: newDeck };
}
