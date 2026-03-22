# Progress — Epics & Stories

Track completion here. On GitHub, click a checkbox to toggle (it will commit the change).  
Full descriptions are in the [README](../README.md#4-development-roadmap-epics--stories).

---

## EPIC 1 — Core Game Engine

- [x] **Story 1.1** — Card & Deck System  
  Completed: 2025-02-19 | Notes: TypeScript engine (card, deck, seedable RNG); Fisher–Yates shuffle; immutable draw; Vitest tests (length, uniqueness, reproducibility).

- [x] **Story 1.2** — Game State Modeling  
  Completed: 2025-02-19 | Notes: PlayerState, GameState, Phase, createInitialGameState; JSON-safe; tests for shape, determinism, round-trip.

- [x] **Story 1.3** — Rules Engine  
  Completed: 2025-02-19 | Notes: Move types, getLegalMoves, applyMove (attack/defend/give_up/pass_attack/draw), cardBeats, getWinner; GameState.winner; IllegalMoveError; tests.

- [x] **Story 1.4** — Simulation Engine  
  Completed: 2025-02-19 | Notes: cloneGameState, runFromState, simulateRandomGame; determinism + 1k stress tests.

- [x] **Story 1.5** — CLI Runner  
  Completed: 2025-02-19 | Notes: src/cli/play.ts (tsx); hot-seat, --bot, --auto; args/format helpers; README CLI table.

---

## EPIC 2 — Minimal UI

- [x] **Story 2.1** — Game Board & Hand Display  
  Completed: 2025-03-22 | Notes: Vite + React; GameBoard, hands, turn indicator; seed field; `@engine` alias; RTL smoke test.

- [ ] **Story 2.2** — Move Input & Turn Flow  
  Completed: _ | Notes: _

- [ ] **Story 2.3** — Extended UI & Visual Card Design  
  Completed: _ | Notes: _

---

## EPIC 3 — Heuristic AI

- [ ] **Story 3.1** — Evaluation Function  
  Completed: _ | Notes: _

- [ ] **Story 3.2** — Greedy Bot  
  Completed: _ | Notes: _

---

## EPIC 4 — Monte Carlo AI

- [ ] **Story 4.1** — Determinization  
  Completed: _ | Notes: _

- [ ] **Story 4.2** — Monte Carlo Move Evaluation  
  Completed: _ | Notes: _

---

## EPIC 5 — Performance Optimization

- [ ] **Story 5.1** — Web Worker Integration  
  Completed: _ | Notes: _

- [ ] **Story 5.2** — Performance Controls  
  Completed: _ | Notes: _

---

## EPIC 6 — Strategy Discovery Mode (Advanced)

- [ ] **Story 6.1** — Self-Play Mode  
  Completed: _ | Notes: _

- [ ] **Story 6.2** — Data Logging  
  Completed: _ | Notes: _

- [ ] **Story 6.3** — Advanced AI (Optional Future)  
  Completed: _ | Notes: _
