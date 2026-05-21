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

- [x] **Story 2.2** — Move Input & Turn Flow  
  Completed: 2025-03-22 | Notes: useGameSession; MovePanel + applyMove; both hands face-up hot-seat; game-over banner; RTL tests.

- [x] **Story 2.3** — Extended UI & Visual Card Design  
  Completed: 2025-03-22 | Notes: CardFace/CardBack/HandRow, local SVG suit+back assets, split style tokens/layout/cards, responsive and accessibility polish.

---

## EPIC 3 — Heuristic AI

- [x] **Story 3.1** — Evaluation Function  
  Completed: 2026-04-27 | Notes: `evaluateMetrics` / `combineMetrics` / `evaluateState` in `src/ai/`; Vitest `tests/ai/evaluation.test.ts`.

- [x] **Story 3.2** — Greedy Bot  
  Completed: 2026-04-27 | Notes: `chooseGreedyMove` tests-only. Production vs-bot / `--bot`: Epic 4 MC via `chooseMonteCarloMove` + `advanceSession`.

- [x] **Story 3.3** — Game audit log (UI)  
  Completed: 2026-04-27 | Notes: `src/ui/gameLog.ts`, `GameAuditPanel`, `useGameSession` log + `advanceSession`; `tests/ui/gameLog.test.ts`.

---

## EPIC 4 — Monte Carlo AI

- [x] **Story 4.1** — Determinization  
  Completed: 2026-04-27 | Notes: `generateDeterminizedState` in `src/ai/determinization.ts`; `tests/ai/determinization.test.ts`.

- [x] **Story 4.2** — Monte Carlo Move Evaluation  
  Completed: 2026-04-27 | Notes: `chooseMonteCarloMove`, `resolveMoveForDeterminized` in `src/ai/monteCarlo.ts`; `advanceSession` + CLI `--bot`; `tests/ai/monteCarlo.test.ts`.

- [x] **Story 4.3** — Monte Carlo structured debug logging  
  Completed: 2026-04-27 | Notes: `MonteCarloDecisionRecord`, `onDecision` in `monteCarlo.ts`; `AdvanceSessionContext.monteCarloOptions`; `mcDebug.ts` + env `TAN_MC_DEBUG`/`MC_DEBUG`; tests in `monteCarlo.test.ts`.

- [ ] **Story 4.4** — Worker + UI integration for MC  
  Completed: _ | Notes: Optional split; see README Epic 4.

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
