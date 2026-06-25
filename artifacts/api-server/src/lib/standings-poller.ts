import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger";

const POLL_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const ESPN_URL =
  "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";

// At runtime the bundle lives at artifacts/api-server/dist/index.mjs.
// Three levels up reaches the workspace root; then we descend into site/.
const DIST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(DIST_DIR, "../../../site");
const CACHE_PATH = path.join(SITE_DIR, "standings.json");

const ESPN_NAME_MAP: Record<string, string> = {
  "United States": "USA",
  "Bosnia-Herzegovina": "Bosnia & Herz.",
  "Bosnia and Herzegovina": "Bosnia & Herz.",
  "Ivory Coast": "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  Turkey: "Türkiye",
  "Czech Republic": "Czechia",
  "Democratic Republic of Congo": "DR Congo",
  "Congo DR": "DR Congo",
  "Congo, DR": "DR Congo",
  "Republic of Korea": "South Korea",
  "Korea Republic": "South Korea",
  "IR Iran": "Iran",
  "United States of America": "USA",
};

function normalizeTeamName(name: string): string {
  return ESPN_NAME_MAP[name] ?? name;
}

export async function fetchAndCacheStandings(): Promise<void> {
  try {
    const res = await fetch(ESPN_URL, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      logger.warn(
        { status: res.status },
        "standings-poller: ESPN returned non-OK status",
      );
      return;
    }

    const data = (await res.json()) as Record<string, unknown>;
    const groups: Record<
      string,
      {
        team: string;
        position: number;
        points: number;
        played: number;
        gd: number;
        gf: number;
      }[]
    > = {};

    for (const child of (data.children as unknown[]) ?? []) {
      const g = child as Record<string, unknown>;
      const rawName = (g.name as string) ?? "";
      const groupName = rawName.replace(/^Group\s+/i, "").trim();
      if (!groupName) continue;

      const entries =
        ((g.standings as Record<string, unknown>)?.entries as unknown[]) ?? [];

      const mapped = entries.map((e, i) => {
        const entry = e as Record<string, unknown>;
        const teamObj = entry.team as Record<string, unknown>;
        const stats = (entry.stats as Record<string, unknown>[]) ?? [];
        const note = entry.note as Record<string, unknown> | undefined;
        const rank = typeof note?.rank === "number" ? note.rank : i + 1;

        const getStat = (name: string): number =>
          parseInt(
            (stats.find((s) => s.name === name)?.value as string) ?? "0",
            10,
          ) || 0;

        return {
          _rank: rank,
          team: normalizeTeamName((teamObj?.displayName as string) ?? ""),
          position: rank,
          points: getStat("points"),
          played: getStat("gamesPlayed"),
          gd: getStat("pointDifferential"),
          gf: getStat("pointsFor"),
        };
      });

      mapped.sort((a, b) => a._rank - b._rank);
      groups[groupName] = mapped.map(({ _rank: _, ...rest }) => rest);
    }

    const groupCount = Object.keys(groups).length;
    if (groupCount === 0) {
      logger.warn("standings-poller: ESPN returned 0 groups — skipping write");
      return;
    }

    const payload = JSON.stringify(
      { fetchedAt: new Date().toISOString(), groups },
      null,
      2,
    );
    fs.writeFileSync(CACHE_PATH, payload, "utf8");
    logger.info(
      { groups: groupCount, path: CACHE_PATH },
      "standings-poller: cache updated",
    );
  } catch (err) {
    logger.error({ err }, "standings-poller: fetch failed");
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startStandingsPoller(): void {
  if (timer) return;

  // Fetch immediately on startup, then every POLL_INTERVAL_MS
  fetchAndCacheStandings();

  timer = setInterval(() => {
    fetchAndCacheStandings();
  }, POLL_INTERVAL_MS);

  // Don't keep the process alive solely for this timer
  timer.unref();

  logger.info(
    { intervalHours: POLL_INTERVAL_MS / 3_600_000 },
    "standings-poller: started",
  );
}
