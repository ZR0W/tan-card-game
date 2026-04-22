import type { Card, Rank, Suit } from "@engine/types";
import clubsIcon from "./assets/suits/clubs.svg";
import diamondsIcon from "./assets/suits/diamonds.svg";
import heartsIcon from "./assets/suits/hearts.svg";
import spadesIcon from "./assets/suits/spades.svg";

const suitSymbolMap: Record<Suit, string> = {
  Clubs: "♣",
  Diamonds: "♦",
  Hearts: "♥",
  Spades: "♠",
};

const suitIconMap: Record<Suit, string> = {
  Clubs: clubsIcon,
  Diamonds: diamondsIcon,
  Hearts: heartsIcon,
  Spades: spadesIcon,
};

const rankShortMap: Record<Rank, string> = {
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  Jack: "J",
  Queen: "Q",
  King: "K",
  Ace: "A",
};

export function cardLabel(card: Card): string {
  return `${card.rank} of ${card.suit}`;
}

export function rankShort(rank: Rank): string {
  return rankShortMap[rank];
}

export function suitSymbol(suit: Suit): string {
  return suitSymbolMap[suit];
}

export function suitIcon(suit: Suit): string {
  return suitIconMap[suit];
}

export function suitToneClass(suit: Suit): "suit-red" | "suit-black" {
  return suit === "Hearts" || suit === "Diamonds" ? "suit-red" : "suit-black";
}
