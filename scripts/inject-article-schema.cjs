#!/usr/bin/env node
// inject-article-schema.cjs
//
// Ensures every article page under site/articles/<slug>/index.html includes
// an Article JSON-LD block in <head>.  Run after inject-article-share.cjs.
//
// What it does:
//  1. Walks every site/articles/<slug>/index.html file.
//  2. Pages that already contain application/ld+json: left untouched (idempotent).
//  3. Pages without schema: parses title, description, og:image, canonical URL,
//     author, and date from the HTML, then injects a JSON-LD block before </head>.
//
// Parsing strategy (regex-based, no DOM parser needed):
//  - headline      : <title>...</title>, ` | myteamkickoff.com` suffix stripped
//  - description   : <meta name="description" content="...">
//  - image         : <meta property="og:image" content="...">
//  - url           : <link rel="canonical" href="...">
//  - author        : first hero-meta <span> containing ✍️, emoji stripped
//  - datePublished : first hero-meta <span> containing 📅, "Month YYYY" → ISO date
//
// Fallbacks are safe defaults when a field cannot be parsed.
//
// Run:  node scripts/inject-article-schema.cjs

'use strict';

const fs   = require('fs');
const path = require('path');

const SITE_DIR     = path.join(__dirname, '..', 'site');
const ARTICLES_DIR = path.join(SITE_DIR, 'articles');

const MONTH_MAP = {
  january:   '01', february: '02', march:    '03', april:    '04',
  may:       '05', june:     '06', july:     '07', august:   '08',
  september: '09', october:  '10', november: '11', december: '12',
};

function articleHtmlFiles() {
  const results = [];
  for (const entry of fs.readdirSync(ARTICLES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(ARTICLES_DIR, entry.name, 'index.html');
    if (fs.existsSync(candidate)) results.push(candidate);
  }
  return results;
}

function extract(content, pattern, group) {
  group = group == null ? 1 : group;
  const m = content.match(pattern);
  return m ? m[group].trim() : null;
}

function parseDate(raw) {
  if (!raw) return '2026-05-01';
  const m = raw.match(/([A-Za-z]+)\s+(\d{4})/);
  if (!m) return '2026-05-01';
  const month = MONTH_MAP[m[1].toLowerCase()];
  return month ? `${m[2]}-${month}-01` : '2026-05-01';
}

function htmlDecode(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'");
}

function buildSchema(content, slug) {
  const rawTitle = extract(content, /<title>([^<]+)<\/title>/i);
  const headline = rawTitle
    ? htmlDecode(rawTitle.replace(/\s*\|\s*myteamkickoff\.com\s*$/, '').trim())
    : slug;

  const description = htmlDecode(
    extract(content, /<meta\s+name="description"\s+content="([^"]+)"/i) ||
    extract(content, /<meta\s+content="([^"]+)"\s+name="description"/i) ||
    ''
  );

  const image =
    extract(content, /<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
    `https://myteamkickoff.com/articles/${slug}/og.png`;

  const url =
    extract(content, /<link\s+rel="canonical"\s+href="([^"]+)"/i) ||
    `https://myteamkickoff.com/articles/${slug}/`;

  // Author: span containing ✍️ in the hero-meta block
  const authorRaw = extract(content, /✍️\s*([^<\n✍📅⏱]+?)\s*<\/span>/u);
  const author = authorRaw ? authorRaw.trim() : 'myteamkickoff.com';

  // Date: span containing 📅 in the hero-meta block
  const dateRaw = extract(content, /📅\s*([^<\n✍📅⏱]+?)\s*<\/span>/u);
  const datePublished = parseDate(dateRaw ? dateRaw.trim() : null);

  const schema = {
    '@context':    'https://schema.org',
    '@type':       'Article',
    headline,
    description,
    image,
    author:        { '@type': 'Person', name: author },
    datePublished,
    publisher:     { '@type': 'Organization', name: 'myteamkickoff.com', url: 'https://myteamkickoff.com' },
    url,
  };

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

function main() {
  const files = articleHtmlFiles();
  let injected = 0, skipped = 0;

  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('application/ld+json')) {
      skipped++;
      continue;
    }

    if (!content.includes('</head>')) {
      console.warn(`[inject-schema] WARN: no </head> in ${path.relative(SITE_DIR, filePath)}, skipping`);
      skipped++;
      continue;
    }

    const slug        = path.basename(path.dirname(filePath));
    const schemaBlock = buildSchema(content, slug);

    content = content.replace('</head>', `${schemaBlock}\n</head>`);
    fs.writeFileSync(filePath, content, 'utf8');
    injected++;
    console.log(`[inject-schema] Injected: ${path.relative(SITE_DIR, filePath)}`);
  }

  console.log(`[inject-schema] Done — ${injected} injected, ${skipped} unchanged.`);
}

main();
