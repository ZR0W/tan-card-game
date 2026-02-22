import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  getLegalMoves,
  applyMove,
  getWinner,
  cardBeats,
  rankOrder,
  IllegalMoveError,
  createCard,
} from "../../src/engine";
import type { Move } from "../../src/engine";

describe("rules", () => {
  describe("rankOrder and cardBeats", () => {
    it("rankOrder returns index in Ranks (0 for 2, 12 for Ace)", () => {
      expect(rankOrder("2")).toBe(0);
      expect(rankOrder("Ace")).toBe(12);
      expect(rankOrder("10")).toBe(8);
    });

    it("trump beats non-trump", () => {
      const trump = "Hearts";
      const attack = createCard("Spades", "Ace");
      const defend = createCard("Hearts", "6");
      expect(cardBeats(attack, defend, trump)).toBe(true);
    });

    it("same suit uses rank: higher rank beats", () => {
      const attack = createCard("Spades", "7");
      const defend = createCard("Spades", "10");
      expect(cardBeats(attack, defend, "Clubs")).toBe(true);
    });

    it("same suit lower rank does not beat", () => {
      const attack = createCard("Spades", "10");
      const defend = createCard("Spades", "7");
      expect(cardBeats(attack, defend, "Clubs")).toBe(false);
    });

    it("same suit same rank does not beat (e.g. duplicate cards in multi-deck)", () => {
      const card = createCard("Spades", "7");
      expect(cardBeats(card, card, "Clubs")).toBe(false);
      const sameRankSuit = createCard("Spades", "7");
      expect(cardBeats(card, sameRankSuit, "Clubs")).toBe(false);
    });
  });

  describe("getLegalMoves", () => {
    it("attacker_lead with empty round: all cards in hand are legal attacks", () => {
      const state = createInitialGameState(1);
      const moves = getLegalMoves(state);
      expect(state.phase).toBe("attacker_lead");
      expect(state.currentRound.attacks).toHaveLength(0);
      const attacks = moves.filter((m): m is Move => m.type === "attack");
      expect(attacks).toHaveLength(state.players[state.currentAttacker].hand.length);
    });

    it("draw phase: only draw move", () => {
      const state = createInitialGameState(1);
      const moves = getLegalMoves(state);
      const attack = moves.find((m) => m.type === "attack");
      expect(attack).toBeDefined();
      let s = applyMove(state, attack!);
      s = applyMove(s, { type: "give_up" });
      expect(s.phase).toBe("draw");
      const drawMoves = getLegalMoves(s);
      expect(drawMoves).toEqual([{ type: "draw" }]);
    });

    it("game_over: no moves", () => {
      const state = createInitialGameState(1);
      state.phase = "game_over";
      state.winner = 0;
      expect(getLegalMoves(state)).toEqual([]);
    });
  });

  describe("applyMove", () => {
    it("attack: card removed from hand, added to round, phase defender_respond", () => {
      const state = createInitialGameState(2);
      const moves = getLegalMoves(state);
      const attackMove = moves.find((m) => m.type === "attack") as Extract<Move, { type: "attack" }>;
      const attacker = state.players[state.currentAttacker];
      const card = attacker.hand[attackMove.cardIndex];
      const next = applyMove(state, attackMove);
      expect(next.currentRound.attacks).toHaveLength(1);
      expect(next.currentRound.attacks[0]).toEqual(card);
      expect(next.players[state.currentAttacker].hand).toHaveLength(attacker.hand.length - 1);
      expect(next.phase).toBe("defender_respond");
    });

    it("defend: card removed, added to defences; all beaten -> attacker_lead", () => {
      const state = createInitialGameState(2);
      let s = applyMove(state, { type: "attack", cardIndex: 0 });
      const defendMoves = getLegalMoves(s).filter((m) => m.type === "defend");
      if (defendMoves.length > 0) {
        s = applyMove(s, defendMoves[0] as Extract<Move, { type: "defend" }>);
        expect(s.currentRound.defences).toHaveLength(1);
        expect(s.phase).toBe("attacker_lead");
      }
    });

    it("give_up: defender gets all round cards, phase draw", () => {
      const state = createInitialGameState(3);
      let s = applyMove(state, { type: "attack", cardIndex: 0 });
      s = applyMove(s, { type: "give_up" });
      expect(s.currentRound.attacks).toHaveLength(0);
      expect(s.currentRound.defences).toHaveLength(0);
      expect(s.phase).toBe("draw");
      const defenderId = state.currentDefender;
      expect(s.players[defenderId].hand.length).toBeGreaterThan(state.players[defenderId].hand.length);
    });

    it("pass_attack: round to discard, roles swap, phase draw", () => {
      const state = createInitialGameState(4);
      let s = applyMove(state, { type: "attack", cardIndex: 0 });
      const defendMoves = getLegalMoves(s).filter((m) => m.type === "defend");
      if (defendMoves.length > 0) {
        s = applyMove(s, defendMoves[0] as Extract<Move, { type: "defend" }>);
        const attackerBefore = s.currentAttacker;
        s = applyMove(s, { type: "pass_attack" });
        expect(s.currentRound.attacks).toHaveLength(0);
        expect(s.discardPile.length).toBeGreaterThan(0);
        expect(s.currentAttacker).not.toBe(attackerBefore);
        expect(s.phase).toBe("draw");
      }
    });

    it("draw: hands refill, phase attacker_lead or game_over", () => {
      const state = createInitialGameState(5);
      let s = applyMove(state, { type: "attack", cardIndex: 0 });
      s = applyMove(s, { type: "give_up" });
      expect(s.phase).toBe("draw");
      s = applyMove(s, { type: "draw" });
      expect(s.phase === "attacker_lead" || s.phase === "game_over").toBe(true);
      if (s.phase === "game_over") {
        expect(s.winner).toBeDefined();
        expect(getWinner(s)).toBe(s.winner);
      }
    });

    it("illegal move throws", () => {
      const state = createInitialGameState(1);
      expect(() => applyMove(state, { type: "draw" })).toThrow(IllegalMoveError);
      expect(() => applyMove(state, { type: "attack", cardIndex: 99 })).toThrow(IllegalMoveError);
    });
  });

  describe("getWinner", () => {
    it("returns null when phase is not game_over", () => {
      const state = createInitialGameState(1);
      expect(getWinner(state)).toBeNull();
    });

    it("returns winner when phase is game_over and winner set", () => {
      const s = { ...createInitialGameState(1), phase: "game_over" as const, winner: 1 as const };
      expect(getWinner(s)).toBe(1);
    });
  });
});
