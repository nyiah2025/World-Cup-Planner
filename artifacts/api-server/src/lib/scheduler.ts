import { spawn } from "node:child_process";
import path from "node:path";
import { logger } from "./logger";

// ─── TOURNAMENT WINDOW ───────────────────────────────────────────────────────

// FIFA World Cup 2026 knockout stage: June 28 – July 19 (UTC).
// We run until July 20 (exclusive) to cover the Final day.
const TOURNAMENT_START = new Date("2026-06-28T00:00:00Z");
const TOURNAMENT_END = new Date("2026-07-20T00:00:00Z");

function isWithinTournamentWindow(): boolean {
  const now = new Date();
  return now >= TOURNAMENT_START && now < TOURNAMENT_END;
}

// ─── SCRIPT PATH ─────────────────────────────────────────────────────────────

// At runtime, __dirname is the compiled dist/ directory (injected by the
// esbuild banner). The generate-schedule.cjs script lives three levels up in
// <workspace-root>/scripts/.
const SCRIPT_PATH = path.resolve(
  __dirname,
  "../../../scripts/generate-schedule.cjs",
);

// ─── RUNNER ──────────────────────────────────────────────────────────────────

let running = false;

function runGenerateSchedule(): Promise<void> {
  if (running) {
    logger.info("[scheduler] generate-schedule already running — skipping");
    return Promise.resolve();
  }

  running = true;
  const start = Date.now();
  logger.info({ script: SCRIPT_PATH }, "[scheduler] running generate-schedule");

  return new Promise((resolve) => {
    const child = spawn("node", [SCRIPT_PATH], {
      stdio: ["ignore", "pipe", "pipe"],
      // Run from the workspace root so the script's relative file reads work.
      cwd: path.resolve(__dirname, "../../.."),
    });

    const lines: string[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      lines.push(chunk.toString().trimEnd());
    });

    child.stderr.on("data", (chunk: Buffer) => {
      lines.push(chunk.toString().trimEnd());
    });

    child.on("close", (code) => {
      running = false;
      const elapsed = Date.now() - start;

      if (code === 0) {
        logger.info(
          { elapsed },
          "[scheduler] generate-schedule completed successfully",
        );
      } else {
        logger.error(
          { code, elapsed, output: lines.join("\n") },
          "[scheduler] generate-schedule exited with non-zero code",
        );
      }

      resolve();
    });

    child.on("error", (err) => {
      running = false;
      logger.error(
        { err },
        "[scheduler] failed to spawn generate-schedule process",
      );
      resolve();
    });
  });
}

// ─── SCHEDULE ────────────────────────────────────────────────────────────────

const INTERVAL_MS = 45 * 60 * 1000; // 45 minutes

export function startScheduler(): void {
  if (!isWithinTournamentWindow()) {
    logger.info(
      {
        start: TOURNAMENT_START.toISOString(),
        end: TOURNAMENT_END.toISOString(),
      },
      "[scheduler] outside tournament window — scheduled re-embeds disabled",
    );
    return;
  }

  logger.info(
    { intervalMinutes: 45 },
    "[scheduler] starting bracket refresh scheduler",
  );

  // Run once immediately so the first visitor after a restart sees fresh data.
  void runGenerateSchedule();

  // Then run on a fixed interval for the rest of the tournament window.
  const timer = setInterval(() => {
    if (!isWithinTournamentWindow()) {
      logger.info("[scheduler] tournament window ended — stopping scheduler");
      clearInterval(timer);
      return;
    }
    void runGenerateSchedule();
  }, INTERVAL_MS);

  // Don't let this timer keep the process alive on its own.
  timer.unref();
}
