import type { Card, Rank, Suit } from "./types";
import { Ranks } from "./types";
import type { GameState, PlayerId } from "./gameState";
import { draw } from "./deck";

export type Move =
  | { type: "attack"; cardIndex: number }
  | { type: "defend"; cardIndex: number }
  | { type: "give_up" }
  | { type: "pass_attack" }
  | { type: "draw" };

export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalMoveError";
  }
}

/** Rank order 0 (2) .. 12 (Ace). */
export function rankOrder(rank: Rank): number {
  const i = Ranks.indexOf(rank);
  return i >= 0 ? i : 0;
}

/** True if defendingCard beats attackCard (trump beats non-trump; same suit uses rank). */
export function cardBeats(
  attackCard: Card,
  defendingCard: Card,
  trumpSuit: Suit
): boolean {
  if (defendingCard.suit === trumpSuit && attackCard.suit !== trumpSuit)
    return true;
  if (defendingCard.suit !== attackCard.suit) return false;
  return rankOrder(defendingCard.rank) > rankOrder(attackCard.rank);
}

/** Ranks that appear in the current round (attacks or defences). */
function ranksInRound(state: GameState): Set<Rank> {
  const set = new Set<Rank>();
  for (const c of state.currentRound.attacks) set.add(c.rank);
  for (const c of state.currentRound.defences) set.add(c.rank);
  return set;
}

export function getLegalMoves(state: GameState): Move[] {
  if (state.phase === "game_over") return [];
  if (state.phase === "draw") return [{ type: "draw" }];

  if (state.phase === "attacker_lead") {
    const attacker = state.players[state.currentAttacker];
    const moves: Move[] = [];
    if (state.currentRound.attacks.length === 0) {
      for (let i = 0; i < attacker.hand.length; i++) {
        moves.push({ type: "attack", cardIndex: i });
      }
    } else {
      const allowedRanks = ranksInRound(state);
      for (let i = 0; i < attacker.hand.length; i++) {
        if (allowedRanks.has(attacker.hand[i].rank)) {
          moves.push({ type: "attack", cardIndex: i });
        }
      }
      moves.push({ type: "pass_attack" });
    }
    return moves;
  }

  if (state.phase === "defender_respond") {
    const defender = state.players[state.currentDefender];
    const currentAttack =
      state.currentRound.attacks[state.currentRound.attacks.length - 1];
    const moves: Move[] = [{ type: "give_up" }];
    for (let i = 0; i < defender.hand.length; i++) {
      if (cardBeats(currentAttack, defender.hand[i], state.trumpSuit)) {
        moves.push({ type: "defend", cardIndex: i });
      }
    }
    return moves;
  }

  return [];
}

function isLegalMove(state: GameState, move: Move): boolean {
  const legal = getLegalMoves(state);
  if (move.type === "attack") {
    return legal.some(
      (m) => m.type === "attack" && m.cardIndex === move.cardIndex
    );
  }
  if (move.type === "defend") {
    return legal.some(
      (m) => m.type === "defend" && m.cardIndex === move.cardIndex
    );
  }
  return legal.some((m) => m.type === move.type);
}

function replacePlayer(
  state: GameState,
  playerId: PlayerId,
  update: (p: GameState["players"][0]) => GameState["players"][0]
): GameState {
  const players: GameState["players"] = [
    state.players[0].id === playerId
      ? update(state.players[0])
      : state.players[0],
    state.players[1].id === playerId
      ? update(state.players[1])
      : state.players[1],
  ];
  return { ...state, players };
}

function removeCardFromHand(hand: Card[], index: number): Card[] {
  return hand.slice(0, index).concat(hand.slice(index + 1));
}

export function applyMove(state: GameState, move: Move): GameState {
  if (!isLegalMove(state, move)) {
    throw new IllegalMoveError(
      `Move ${JSON.stringify(move)} is not legal in current state`
    );
  }

  if (move.type === "attack") {
    const attacker = state.players[state.currentAttacker];
    const card = attacker.hand[move.cardIndex];
    const newHand = removeCardFromHand(attacker.hand, move.cardIndex);
    const next = replacePlayer(state, state.currentAttacker, (p) => ({
      ...p,
      hand: newHand,
    }));
    return {
      ...next,
      currentRound: {
        attacks: [...next.currentRound.attacks, card],
        defences: [...next.currentRound.defences],
      },
      phase: "defender_respond" as const,
    };
  }

  if (move.type === "defend") {
    const defender = state.players[state.currentDefender];
    const card = defender.hand[move.cardIndex];
    const newHand = removeCardFromHand(defender.hand, move.cardIndex);
    const next = replacePlayer(state, state.currentDefender, (p) => ({
      ...p,
      hand: newHand,
    }));
    const newAttacks = [...next.currentRound.attacks];
    const newDefences = [...next.currentRound.defences, card];
    const allBeaten = newAttacks.length === newDefences.length;
    return {
      ...next,
      currentRound: { attacks: newAttacks, defences: newDefences },
      phase: allBeaten ? ("attacker_lead" as const) : ("defender_respond" as const),
    };
  }

  if (move.type === "give_up") {
    const defender = state.players[state.currentDefender];
    const allRoundCards = [
      ...state.currentRound.attacks,
      ...state.currentRound.defences,
    ];
    const next = replacePlayer(state, state.currentDefender, (p) => ({
      ...p,
      hand: [...p.hand, ...allRoundCards],
    }));
    return {
      ...next,
      currentRound: { attacks: [], defences: [] },
      phase: "draw" as const,
    };
  }

  if (move.type === "pass_attack") {
    const roundCards = [
      ...state.currentRound.attacks,
      ...state.currentRound.defences,
    ];
    return {
      ...state,
      currentRound: { attacks: [], defences: [] },
      discardPile: [...state.discardPile, ...roundCards],
      currentAttacker: state.currentDefender,
      currentDefender: state.currentAttacker,
      phase: "draw" as const,
    };
  }

  if (move.type === "draw") {
    const mainAttackerId = state.currentAttacker;
    const defenderId = mainAttackerId === 0 ? 1 : 0;
    const drawToEight = (hand: Card[], deck: Card[]): { hand: Card[]; deck: Card[] } => {
      let h = [...hand];
      let d = [...deck];
      if (h.length > 8) return { hand: h, deck: d };
      while (h.length < 8 && d.length > 0) {
        const result = draw(d);
        if (!result) break;
        h.push(result.card);
        d = result.remaining;
      }
      return { hand: h, deck: d };
    };
    const first = state.players[mainAttackerId];
    const second = state.players[defenderId];
    const r1 = drawToEight(first.hand, state.deck);
    const r2 = drawToEight(second.hand, r1.deck);
    const newPlayers: GameState["players"] = [
      mainAttackerId === 0 ? { ...state.players[0], hand: r1.hand } : { ...state.players[0] },
      mainAttackerId === 1 ? { ...state.players[1], hand: r1.hand } : { ...state.players[1] },
    ];
    if (defenderId === 0) newPlayers[0] = { ...newPlayers[0], hand: r2.hand };
    else newPlayers[1] = { ...newPlayers[1], hand: r2.hand };
    const next: GameState = { ...state, deck: r2.deck, players: newPlayers, phase: "attacker_lead" };
    if (next.players[0].hand.length === 0) return { ...next, phase: "game_over" as const, winner: 0 };
    if (next.players[1].hand.length === 0) return { ...next, phase: "game_over" as const, winner: 1 };
    return next;
  }
  return state;
}

export function getWinner(state: GameState): PlayerId | null {
  return state.phase === "game_over" && state.winner !== undefined ? state.winner : null;
}