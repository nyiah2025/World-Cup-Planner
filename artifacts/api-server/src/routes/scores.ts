import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface MatchScore {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "final";
  clock?: string;
  date: string;
}

interface StandingEntry {
  team: string;
  position: number;
  points: number;
  played: number;
  gd: number;
  gf: number;
}

type GroupStandings = Record<string, StandingEntry[]>;

// ─── CACHE ───────────────────────────────────────────────────────────────────

const CACHE_TTL = 45_000;
let scoresCache: { data: MatchScore[]; ts: number } | null = null;
let standingsCache: { data: GroupStandings; ts: number } | null = null;

// ─── NAME NORMALISATION ──────────────────────────────────────────────────────

const ESPN_NAME_MAP: Record<string, string> = {
  "United States": "USA",
  "Bosnia-Herzegovina": "Bosnia & Herz.",
  "Bosnia and Herzegovina": "Bosnia & Herz.",
  "Ivory Coast": "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Turkey": "Türkiye",
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

// ─── ESPN FETCHING ───────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// Parse ESPN scoreboard JSON into MatchScore[].
// Works for both single-date and date-range ESPN API responses.
function parseScoreboardData(data: Record<string, unknown>): MatchScore[] {
  const events = (data.events as unknown[]) ?? [];

  return events.flatMap((evt): MatchScore[] => {
    const e = evt as Record<string, unknown>;
    const competitions = (e.competitions as unknown[]) ?? [];
    return competitions.map((comp): MatchScore => {
      const c = comp as Record<string, unknown>;
      const competitors = (c.competitors as unknown[]) ?? [];
      const home = (competitors as Record<string, unknown>[]).find(
        (x) => x.homeAway === "home",
      );
      const away = (competitors as Record<string, unknown>[]).find(
        (x) => x.homeAway === "away",
      );
      const statusObj = c.status as Record<string, unknown>;
      const statusType = statusObj?.type as Record<string, unknown>;
      const state = (statusType?.state as string) ?? "pre";
      const completed = (statusType?.completed as boolean) ?? false;

      const homeTeamObj = home?.team as Record<string, unknown>;
      const awayTeamObj = away?.team as Record<string, unknown>;

      return {
        homeTeam: normalizeTeamName((homeTeamObj?.displayName as string) ?? ""),
        awayTeam: normalizeTeamName((awayTeamObj?.displayName as string) ?? ""),
        homeScore: parseInt((home?.score as string) ?? "0", 10) || 0,
        awayScore: parseInt((away?.score as string) ?? "0", 10) || 0,
        status: completed ? "final" : state === "in" ? "live" : "scheduled",
        clock: (statusObj?.displayClock as string | undefined) ?? undefined,
        date: (e.date as string) ?? "",
      };
    });
  });
}

// Fetch ESPN scoreboard for a date param — either a single YYYYMMDD string
// or a range "YYYYMMDD-YYYYMMDD".  Returns [] on any error.
async function fetchScoreboardForDateParam(
  dateParam: string,
): Promise<MatchScore[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateParam}&limit=100`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, unknown>;
    return parseScoreboardData(data);
  } catch {
    return [];
  }
}

// ─── BRACKET DATE CONSTANTS ───────────────────────────────────────────────────

// FIFA World Cup 2026 knockout stage runs June 28 – July 19 (UTC).
// Expressed as YYYYMMDD strings for easy comparison with toDateStr() output.
const BRACKET_START = "20260628";
const BRACKET_END = "20260720"; // one day past the Final for safety

// ─── ROUTES ──────────────────────────────────────────────────────────────────

router.get("/scores", async (_req, res) => {
  try {
    if (scoresCache && Date.now() - scoresCache.ts < CACHE_TTL) {
      return res.json({ matches: scoresCache.data });
    }

    const today = new Date();
    const todayStr = toDateStr(today);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowStr = toDateStr(tomorrow);

    let all: MatchScore[];

    if (todayStr >= BRACKET_START && todayStr <= BRACKET_END) {
      // During the knockout stage, fetch the full bracket window in one range
      // query so results from earlier rounds are always included.
      // ESPN scoreboard API supports YYYYMMDD-YYYYMMDD range format.
      const rangeParam = `${BRACKET_START}-${tomorrowStr}`;
      all = await fetchScoreboardForDateParam(rangeParam);

      // If the range query returned nothing (API may not support the format),
      // fall back to fetching yesterday / today / tomorrow individually.
      if (all.length === 0) {
        logger.warn(
          "ESPN range query returned no results — falling back to ±1 day",
        );
        const dates = [-1, 0, 1].map((offset) => {
          const d = new Date(today);
          d.setUTCDate(d.getUTCDate() + offset);
          return toDateStr(d);
        });
        const parts = await Promise.all(
          dates.map((d) => fetchScoreboardForDateParam(d)),
        );
        all = parts.flat();
      }
    } else {
      // Outside the tournament window — standard ±1 day is sufficient.
      const dates = [-1, 0, 1].map((offset) => {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() + offset);
        return toDateStr(d);
      });
      const parts = await Promise.all(
        dates.map((d) => fetchScoreboardForDateParam(d)),
      );
      all = parts.flat();
    }

    const filtered = all.filter((m) => m.status !== "scheduled");
    scoresCache = { data: filtered, ts: Date.now() };
    return res.json({ matches: filtered });
  } catch (err) {
    logger.error({ err }, "Failed to fetch scores");
    return res.json({ matches: scoresCache?.data ?? [] });
  }
});

router.get("/standings", async (_req, res) => {
  try {
    if (standingsCache && Date.now() - standingsCache.ts < CACHE_TTL) {
      return res.json({ groups: standingsCache.data });
    }

    const url =
      "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) {
      return res.json({ groups: standingsCache?.data ?? {} });
    }

    const data = (await r.json()) as Record<string, unknown>;
    const groups: GroupStandings = {};

    const standingsArr = (data.children as unknown[]) ?? [];
    for (const group of standingsArr) {
      const g = group as Record<string, unknown>;
      const rawName = (g.name as string) ?? "";
      const groupName = rawName.replace(/^Group\s+/i, "").trim();
      if (!groupName) continue;

      const entries = (
        (g.standings as Record<string, unknown>)?.entries as unknown[]
      ) ?? [];

      groups[groupName] = entries.map(
        (e, i): StandingEntry => {
          const entry = e as Record<string, unknown>;
          const teamObj = entry.team as Record<string, unknown>;
          const stats = (entry.stats as Record<string, unknown>[]) ?? [];

          const getStat = (name: string): number =>
            parseInt(
              (stats.find((s) => s.name === name)?.value as string) ?? "0",
              10,
            ) || 0;

          return {
            team: normalizeTeamName((teamObj?.displayName as string) ?? ""),
            position: i + 1,
            points: getStat("points"),
            played: getStat("gamesPlayed"),
            gd: getStat("pointDifferential"),
            gf: getStat("pointsFor"),
          };
        },
      );
    }

    standingsCache = { data: groups, ts: Date.now() };
    return res.json({ groups });
  } catch (err) {
    logger.error({ err }, "Failed to fetch standings");
    return res.json({ groups: standingsCache?.data ?? {} });
  }
});

export default router;
