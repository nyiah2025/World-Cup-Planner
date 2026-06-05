#!/usr/bin/env node
// Replace nav dropdown <button> with <a> and update the click JS

const fs = require('fs');
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

// ── HTML replacements ────────────────────────────────────────────────────────
const REPLACEMENTS = [
  // Plain button (most pages)
  [
    '<button class="nav-home nav-drop-btn" id="navDropBtn" aria-haspopup="true" aria-expanded="false">🛠️ Tools ▾</button>',
    '<a href="#" class="nav-home nav-drop-btn" id="navDropBtn" role="button" aria-haspopup="true" aria-expanded="false">🛠️ Tools ▾</a>'
  ],
  // nav-active variant (wallchart page)
  [
    '<button class="nav-home nav-drop-btn nav-active" id="navDropBtn" aria-haspopup="true" aria-expanded="false">🛠️ Tools ▾</button>',
    '<a href="#" class="nav-home nav-drop-btn nav-active" id="navDropBtn" role="button" aria-haspopup="true" aria-expanded="false">🛠️ Tools ▾</a>'
  ],
  // JS: add preventDefault so anchor doesn't jump to top
  [
    "db.addEventListener('click',function(e){e.stopPropagation();",
    "db.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();"
  ]
];

const files = findHtml(SITE_DIR);
let changed = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let original = html;
  for (const [from, to] of REPLACEMENTS) {
    html = html.split(from).join(to);
  }
  if (html !== original) {
    fs.writeFileSync(file, html, 'utf8');
    changed++;
  }
}

console.log(`[fix-nav-drop-anchor] Updated ${changed} files.`);
