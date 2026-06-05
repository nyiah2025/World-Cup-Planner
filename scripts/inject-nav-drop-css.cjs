#!/usr/bin/env node
// Inject <link rel="stylesheet" href="/assets/nav-drop.css"> into every HTML
// page that has the nav dropdown (contains nav-drop-wrap), if not already present.

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', 'site');
const LINK_TAG = '<link rel="stylesheet" href="/assets/nav-drop.css">';
// Insert after whichever base CSS link appears first
const ANCHORS = [
  '<link rel="stylesheet" href="/assets/base.4e99cbe0.css">',
];

function findHtml(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtml(full, results);
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const files = findHtml(SITE_DIR);
let injected = 0, skipped = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');

  // Only touch pages that have the dropdown
  if (!html.includes('nav-drop-wrap')) { skipped++; continue; }
  // Skip if already injected
  if (html.includes(LINK_TAG)) { skipped++; continue; }

  let inserted = false;
  for (const anchor of ANCHORS) {
    if (html.includes(anchor)) {
      html = html.replace(anchor, anchor + '\n' + LINK_TAG);
      inserted = true;
      break;
    }
  }

  if (inserted) {
    fs.writeFileSync(file, html, 'utf8');
    injected++;
  } else {
    // Fallback: inject before </head>
    html = html.replace('</head>', LINK_TAG + '\n</head>');
    fs.writeFileSync(file, html, 'utf8');
    injected++;
  }
}

console.log(`[inject-nav-drop-css] Injected: ${injected}, Skipped: ${skipped}`);
