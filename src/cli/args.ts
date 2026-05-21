/**
 * CLI argument parsing for `npm run play -- [options] [seed]`.
 */

export interface PlayCliArgs {
  seed: number;
  /** Human (P0) vs Monte Carlo bot (P1). */
  bot: boolean;
  /** Print each step of a fully random game (spectator). */
  auto: boolean;
  help: boolean;
}

const DEFAULT_SEED = 12345;

export function parsePlayArgs(argv: string[]): PlayCliArgs {
  let bot = false;
  let auto = false;
  let help = false;
  const rest: string[] = [];

  for (const a of argv) {
    if (a === "--bot" || a === "--vs-bot") {
      bot = true;
    } else if (a === "--auto" || a === "--simulate") {
      auto = true;
    } else if (a === "--help" || a === "-h") {
      help = true;
    } else {
      rest.push(a);
    }
  }

  const numeric = rest.filter((x) => /^\d+$/.test(x)).map(Number);
  const seed = numeric.length > 0 ? numeric[0]! : DEFAULT_SEED;

  return { seed, bot, auto, help };
}

export function playCliHelpText(): string {
  return `tan — CLI play

Usage:
  npm run play
  npm run play -- [seed]
  npm run play -- --bot [seed]
  npm run play -- --auto [seed]

Options:
  --bot, --vs-bot   You are player 0; player 1 uses Monte Carlo (determinization + rollouts).
  --auto, --simulate   Print a full random game (no input).
  -h, --help        Show this help.

Environment (optional):
  TAN_MC_DEBUG=1 or MC_DEBUG=1   With --bot, log each MC decision as JSON (console.debug).

Seed:
  Optional integer; default is ${DEFAULT_SEED} if omitted.
`;
}
