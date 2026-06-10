#!/usr/bin/env node
/**
 * remove-watch-nav-link.cjs
 * Removes the Watch nav link from every HTML file under site/.
 * Handles both the standard link and the nav-active variant.
 *
 * Run: node scripts/remove-watch-nav-link.cjs
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'site');

function findHtml(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtml(full, results);
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const WATCH_VARIANTS = [
  '    <a href="/watch/" class="nav-home nav-active">Watch</a>\n',
  '    <a href="/watch/" class="nav-home">Watch</a>\n',
  '<a href="/watch/" class="nav-home nav-active">Watch</a>\n',
  '<a href="/watch/" class="nav-home">Watch</a>\n',
];

function main() {
  const files = findHtml(SITE_DIR);
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const variant of WATCH_VARIANTS) {
      if (html.includes(variant)) {
        html = html.split(variant).join('');
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(file, html, 'utf8');
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`[remove-watch-nav] Updated: ${updated} files`);
  console.log(`[remove-watch-nav] Unchanged: ${skipped} files`);
}

main();
