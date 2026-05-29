#!/usr/bin/env node
/**
 * fingerprint.cjs
 * Content-based fingerprinting for CSS and JS files in site/assets/.
 *
 * What it does:
 *  1. Hashes every source CSS/JS file in site/assets/ (files without a hash
 *     already in their name).
 *  2. Writes a fingerprinted copy, e.g. team-page.3713d274.css.
 *  3. Removes stale fingerprinted versions from previous builds.
 *  4. Walks every *.html file under site/ and rewrites any reference to an
 *     old fingerprinted path (/assets/name.OLDHASH.ext) so it points to the
 *     new path (/assets/name.NEWHASH.ext). This keeps existing pages correct
 *     without re-running generate-schedule.cjs.
 *  5. Writes site/assets/manifest.json mapping source path → fingerprinted path
 *     so generate-schedule.cjs can embed the right URL when regenerating pages.
 *
 * Run:  node scripts/fingerprint.cjs
 *        – or –  pnpm run fingerprint
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const ASSETS_DIR   = path.join(__dirname, '..', 'site', 'assets');
const SITE_DIR     = path.join(__dirname, '..', 'site');
const MANIFEST_OUT = path.join(ASSETS_DIR, 'manifest.json');

// Matches already-fingerprinted filenames: name.8hexchars.ext
const FINGERPRINTED_RE = /^(.+)\.[0-9a-f]{8}\.(css|js)$/;

// Matches fingerprinted asset URLs inside HTML: /assets/name.8hexchars.ext
const ASSET_URL_RE = /\/assets\/([^"'\s]+\.[0-9a-f]{8}\.(css|js))/g;

function sha1Hash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
}

// Recursively find all .html files under a directory.
function findHtmlFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(full, results);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(ASSETS_DIR);

  // Identify source files (CSS/JS without a fingerprint in their name)
  const sourceFiles = entries.filter(name => {
    const ext = path.extname(name);
    if (ext !== '.css' && ext !== '.js') return false;
    return !FINGERPRINTED_RE.test(name);
  });

  // Read old manifest so we know which old hashed filenames to replace in HTML
  let oldManifest = {};
  if (fs.existsSync(MANIFEST_OUT)) {
    try { oldManifest = JSON.parse(fs.readFileSync(MANIFEST_OUT, 'utf8')); } catch (_) {}
  }

  // Build a replacement map: old fingerprinted name → new fingerprinted name
  const replacements = {}; // e.g. { 'team-page.842d5ba0.css': 'team-page.3713d274.css' }

  // Remove every existing fingerprinted file so stale hashes don't accumulate
  const staleFiles = entries.filter(name => FINGERPRINTED_RE.test(name));
  for (const name of staleFiles) {
    fs.unlinkSync(path.join(ASSETS_DIR, name));
    console.log(`[fingerprint] Removed stale: assets/${name}`);
  }

  // Hash each source file and write its fingerprinted twin
  const manifest = {};
  for (const name of sourceFiles) {
    const ext        = path.extname(name);
    const base       = path.basename(name, ext);
    const srcPath    = path.join(ASSETS_DIR, name);
    const hash       = sha1Hash(srcPath);
    const hashedName = `${base}.${hash}${ext}`;
    const destPath   = path.join(ASSETS_DIR, hashedName);

    fs.copyFileSync(srcPath, destPath);
    manifest[`/assets/${name}`] = `/assets/${hashedName}`;
    console.log(`[fingerprint] ${name} → ${hashedName}`);

    // Record the old→new mapping for HTML patching below
    const oldHashed = oldManifest[`/assets/${name}`];
    if (oldHashed) {
      const oldName = path.basename(oldHashed);
      if (oldName !== hashedName) {
        replacements[oldName] = hashedName;
      }
    }
  }

  // Write manifest so generate-schedule.cjs and other scripts can embed hashed paths
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`[fingerprint] Written manifest.json (${Object.keys(manifest).length} entries)`);

  // Patch all existing HTML files to reference new hashed filenames
  if (Object.keys(replacements).length === 0) {
    console.log('[fingerprint] No hash changes — HTML files unchanged.');
    return;
  }

  const htmlFiles = findHtmlFiles(SITE_DIR);
  let patchedCount = 0;

  for (const htmlPath of htmlFiles) {
    const original = fs.readFileSync(htmlPath, 'utf8');
    const updated  = original.replace(ASSET_URL_RE, (match, filename) => {
      const newName = replacements[filename];
      return newName ? `/assets/${newName}` : match;
    });

    if (updated !== original) {
      fs.writeFileSync(htmlPath, updated, 'utf8');
      patchedCount++;
    }
  }

  console.log(`[fingerprint] Patched ${patchedCount} HTML file(s) with new asset references.`);
}

main();
