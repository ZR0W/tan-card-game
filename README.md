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
| `npm run play -- --bot` | You are player 0; player 1 plays random legal moves. |
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

#### Story 3.2 — Greedy Bot

**Objective:** One-step lookahead bot.

**Tasks:**

- Generate all legal moves
- Apply each move to cloned state
- Evaluate resulting state
- Choose highest scoring move

**Deliverable:** Playable heuristic AI.

---

### EPIC 4 — Monte Carlo AI

**Goal:** Introduce probabilistic reasoning.

**Worker timing:** To keep the UI responsive, run simulations in a Web Worker from the start of this epic (or as the first story). Either add a minimal "run simulations in worker" task here or complete Epic 5 (Performance) before raising simulation counts.

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

---

### EPIC 5 — Performance Optimization

**Goal:** Maintain responsive UI.

#### Story 5.1 — Web Worker Integration

**Tasks:**

- Move simulation into Web Worker
- Use message passing
- Prevent main-thread blocking

#### Story 5.2 — Performance Controls

**Tasks:**

- Add simulation time cap
- Add simulation count slider
- Benchmark simulations/sec
- Profile performance

**Deliverable:** Smooth UX with adjustable AI difficulty.

---

### EPIC 6 — Strategy Discovery Mode (Advanced)

**Goal:** Explore long-term optimal play.

#### Story 6.1 — Self-Play Mode

**Tasks:**

- Bot vs Bot mode
- Batch simulation mode
- Run 1,000+ games automatically
- Collect statistics

#### Story 6.2 — Data Logging

**Tasks:**

- Track win rates
- Track move frequencies
- Track game length
- Export results as JSON

#### Story 6.3 — Advanced AI (Optional Future)

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
