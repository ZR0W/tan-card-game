import { allCards } from "@engine/card";
import type { Card } from "@engine/types";
import type { GameState, PlayerId } from "@engine/gameState";
import type { Rng } from "@engine/rng";
import { shuffle } from "@engine/deck";

function opponentOf(viewer: PlayerId): PlayerId {
  return viewer === 0 ? 1 : 0;
}

function cardKey(c: Card): string {
  return `${c.suit}\t${c.rank}`;
}

/** Remove one instance of each known card from `candidates` (multiset). */
function cardsNotInKnown(candidates: Card[], known: Card[]): Card[] {
  const counts = new Map<string, number>();
  for (const c of known) {
    const k = cardKey(c);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: Card[] = [];
  for (const c of candidates) {
    const k = cardKey(c);
    const n = counts.get(k) ?? 0;
    if (n > 0) counts.set(k, n - 1);
    else out.push(c);
  }
  return out;
}

function collectKnownCardInstances(state: GameState, viewer: PlayerId): Card[] {
  const known: Card[] = [];
  for (const c of state.players[viewer].hand) known.push(c);
  for (const c of state.currentRound.attacks) known.push(c);
  for (const c of state.currentRound.defences) known.push(c);
  for (const c of state.discardPile) known.push(c);
  known.push(state.turnUpCard);
  return known;
}

/**
 * Builds a full `GameState` consistent with a viewer’s information: copies all public
 * fields and the viewer’s hand; **does not** copy opponent hole cards — those slots and
 * the deck prefix are filled by shuffling the unknown multiset (52 minus known cards).
 *
 * Known identities: viewer hand, table, discard, turn-up. Known counts only: opponent
 * hand length, deck length (turn-up remains last card of deck).
 */
export function generateDeterminizedState(
  state: GameState,
  viewer: PlayerId,
  rng: Rng
): GameState {
  const opp = opponentOf(viewer);
  const knownInstances = collectKnownCardInstances(state, viewer);
  const unknown = cardsNotInKnown(allCards(), knownInstances);

  const oppHandLen = state.players[opp].hand.length;
  const deckLen = state.deck.length;
  const deckPrefixLen = Math.max(0, deckLen - 1);

  if (unknown.length !== oppHandLen + deckPrefixLen) {
    throw new Error(
      `determinization: unknown size ${unknown.length} !== opp ${oppHandLen} + deckPrefix ${deckPrefixLen}`
    );
  }

  const shuffled = shuffle(unknown, rng);
  const newOppHand = shuffled.slice(0, oppHandLen);
  const deckPrefix = shuffled.slice(oppHandLen, oppHandLen + deckPrefixLen);
  const newDeck = [...deckPrefix, state.turnUpCard];

  const p0 = state.players[0];
  const p1 = state.players[1];
  const newPlayers: GameState["players"] =
    viewer === 0
      ? [
          { ...p0, hand: [...p0.hand] },
          { ...p1, hand: newOppHand },
        ]
      : [
          { ...p0, hand: newOppHand },
          { ...p1, hand: [...p1.hand] },
        ];

  return {
    ...state,
    players: newPlayers,
    deck: newDeck,
  };
}
