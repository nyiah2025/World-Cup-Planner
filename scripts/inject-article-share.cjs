#!/usr/bin/env node
// inject-article-share.cjs
//
// Ensures every article page under site/articles/<slug>/index.html includes
// the canonical share-button script.  Run after fingerprint.cjs so the
// manifest is current and injected references use the hashed filename.
//
// What it does:
//  1. Reads site/assets/manifest.json to resolve the fingerprinted URL for
//     article-share.js (falls back to /assets/article-share.js when absent).
//  2. Walks every site/articles/<slug>/index.html file.
//  3. Pages with the correct fingerprinted reference: left untouched.
//  4. Pages with a plain /assets/article-share.js reference: upgraded.
//  5. Pages with no reference at all: script tag injected before </body>.
//
// Run:  node scripts/inject-article-share.cjs
//        – or –  pnpm run inject-share

'use strict';

const fs   = require('fs');
const path = require('path');

const SITE_DIR      = path.join(__dirname, '..', 'site');
const ARTICLES_DIR  = path.join(SITE_DIR, 'articles');
const MANIFEST_PATH = path.join(SITE_DIR, 'assets', 'manifest.json');
const PLAIN_REF     = '/assets/article-share.js';

function getScriptUrl() {
  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    return manifest[PLAIN_REF] || PLAIN_REF;
  } catch (_) {
    return PLAIN_REF;
  }
}

function articleHtmlFiles() {
  const results = [];
  for (const entry of fs.readdirSync(ARTICLES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(ARTICLES_DIR, entry.name, 'index.html');
    if (fs.existsSync(candidate)) results.push(candidate);
  }
  return results;
}

function main() {
  const fingerprinted = getScriptUrl();
  const scriptTag     = `<script src="${fingerprinted}"></script>`;

  const files = articleHtmlFiles();
  let injected = 0, upgraded = 0, skipped = 0;

  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Already has the correct fingerprinted reference — nothing to do.
    if (content.includes(fingerprinted)) {
      skipped++;
      continue;
    }

    // Has a plain (non-fingerprinted) reference — upgrade it.
    if (content.includes(PLAIN_REF)) {
      const escaped = PLAIN_REF.replace(/[/]/g, '\\/');
      content = content.replace(
        new RegExp('<script\\s+src="' + escaped + '"\\s*><\\/script>', 'g'),
        scriptTag
      );
      fs.writeFileSync(filePath, content, 'utf8');
      upgraded++;
      console.log(`[inject-share] Upgraded: ${path.relative(SITE_DIR, filePath)}`);
      continue;
    }

    // No reference at all — inject before </body>.
    if (!content.includes('</body>')) {
      console.warn(`[inject-share] WARN: no </body> tag in ${filePath}, skipping`);
      skipped++;
      continue;
    }

    content = content.replace('</body>', `${scriptTag}\n</body>`);
    fs.writeFileSync(filePath, content, 'utf8');
    injected++;
    console.log(`[inject-share] Injected: ${path.relative(SITE_DIR, filePath)}`);
  }

  console.log(
    `[inject-share] Done — ${injected} injected, ${upgraded} upgraded, ${skipped} unchanged.`
  );
}

main();
