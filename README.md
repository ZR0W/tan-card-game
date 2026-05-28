# tan-card-game

A simple web game of the Vietnamese card game **tan** to play against a bot.

---

## Getting started

After cloning the repo, use these commands to install dependencies, run tests, and build:

| Command | What it does |
|--------|-------------------------------|
| `npm install` | Installs dependencies (TypeScript, Vitest, Vite, React). Run once after clone. |
| `npm run dev` | Starts the Vite dev server for the browser UI (open the URL it prints). |
| `npm test` | Runs the test suite once (engine, CLI, UI smoke tests). |
| `npm run test:watch` | Runs tests in watch mode; re-runs when you change files. Stop with Ctrl+C. |
| `npm run typecheck` | TypeScript check across `src/` and `tests/` (no emit). |
| `npm run build` | Production build with Vite → output in `dist/` (for GitHub Pages, etc.). |
| `npm run preview` | Serves the last `dist/` build locally to verify production output. |
| `npm run play` | CLI game (Epic 1). |

**Quick check:** From the project root, run `npm install` then `npm test`. You should see all tests pass. Use `npm run dev` to see the minimal UI (Epic 2).

---

## Table of Contents

- [Getting started](#getting-started)
- [1. Project Overview](#1-project-overview)
- [2. Repository Structure](#2-repository-structure)
- [3. Architectural Principles](#3-architectural-principles)
- [4. Development Roadmap (Epics & Stories)](#4-development-roadmap-epics--stories) — **[Progress checklist](docs/PROGRESS.md)**
- [5. Testing Strategy](#5-testing-strategy)
- [6. Deployment Plan](#6-deployment-plan)
- [7. Milestone Timeline](#7-milestone-timeline)
- [8. Long-Term Vision](#8-long-term-vision)

---

## 1. Project Overview

This project is a 1v1 imperfect-information card game using a standard 52-card deck. For detailed tan rules, terminology, and game-specific notes, see [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

**Characteristics:**

- Two players
- Hidden opponent hand
- Hidden future deck order
- Deterministic rules, stochastic outcomes (due to shuffle)
- Fully client-side (GitHub Pages)
- Implemented entirely in TypeScript

**Primary goals:**

- Build a clean, deterministic game engine
- Implement progressively stronger AI opponents
- Explore strategic optimization via simulation
- Maintain a scalable, testable architecture

---

## 2. Repository Structure

The project strictly separates:

- Game engine logic
- AI logic
- UI
- Infrastructure

This ensures the AI can run simulations independently of the interface.

**Proposed repository structure:**

```
tan-card-game/
├── index.html
├── src/
│   ├── engine/          (rules, state, deck — no UI)
│   ├── cli/               (terminal runner)
│   ├── state/
│   │   └── useGameSession.ts
│   ├── ui/
│   │   ├── assets/
│   │   │   ├── cards/
│   │   │   └── suits/
│   │   ├── components/
│   │   │   ├── CardBack.tsx
│   │   │   ├── CardFace.tsx
│   │   │   ├── GameBoard.tsx
│   │   │   ├── GameOverBanner.tsx
│   │   │   ├── HandRow.tsx
│   │   │   ├── MovePanel.tsx
│   │   │   ├── OpponentHand.tsx
│   │   │   ├── PlayerHand.tsx
│   │   │   └── TurnIndicator.tsx
│   │   ├── styles/
│   │   ├── App.tsx
│   │   ├── app.css
│   │   ├── cardFormat.ts
│   │   ├── cardVisuals.ts
│   │   └── moveLabels.ts
│   ├── main.tsx
│   └── vite-env.d.ts
│   (future: ai/, workers/, utils/)
├── tests/
│   ├── engine/
│   ├── cli/
│   └── ui/
├── docs/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 3. Architectural Principles

### 3.1 Engine Is Pure

- No UI logic inside `/engine`
- Fully deterministic
- Serializable state
- Fully testable

### 3.2 AI Operates Only on Engine

- AI never manipulates UI
- AI only reads and returns moves
- AI uses cloned states for simulations

### 3.3 UI Is a Consumer

- UI reads state
- UI dispatches moves
- UI does not contain rule logic

**State distinction:** **Game state** (in the engine) is the single source of truth: serializable, deterministic (deck, hands, scores, turn, phase). **App state** (e.g. `state/gameStore.ts`) is the UI layer that holds and exposes that game state and dispatches moves to the engine—it does not duplicate rule logic.

### 3.4 Deterministic Randomness

- All randomness controlled via seedable RNG
- Required for reproducible simulations

---

## 4. Development Roadmap (Epics & Stories)

**Track progress:** [Progress checklist](docs/PROGRESS.md) — tick off stories and add completion notes.

### EPIC 1 — Core Game Engine

**Goal:** Fully playable game logic without UI.

#### Story 1.1 — Card & Deck System

**Objective:** Create robust card modeling.

**Deck model:** Randomize the deck once upfront (e.g. at deal or game init) using the seedable RNG. The deck then has a fixed order; drawing is always "take the next card from the top." No per-draw randomness—this guarantees a valid, consistent deck (52 unique cards, no duplicates or invalid generation).

**Tasks:**

- Define Suit and Rank enums
- Define Card interface
- Implement deck generator (52 unique cards)
- Implement Fisher–Yates shuffle; shuffle once when deck is created/ready (seed-based)
- Implement draw method (deterministic: take next card from shuffled deck, no new RNG)
- Add unit tests for:
  - Deck length
  - Uniqueness
  - Shuffle reproducibility (same seed → same order)
  - Draw order after shuffle

**Deliverable:** A reliable deck system.

#### Story 1.2 — Game State Modeling

**Objective:** Represent full game state.

**Tasks:**

- Define PlayerState (hand, score, metadata)
- Define GameState (deck, players, current turn, phase if needed)
- Implement state initialization
- Ensure JSON-safe serialization

**Deliverable:** Serializable, well-structured game state.

#### Story 1.3 — Rules Engine

**Objective:** Enforce legal gameplay.

**Tasks:**

- Implement legal move generator
- Implement move application
- Implement state transition logic
- Implement win condition detection
- Add illegal move safeguards

**Deliverable:** Fully enforceable game rules.

#### Story 1.4 — Simulation Engine

**Objective:** Allow game cloning and automated playouts.

**Tasks:**

- Implement `cloneGameState()`
- Implement seedable RNG
- Implement `simulateRandomGame()`
- Verify determinism via fixed seeds
- Add simulation stress test (1,000+ runs)

**Deliverable:** Headless simulation engine.

#### Story 1.5 — CLI Runner

**Objective:** Run a full game from the command line (human vs human, or optionally human vs random bot after 1.4) for debugging and testing without the browser.

**Tasks:**

- Add a single CLI entry point (e.g. `src/cli/play.ts` or `scripts/play-cli.ts`) that:
  - Takes an optional seed (e.g. `npm run play -- 42`).
  - Creates initial state with that seed.
  - Loops: print current state (trump, hands, round, whose turn, phase), print legal moves (e.g. indices or short codes), read one line from stdin, parse it into a move, call the rules engine to apply the move and get the next state, exit on game over with winner.
- Add an npm script (e.g. `"play": "tsx src/cli/play.ts"` or run built `dist/cli/play.js`) so you can run `npm run play`.
- Keep the CLI minimal: plain text, line-by-line; no TUI or curses.
- Optional: "human vs random bot" mode (pick a random legal move for player 1) once 1.4 exists, so you can test alone.

**Deliverable:** You can play a full game (or watch a random game) from the terminal without opening the browser.

**Dependencies:** Story 1.3 must be done. Story 1.4 is optional (only needed for human vs random bot in CLI).

**CLI usage** (after implementation):

| Command | Description |
|--------|-------------|
| `npm run play` | Hot-seat two humans; default seed `12345` (reproducible deal). |
| `npm run play -- 42` | Same with seed `42`. |
| `npm run play -- --bot` | You are player 0; player 1 uses greedy heuristic (one-step lookahead). |
| `npm run play -- --auto` | Print a full random game (spectator); optional seed after flags. |
| `npm run play -- --help` | Show usage. |

Moves are chosen by index from the printed legal list; in the draw phase you can type `d` or `draw` for the single draw move.

---

### EPIC 2 — Minimal UI

**Goal:** Human vs human playable in the browser so "playable" is clearly in-browser by end of Phase 1.

#### Story 2.1 — Game Board & Hand Display

**Objective:** Render the current game state.

**Tasks:**

- Display game board (table/play area as appropriate for tan)
- Display current player's hand
- Display opponent's hand (hidden or back-only as per rules)
- Show whose turn it is

**Deliverable:** Visible board and hands driven by engine state.

#### Story 2.2 — Move Input & Turn Flow

**Objective:** Let players submit moves and advance the game.

**Tasks:**

- Provide controls to select/play a legal move (or discard, etc., per tan rules)
- On submit: dispatch move to engine; update app state from new game state
- Display win/game-over when engine reports win condition
- Handle turn switching (human vs human)

**Deliverable:** Two humans can play one full game in the browser.

**How to run:** Start the app with [`npm run dev`](#getting-started) (see **Getting started**). **Hot-seat:** both players use the **Moves** buttons on the same screen—Player 0 is the bottom hand, Player 1 the top (both hands are shown face-up for local play). Changing the **deal seed** starts a new deal; after **game over**, use **New deal (same seed)** to replay.

#### Story 2.3 — Extended UI & Visual Card Design

**Objective:** Move beyond text-only labels so cards and the table feel like a real game: clear suits/ranks, readable layout, and intentional visual design.

**Tasks:**

- Replace plain string card labels with **visual card components** (e.g. rank typography, suit symbols or icons, red/black coloring for Hearts/Diamonds vs Clubs/Spades).
- **Opponent / face-down** cards: consistent card-back styling (not only “?” text).
- Improve **layout and spacing**: hand as a row or fan, distinct play area, responsive behavior on small screens.
- **Visual hierarchy** and polish: typography, borders, backgrounds; optional light motion (e.g. hover/focus) without blocking gameplay.
- **Accessibility:** sufficient contrast, keyboard focus where interactive, `aria` labels preserved or improved.

**Deliverable:** Board and hands communicate card identity at a glance; UI no longer relies on raw text strings alone for card content.

**Dependencies / order:** Builds on Story 2.1. Can follow Story 2.2 (playable flow first) or overlap—visual polish is independent of move wiring.

**How to run:** Use [`npm run dev`](#getting-started). Story 2.3 introduces card-face components (rank corners + suit icons), reusable card backs, responsive hand rows, and improved focus/contrast states while preserving Story 2.2 gameplay flow.

**Asset notes:** Card/suit artwork is stored locally in `src/ui/assets` (no runtime CDN dependency).

---

### EPIC 3 — Heuristic AI

**Goal:** Baseline competitive bot.

#### Story 3.1 — Evaluation Function

**Objective:** Create state scoring model.

**Tasks:**

- Define scoring criteria
- Score hand strength
- Score board position
- Combine weighted metrics
- Normalize scoring

**Deliverable:** `evaluateState(state, player): number`

**Implementation:** Internal `EvalMetrics` plus `combineMetrics` in [`src/ai/evaluation.ts`](src/ai/evaluation.ts); feature extraction in [`src/ai/metrics.ts`](src/ai/metrics.ts). Tests in [`tests/ai/evaluation.test.ts`](tests/ai/evaluation.test.ts).

#### Story 3.2 — Greedy Bot

**Objective:** One-step lookahead bot.

**Tasks:**

- Generate all legal moves
- Apply each move to cloned state
- Evaluate resulting state
- Choose highest scoring move

**Deliverable:** Playable heuristic AI.

**Implementation:** [`src/ai/heuristicBot.ts`](src/ai/heuristicBot.ts) exports `chooseGreedyMove(state, botPlayer)`. Tests in [`tests/ai/heuristicBot.test.ts`](tests/ai/heuristicBot.test.ts).

**How to run:**

- **Browser:** [`npm run dev`](#getting-started), then enable **Play vs bot (Player 1 uses heuristic AI)** so P1 moves run automatically after your moves (same core as CLI `--bot`).
- **CLI:** `npm run play -- --bot` (see Epic 1 **CLI usage** table above) — greedy lookahead for player 1. **`--auto`** is still an all-random spectator game for stress/replay.

#### Story 3.3 — Game audit log (UI)

**Objective:** Match CLI-style transparency in the browser so you can QA state transitions without reading the terminal.

**Tasks:**

- Append-only event log derived from each rules transition (human and bot moves).
- Record deal/trump, attacks/defences, round end (pass / give-up), and draw-phase refills (who drew which cards).
- Surface context for attacker/defender roles and phase changes where helpful.

**Deliverable:** Collapsible, **searchable** side panel (**open by default**) listing chronological game events.

**Implementation:** [`src/ui/gameLog.ts`](src/ui/gameLog.ts) builds strings from `(prevState, move, nextState)`; [`src/state/useGameSession.ts`](src/state/useGameSession.ts) accumulates lines; [`src/ui/components/GameAuditPanel.tsx`](src/ui/components/GameAuditPanel.tsx) renders filter UI.

**How to run:** [`npm run dev`](#getting-started). The **Audit log** panel is on the right (stacks below the board on narrow screens). Use the search box to filter lines; collapse the panel if you need more board space.

---

### EPIC 4 — Monte Carlo AI

**Goal:** Introduce probabilistic reasoning.

**Worker timing:** To keep the UI responsive, run simulations in a Web Worker from the start of this epic (or as the first story). Either add a minimal "run simulations in worker" task here or complete Epic 6 (Performance) before raising simulation counts.

#### Story 4.1 — Determinization

**Objective:** Handle hidden information.

Use the same seedable RNG as the engine. The unknown set is exactly "deck minus all known cards"; assign those to opponent hand and remaining deck consistently (e.g. shuffle the unknown set once, then assign). That keeps determinization reproducible and testable.

**Tasks:**

- Identify unknown cards (deck minus known/cards in play)
- Randomly assign opponent hand from unknown set (RNG-driven)
- Randomize remaining deck from remainder (same RNG, consistent ordering)
- Validate consistency (no duplicate or invalid cards)

**Deliverable:** `generateDeterminizedState(partialState)`

#### Story 4.2 — Monte Carlo Move Evaluation

**Objective:** Evaluate moves via simulation.

**Tasks:**

- For each legal move:
  - Run N simulations
  - Perform random playout
  - Record win/loss
  - Compute win rate
- Select best move

**Deliverable:** Monte Carlo bot (100+ simulations per move).

#### Story 4.3 — Bot Brain Toggle & Benchmark

**Objective:** Validate that MCTS improves on the greedy baseline.

**Tasks:**

- Define `BotBrain` type (`"random" | "greedy" | "mcts-fast" | "mcts"`) as a shared AI-selector
- Wire `pickBotMove` dispatcher so UI and CLI share one code path
- Add brain-selector dropdown to the web UI (visible when vs-bot mode is on)
- Add `npm run benchmark` CLI: head-to-head N-game series with win rates and CI95 bands

**Benchmark flags** — always specify `--p0` and `--p1` so the command is self-documenting:

```
# Both sides must be named explicitly. --sims only applies to MCTS brains.
npm run benchmark -- --p0 greedy    --p1 random                           # sanity: greedy beats random?
npm run benchmark -- --p0 random    --p1 mcts-fast   --sims 25            # sanity: mcts beats random?
npm run benchmark -- --p0 greedy    --p1 mcts-fast   --sims 25            # main: mcts vs greedy
npm run benchmark -- --p0 greedy    --p1 mcts        --games 100 --sims 50 --quiet
npm run benchmark -- --p0 mcts-fast --p1 mcts        --sims 25
```

Available brains: `random` | `greedy` | `mcts-fast` | `mcts`

#### Story 4.4 — Random Brain & Diagnostic Ladder

**Objective:** Isolate whether MCTS or the greedy baseline is the broken component.

A `"random"` brain picks uniformly at random from all legal moves (any attack, defend,
give_up, pass_attack) using the seedable RNG. It is the simplest possible baseline and
should lose to both greedy and MCTS if those implementations are correct.

**Diagnostic ladder — run these in order:**

| Step | Command | Expected outcome |
|------|---------|-----------------|
| 1 | `--p0 greedy --p1 random` | P0 (greedy) wins clearly — validates greedy |
| 2 | `--p0 random --p1 mcts-fast --sims 25` | P1 (MCTS) wins clearly — validates MCTS baseline |
| 3 | `--p0 greedy --p1 mcts-fast --sims 25` | P1 (MCTS) wins — validates MCTS improvement |

If step 1 passes but step 2 fails, MCTS is the broken component. If step 1 fails,
something is wrong with the greedy evaluation or the engine.

**Deliverable:** `"random"` added to `BotBrain`; all three ladder commands runnable via
`npm run benchmark`.

---

### EPIC 5 — Brain Evaluation & Tuning

**Goal:** Thoroughly evaluate every bot brain, expose weaknesses in the current
heuristic and MCTS implementation, and define concrete improvements.

This epic produces no new playable features — its deliverables are benchmark
results, documented analyses, and a set of actionable findings that feed
directly into Epic 6 (Performance) and future AI work.

#### Story 5.1 — Greedy Heuristic Audit

**Objective:** Clearly state what the greedy bot is actually doing, surface
implicit assumptions, and identify evaluation gaps — especially around the
defender role which received less design attention than the attacker role.

**What the current heuristic does**

`chooseGreedyMove` (`src/ai/heuristicBot.ts`) is a one-step lookahead: it
enumerates every legal move, scores the resulting state with `evaluateState`,
and returns the highest-scoring move. It never looks beyond the immediate next
state.

`evaluateState` (`src/ai/evaluation.ts`) combines five named metrics from
`evaluateMetrics` (`src/ai/metrics.ts`) using a fixed weight table
(`METRIC_WEIGHTS`):

| Metric | Weight | Formula | Rationale |
|--------|--------|---------|-----------|
| `handEconomy` | 1.1 | `−nSelf + 0.35·(nOpp − nSelf)` | Prefer fewer cards; slight pull when opponent holds more |
| `trumpEquity` | 0.85 | `ownTrumpValue − oppTrumpValue` | Prefer trump card advantage |
| `rankStrength` | 1.0 | `(rankSumSelf − rankSumOpp) / 96` | Prefer higher overall rank mass |
| `roundPressure` | 1.0 | Penalty if defending with unbeaten attacks; bonus if attacker with all attacks beaten | Only role-aware metric |
| `phaseUtility` | 0.9 | Bonus when hand ≤ 3 cards or deck < 12 cards | Rewards endgame positioning |

**Known gaps to audit**

- `handEconomy` penalises having cards at all. But as attacker, holding more
  high-rank cards is a weapon, not a liability. The metric does not distinguish
  *which* cards are in hand, only how many.
- `rankStrength` aggregates raw rank values without suit awareness. A hand of
  seven low trumps scores worse than a hand of seven high non-trumps — but the
  trump hand is almost certainly stronger.
- `roundPressure` is the only metric that knows whether we are the attacker or
  defender, but its signal is weak (at most ±2 points per undefended attack vs
  the 10,000-point terminal bounds). It does not model the cost of giving up
  (`give_up`) relative to spending a valuable trump to defend.
- No metric captures *which specific card* should be played — only aggregate
  hand quality. A greedy bot might play its highest trump to beat a 2 of
  clubs because the resulting state scores slightly higher in `rankStrength`.
- `phaseUtility` rewards low card counts unconditionally. Late-game a player
  with 0 cards wins — but mid-game aggressively burning cards can leave you
  defenceless.

**Tasks**

- Walk through a set of representative game positions (mid-game, late attacker,
  late defender, near-empty deck) and record what move the greedy bot selects
  and why (log `evaluateMetrics` output per candidate move)
- For each position, assess whether the chosen move matches intuitive
  expert play
- Produce a written findings table: metric, gap observed, proposed fix direction
- Identify whether any metric actively misdirects the bot (scores worse for the
  objectively better move)

**Deliverable:** Written audit report (findings table + representative positions)
committed to `docs/HEURISTIC_AUDIT.md`. No code changes in this story —
findings feed Story 5.3.

---

#### Story 5.2 — MCTS Simulation Threshold Study

**Objective:** Find the minimum number of simulations per move at which MCTS
surpasses the greedy bot with statistical significance — or determine that no
such threshold exists within a practical budget.

**Background**

MCTS with very few simulations is effectively random: with 1 simulation per
move, each move gets exactly one playout and the outcome is noise. As
simulations increase, the win-rate estimates converge and signal should
dominate noise. The threshold study finds where (if ever) the signal is strong
enough to produce a measurably better move choice than greedy one-step
lookahead.

If MCTS never surpasses greedy regardless of simulation count, that is strong
evidence of a structural implementation problem (wrong playout policy, wrong
move evaluation, determinization bug) not just a tuning issue.

**Methodology**

Run the diagnostic ladder from Story 4.4 with increasing `--sims` values.
Use `--games 100` throughout for adequate statistical power.

```
# Baseline: confirm greedy beats random (must pass before proceeding)
npm run benchmark -- --p0 greedy --p1 random     --games 100

# Threshold sweep: greedy (P0) vs MCTS (P1) at each sim count
npm run benchmark -- --p0 greedy --p1 mcts --sims   1  --games 100
npm run benchmark -- --p0 greedy --p1 mcts --sims   5  --games 100
npm run benchmark -- --p0 greedy --p1 mcts --sims  10  --games 100
npm run benchmark -- --p0 greedy --p1 mcts --sims  25  --games 100
npm run benchmark -- --p0 greedy --p1 mcts --sims  50  --games 100
npm run benchmark -- --p0 greedy --p1 mcts --sims 100  --games 100
npm run benchmark -- --p0 greedy --p1 mcts --sims 200  --games 100
```

Record the P1 (MCTS) win rate and CI95 for each row. The threshold is the
lowest `--sims` where the CI95 low bound exceeds 50% (i.e. the band does not
include 50%).

**Expected results table** (to be filled in when running the study):

| `--sims` | MCTS win rate | CI95 | Significance |
|----------|--------------|------|-------------|
| 1 | _ | _ | _ |
| 5 | _ | _ | _ |
| 10 | _ | _ | _ |
| 25 | _ | _ | _ |
| 50 | _ | _ | _ |
| 100 | _ | _ | _ |
| 200 | _ | _ | _ |

**Interpretation guide**

- MCTS win rate < 50% at all counts → implementation is broken; revisit
  playout policy, determinization correctness, and move index mapping
- MCTS win rate > 50% only at high counts (≥ 100) → algorithm is correct but
  the random playout baseline is weak; consider heuristic-guided playouts
  (Epic 7 scope)
- MCTS win rate > 50% at low counts (≤ 25) → algorithm is healthy; tune
  `mcts-fast` default to that threshold and remove `mcts` as a separate variant

**Deliverable:** Completed results table committed to `docs/MCTS_THRESHOLD.md`.
No code changes in this story unless the study reveals an obvious implementation
bug, in which case the fix is a separate PR referencing the findings doc.

---

#### Story 5.3 — Role-Differentiated Strategy Analysis

**Objective:** Evaluate how each brain performs differently as attacker vs
defender, with a focus on identifying gaps in the defence strategy — the role
that received the least explicit design attention.

**Why attacker and defender require different reasoning**

In Tan, the two roles in each round have fundamentally different objectives
and legal move sets:

| Dimension | Attacker | Defender |
|-----------|---------|---------|
| Goal | Force opponent to pick up cards | Beat all attacks with minimum card cost |
| Move options | Play any card (first attack); same-rank only (follow-on); or pass | Beat the current attack card; or give up |
| Risk profile | Can control pace; choosing not to attack more costs nothing | Every undefended attack card goes into hand |
| Trump usage | Ideally save trumps; attack with non-trump bait | Trumps are the last resort; spending one to defend a low attack is a loss |
| Optimal fail state | Spend minimum cards to stay in initiative | Give up only when all defences cost more than the pickups |

**Gaps in the current greedy heuristic (from Story 5.1 audit)**

The greedy heuristic uses the same `evaluateState` for both roles. The only
role-aware signal is `roundPressure`, which is weak. As a result:

- The bot may over-spend trumps defending low-rank non-trump attacks (pays too
  much to avoid giving up)
- The bot may under-attack: `handEconomy` penalises playing cards, so the
  attacker may pass too early to preserve hand size
- `give_up` is never directly evaluated for *how much* is being picked up — the
  bot treats picking up 1 card the same as picking up 5

**Gaps in the current MCTS playout (from Story 5.2 observations)**

MCTS uses `runFromState` for playouts, which picks moves uniformly at random.
A random playout from the defender's position is an extremely weak signal:
random defenders give up constantly (it is always a legal move) and random
attackers play suboptimally. This means MCTS win-rate estimates from any
defender position are very noisy and biased toward the attacker.

**Tasks**

- Extend the benchmark to record role-specific win rates: track separately
  how often the bot wins when it started the game as attacker vs when it
  started as defender
- Analyse whether either brain shows a significant attacker/defender win-rate
  asymmetry (expected: attacker advantage exists in random play; should be
  reduced by good defence)
- Draft a set of proposed defence-aware metric changes:
  - `give_up` cost metric: weight the pickup by the number of round cards
    (giving up 4 is much worse than giving up 1)
  - Trump conservation metric: penalise spending a trump to defend a card
    with rank below a threshold
  - Defence efficiency: reward defending with the minimum-rank card that beats
    the attack (do not over-spend)
- Draft a proposal for role-aware MCTS playouts: weight `give_up` heavily in
  random playouts so the playout policy is not randomly generous to the attacker

**Deliverable:** Written analysis committed to `docs/ROLE_STRATEGY_ANALYSIS.md`,
covering: observed attacker/defender win-rate asymmetry per brain, identified
metric gaps, and specific proposed metric changes with before/after rationale.
Proposed metric changes are implemented in a subsequent story (not this one).

---

### EPIC 6 — Performance Optimization

**Goal:** Maintain responsive UI.

#### Story 6.1 — Web Worker Integration

**Tasks:**

- Move simulation into Web Worker
- Use message passing
- Prevent main-thread blocking

#### Story 6.2 — Performance Controls

**Tasks:**

- Add simulation time cap
- Add simulation count slider
- Benchmark simulations/sec
- Profile performance

**Deliverable:** Smooth UX with adjustable AI difficulty.

---

### EPIC 7 — Strategy Discovery Mode (Advanced)

**Goal:** Explore long-term optimal play.

#### Story 7.1 — Self-Play Mode

**Tasks:**

- Bot vs Bot mode
- Batch simulation mode
- Run 1,000+ games automatically
- Collect statistics

#### Story 7.2 — Data Logging

**Tasks:**

- Track win rates
- Track move frequencies
- Track game length
- Export results as JSON

#### Story 7.3 — Advanced AI (Optional Future)

Possible directions:

- Information Set MCTS
- Regret minimization techniques
- Strategy abstraction

---

## 5. Testing Strategy

**Unit tests**

- Deck behavior
- Move legality
- Win detection
- Deterministic simulation

**Integration tests**

- Full game from deal to win: run with a fixed seed, assert the outcome is valid and no illegal state transition occurs (catches engine integration bugs between deck, state, and rules).

**Simulation tests**

- Fixed-seed reproducibility
- Monte Carlo convergence tests

**Regression tests**

- Snapshot game states
- Validate no illegal transitions

---

## 6. Deployment Plan

| Aspect    | Choice           |
| --------- | ---------------- |
| Hosting   | GitHub Pages     |
| Build     | Vite             |
| CI/CD     | GitHub Actions   |

**Limitations:**

- No backend
- No persistent storage
- All compute client-side
- Heavy simulations must use Web Workers

---

## 7. Milestone Timeline

Each phase is done when its **Definition of Done** is met.

### Phase 1

- Engine complete (Epic 1)
- Minimal UI complete (Epic 2): two humans can play one full game in the browser

**Definition of Done:** All engine tests pass; two human players can complete a game in the browser (deal, moves, win display).

### Phase 2

- Heuristic AI complete (Epic 3)

**Definition of Done:** Player can play vs heuristic bot; bot chooses legal moves and game completes.

### Phase 3

- Monte Carlo AI (Epic 4)
- Performance / workers (Epic 5) so UI stays responsive
- Difficulty scaling

**Definition of Done:** Player can play vs MC bot with adjustable difficulty; simulations run in worker; no main-thread freeze.

### Phase 4

- Self-play mode (Epic 6)
- Strategy analytics

**Definition of Done:** Bot-vs-bot and batch runs possible; basic stats (e.g. win rate, game length) logged or exportable.

---

## 8. Long-Term Vision

The project can evolve into:

- A research sandbox for imperfect-information games
- A browser-based AI experimentation platform
- A portfolio-quality AI architecture example
- A stepping stone toward more advanced regret-minimization systems
