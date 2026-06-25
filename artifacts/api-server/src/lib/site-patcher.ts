import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger";

const DIST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(DIST_DIR, "../../../site");

const STANDINGS_PATTERN =
  /(\/\/ ─── STANDINGS \(embedded at build time\) ──────────────────────────\nconst STANDINGS = ).*?;/;

const PATCHED_FILES = [
  path.join(SITE_DIR, "index.html"),
  path.join(SITE_DIR, "schedule", "index.html"),
];

export function patchStandingsIntoHtml(
  groups: Record<string, unknown>,
): void {
  const json = JSON.stringify(groups);
  let patched = 0;
  let skipped = 0;

  for (const filePath of PATCHED_FILES) {
    if (!fs.existsSync(filePath)) {
      logger.warn({ filePath }, "site-patcher: HTML file not found, skipping");
      skipped++;
      continue;
    }

    try {
      const original = fs.readFileSync(filePath, "utf8");

      if (!STANDINGS_PATTERN.test(original)) {
        logger.warn(
          { filePath },
          "site-patcher: STANDINGS marker not found in file, skipping",
        );
        skipped++;
        continue;
      }

      const updated = original.replace(
        STANDINGS_PATTERN,
        `$1${json};`,
      );

      if (updated === original) {
        logger.debug({ filePath }, "site-patcher: no change needed");
        continue;
      }

      fs.writeFileSync(filePath, updated, "utf8");
      logger.info({ filePath }, "site-patcher: STANDINGS constant updated");
      patched++;
    } catch (err) {
      logger.error({ err, filePath }, "site-patcher: failed to patch file");
    }
  }

  if (patched > 0) {
    logger.info(
      { patched, skipped },
      "site-patcher: embedded standings refreshed in HTML",
    );
  }
}
