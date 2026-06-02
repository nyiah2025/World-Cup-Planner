#!/usr/bin/env node
'use strict';

// inject-twitter-tags.cjs
//
// Ensures every article page has the correct Twitter Card meta tags:
//   <meta name="twitter:card" content="summary_large_image">
//   <meta name="twitter:image" content="<absolute og:image URL>">
//
// Rules:
//  - Idempotent: skips any file that already has twitter:card.
//  - Derives twitter:image from the existing og:image value (always absolute).
//  - Covers all site/articles/<slug>/index.html pages.
//  - Also covers site/articles/index.html (the listing page).

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '../site/articles');

function processFile(filePath, label) {
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('twitter:card')) {
    console.log(`SKIP (already has twitter:card): ${label}`);
    return;
  }

  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"\s*\/?>/);
  if (!ogImageMatch) {
    console.log(`SKIP (no og:image found): ${label}`);
    return;
  }

  const ogImageUrl = ogImageMatch[1];
  const ogImageTag = ogImageMatch[0];

  const replacement = `${ogImageTag}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImageUrl}">`;

  html = html.replace(ogImageTag, replacement);
  fs.writeFileSync(filePath, html);
  console.log(`UPDATED: ${label} -> ${ogImageUrl}`);
}

// Process the listing page
const listingPage = path.join(ARTICLES_DIR, 'index.html');
if (fs.existsSync(listingPage)) {
  processFile(listingPage, 'articles/index.html');
}

// Process all article detail pages
const slugs = fs.readdirSync(ARTICLES_DIR).filter(entry => {
  return fs.statSync(path.join(ARTICLES_DIR, entry)).isDirectory();
});

let updated = 0;
for (const slug of slugs) {
  const filePath = path.join(ARTICLES_DIR, slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;
  const before = fs.readFileSync(filePath, 'utf8');
  processFile(filePath, slug);
  const after = fs.readFileSync(filePath, 'utf8');
  if (before !== after) updated++;
}

console.log(`\nDone. ${updated} article(s) updated.`);
