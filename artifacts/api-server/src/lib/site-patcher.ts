import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger";

const DIST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(DIST_DIR, "../../../site");

const STANDINGS_PATTERN =
  /(\/\/ ─── STANDINGS \(embedded at build time\) ──────────────────────────\nconst STANDINGS = ).*?;/;

function collectPatchableFiles(): string[] {
  const files: string[] = [];

  // Always include the top-level pages
  const rootPages = [
    path.join(SITE_DIR, "index.html"),
    path.join(SITE_DIR, "schedule", "index.html"),
  ];
  for (const p of rootPages) {
    if (fs.existsSync(p)) files.push(p);
  }

  // Scan immediate subdirectories for team pages that embed the STANDINGS marker
  try {
    const entries = fs.readdirSync(SITE_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const teamPage = path.join(SITE_DIR, entry.name, "index.html");
      if (files.includes(teamPage)) continue;
      if (!fs.existsSync(teamPage)) continue;
      try {
        const content = fs.readFileSync(teamPage, "utf8");
        if (STANDINGS_PATTERN.test(content)) {
          files.push(teamPage);
        }
      } catch {
        // ignore unreadable files
      }
    }
  } catch (err) {
    logger.warn({ err }, "site-patcher: failed to scan site subdirectories");
  }

  return files;
}

export function patchStandingsIntoHtml(
  groups: Record<string, unknown>,
): void {
  const json = JSON.stringify(groups);
  const patchableFiles = collectPatchableFiles();
  let patched = 0;
  let skipped = 0;

  for (const filePath of patchableFiles) {
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

  if (patched > 0 || skipped > 0) {
    logger.info(
      { patched, skipped, total: patchableFiles.length },
      "site-patcher: embedded standings refreshed in HTML",
    );
  }
}
