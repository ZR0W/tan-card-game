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
  Completed: 2026-04-27 | Notes: `chooseGreedyMove` in `src/ai/heuristicBot.ts`; wired in UI (vs-bot checkbox + `useGameSession`) and CLI `--bot`; tests `tests/ai/heuristicBot.test.ts`.

- [x] **Story 3.3** — Game audit log (UI)  
  Completed: 2026-04-27 | Notes: `src/ui/gameLog.ts`, `GameAuditPanel`, `useGameSession` log + `advanceSession`; `tests/ui/gameLog.test.ts`.

---

## EPIC 4 — Monte Carlo AI

- [x] **Story 4.1** — Determinization  
  Completed: 2026-05-22 | Notes: `generateDeterminizedState` in `src/ai/determinization.ts`; pools opponent hand + deck, shuffles with seeded RNG, re-splits by original count; 11 Vitest tests (card conservation, reproducibility, perspective correctness, playability).

- [x] **Story 4.2** — Monte Carlo Move Evaluation  
  Completed: 2026-05-22 | Notes: `chooseMctsMove` in `src/ai/mcts.ts`; flat Monte Carlo (N sims/move); audit API: `auditLog`, `auditLogToTimeSeries`, `MctsGraph`, `graphToDot`, `formatMctsResult`, `onProgress`; `npm run mcts-demo`; 38 Vitest tests.

- [x] **Story 4.3** — Bot Brain Toggle & Benchmark  
  Completed: 2026-05-22 | Notes: `BotBrain` type + `pickBotMove` in `src/ai/botBrain.ts`; brain-selector dropdown in UI; `npm run benchmark` CLI with per-game progress, Wilson CI95, significance note; `advanceSession` + `useGameSession` updated to accept `BotBrain | null`.

- [x] **Story 4.4** — Random Brain & Diagnostic Ladder  
  Completed: 2026-05-22 | Notes: `"random"` added to `BotBrain`; uses seeded Mulberry32 RNG for reproducibility; benchmark banner now shows explicit `--p0`/`--p1` flags and a `--sims` note when unused; diagnostic ladder documented in README.

---

## EPIC 5 — Brain Evaluation & Tuning

- [ ] **Story 5.1** — Greedy Heuristic Audit  
  Completed: _ | Notes: Walk through representative positions, log `evaluateMetrics` output per candidate move, produce findings table in `docs/HEURISTIC_AUDIT.md`. No code changes — findings feed Story 5.3.

- [ ] **Story 5.2** — MCTS Simulation Threshold Study  
  Completed: _ | Notes: Run `greedy vs mcts` benchmark sweep at sims=1,5,10,25,50,100,200 with --games 100 each. Record win rate + CI95. Find minimum sims where CI95 low > 50%. Document in `docs/MCTS_THRESHOLD.md`.

- [ ] **Story 5.3** — Role-Differentiated Strategy Analysis  
  Completed: _ | Notes: Measure attacker/defender win-rate asymmetry per brain. Draft defence-aware metric proposals and role-aware MCTS playout weights. Document in `docs/ROLE_STRATEGY_ANALYSIS.md`.

---

## EPIC 6 — Performance Optimization

- [ ] **Story 6.1** — Web Worker Integration  
  Completed: _ | Notes: _

- [ ] **Story 6.2** — Performance Controls  
  Completed: _ | Notes: _

---

## EPIC 7 — Strategy Discovery Mode (Advanced)

- [ ] **Story 7.1** — Self-Play Mode  
  Completed: _ | Notes: _

- [ ] **Story 7.2** — Data Logging  
  Completed: _ | Notes: _

- [ ] **Story 7.3** — Advanced AI (Optional Future)  
  Completed: _ | Notes: _
