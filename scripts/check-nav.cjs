#!/usr/bin/env node
// check-nav.cjs
// Compares the nav block inside generateTeamPage() in generate-schedule.cjs
// against the canonical reference in nav-reference.html.
// Exits with code 1 and a clear diff if they diverge.

'use strict';

const fs   = require('fs');
const path = require('path');

const GENERATOR  = path.join(__dirname, 'generate-schedule.cjs');
const REFERENCE  = path.join(__dirname, 'nav-reference.html');
const NAV_OPEN   = '<nav class="topnav">';
const NAV_CLOSE  = '</nav>';

// ── helpers ──────────────────────────────────────────────────────────────────

function extractNav(source, filePath) {
  const start = source.indexOf(NAV_OPEN);
  if (start === -1) {
    console.error(`[check-nav] ERROR: Could not find '${NAV_OPEN}' in ${filePath}`);
    process.exit(1);
  }
  const end = source.indexOf(NAV_CLOSE, start);
  if (end === -1) {
    console.error(`[check-nav] ERROR: Could not find closing '${NAV_CLOSE}' after nav open in ${filePath}`);
    process.exit(1);
  }
  return source.slice(start, end + NAV_CLOSE.length);
}

// Normalise: trim each line, collapse to single newlines, trim surrounding whitespace.
// This makes the comparison immune to trailing-space and blank-line churn.
function normalise(block) {
  return block
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n')
    .trim();
}

// Produce a simple line-level diff for the error message.
function lineDiff(aText, bText) {
  const aLines = aText.split('\n');
  const bLines = bText.split('\n');
  const maxLen  = Math.max(aLines.length, bLines.length);
  const lines   = [];

  for (let i = 0; i < maxLen; i++) {
    const a = aLines[i] ?? '(missing)';
    const b = bLines[i] ?? '(missing)';
    if (a !== b) {
      lines.push(`  line ${i + 1}:`);
      lines.push(`    reference : ${a}`);
      lines.push(`    generator : ${b}`);
    }
  }
  return lines.join('\n');
}

// ── main ─────────────────────────────────────────────────────────────────────

const generatorSrc = fs.readFileSync(GENERATOR,  'utf8');
const referenceSrc = fs.readFileSync(REFERENCE,  'utf8');

const generatorNav = normalise(extractNav(generatorSrc, GENERATOR));
const referenceNav = normalise(referenceSrc);

if (generatorNav === referenceNav) {
  console.log('[check-nav] ✓ Nav block in generateTeamPage() matches nav-reference.html');
  process.exit(0);
}

console.error('[check-nav] ✗ Nav block drift detected!\n');
console.error('The nav block inside generateTeamPage() in generate-schedule.cjs');
console.error('no longer matches the canonical snippet in scripts/nav-reference.html.\n');
console.error('Differences (reference → generator):');
console.error(lineDiff(referenceNav, generatorNav));
console.error('\nTo fix: update nav-reference.html OR restore the nav in generateTeamPage()');
console.error('so both files are in sync, then re-run: node scripts/check-nav.cjs');
process.exit(1);
