# Project Plan & Game Reference

This document is the single place for detailed game rules, terminology, and project-specific notes. The [README](../README.md) contains the architecture and development roadmap.

---

## Tan — Game Rules

### Overview

Tan is a 2-player card game using a standard 52-card deck. Players take turns as **attacker** and **defender**; the defender must beat attack cards with higher same-suit or trump cards. Trump is determined by a **turn-up** card; players draw from the stock after each round. The winner is the first to have no cards in hand after the end-of-round draw phase.

### Deal & Setup

- Shuffle the deck and deal 8 cards to each player.
- **Trump:** The bottom card of the remaining stock is turned face up; its suit is trump. The rest of the pack is placed over it at right angles so the turn-up stays visible. This stack is the draw pile; the turn-up is the **last** card drawn.
- A **discard pile** holds cards from successfully defended rounds.
- Choose a starting player (the attacker for the first round).

### Card Rank and Trump

- **Rank (low to high):** 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A.
- Any trump beats any non-trump card (e.g. 6 of trumps beats A of a plain suit).

### Legal Moves & Turn Structure

- **Round:** One player is the attacker, the other the defender. They alternate roles between rounds unless specified otherwise.

- **First attack:** The attacker plays any one card from hand. The defender must beat it by playing either (a) a higher card of the **same suit**, or (b) any card of the **trump** suit (no obligation to follow suit). The defending card is placed on top of the attack card (both visible).

- **Further attacks (same round):** After a successful defence, the player who led that attack may make another attack **only if** the new attack card matches the **rank** of some card already played in that round. If they do not attack (or cannot), the **original** attacker may make a new attack (same rank constraint). The defender responds to each new attack the same way (higher same suit or trump).

- **Defender gives up:** If the defender cannot or does not wish to beat the current attack card, they give up the defence and **take all cards from the round** (attack and defence) into their hand.

- **Defender wins the round:** If the defender beats **all** attack cards and there is **no further attack** (the attacker has no more attacks to make), the defender wins the round. All cards from the round go to the **discard pile**. The defender becomes the next **attacker**; the other player becomes the **defender** (in 2-player: roles swap).

- **Drawing after each round:** After every round (whether the defender won or gave up), each player draws from the deck until they have 8 cards (or until the deck is empty). The **main attacker** (the player who was attacker in the round that just ended) draws first, then the defender. Players with **more than 8 cards** (e.g. after picking up) **do not draw**.

### Game Win Condition

- **Winner:** The first player to have **no cards in hand** after the **draw phase** of a round (e.g. 0 cards and no draw because the deck is empty, or still 0 after draw). The game is not won the instant the hand becomes empty during play; it is won once the round ends and the draw step leaves that player with 0 cards.

---

## Terminology & Glossary

- **Attack / attacker:** The player who leads attack card(s) in a round.
- **Defend / defender:** The player who must beat attack card(s) in a round.
- **Round (of attack/defence):** A sequence of attack–defence pairs until the defender either gives up (takes all) or wins (all cards to discard; roles swap).
- **Turn-up:** The face-up card that sets trump; it is the last card in the draw pile.
- **Main attacker (for drawing):** The player who was the attacker in the round that just ended; they draw first (if they have ≤8 cards).
- **Stock / draw pile / discard pile:** The stock is the undealt deck; the draw pile is the face-down stack (with turn-up at the bottom) from which players draw; the discard pile holds cards from rounds the defender won.

---

## Other Notes (implementation hints)

- **State:** Track deck (order), hands, trump, current attacker/defender, cards in the current round (attack + defence), discard pile, and whether the game is in “attacker may add attack” or “defender must respond”.
- **Round end:** Two outcomes — defender gives up (they take all round cards; they do not draw if they have >8; main attacker draws first, then defender if ≤8) or defender wins (round cards to discard; roles swap; then same draw rule).
- **Max attacks per round:** There is no fixed number; the round ends when the defender gives up or when the defender has beaten all attacks and no one can or will make another attack (final attack beaten).
