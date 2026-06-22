#!/usr/bin/env node
/**
 * generate-sitemap.cjs
 * Scans the site/ folder and writes a fresh sitemap.xml.
 *
 * Page-type rules:
 *   /                         priority 1.0  daily
 *   /schedule                 priority 0.9  daily
 *   /watch                    priority 0.8  daily
 *   /articles                 priority 0.8  daily
 *   /articles/<slug>          priority 0.7  weekly
 *   /<team-slug>              priority 0.9  daily
 *
 * Run:  node scripts/generate-sitemap.cjs
 *        – or –  pnpm sitemap
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const BASE_URL = 'https://myteamkickoff.com';
const SITE_DIR = path.join(__dirname, '..', 'site');
const OUT_FILE = path.join(SITE_DIR, 'sitemap.xml');

// ── Today's date ──────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);

// ── Known team slugs ──────────────────────────────────────────────────────────
const TEAM_SLUGS = new Set([
  'algeria','argentina','australia','austria','belgium','bosnia','brazil',
  'canada','cape-verde','colombia','cote-divoire','croatia','curacao',
  'czechia','dr-congo','ecuador','egypt','england','france','germany',
  'ghana','haiti','iran','iraq','japan','jordan','mexico','morocco',
  'netherlands','new-zealand','nigeria','norway','panama','paraguay','peru',
  'portugal','qatar','saudi-arabia','scotland','senegal','serbia',
  'south-africa','south-korea','spain','sweden','switzerland','tunisia',
  'turkiye','ukraine','uruguay','usa','uzbekistan',
  // additional team slugs go here as new pages are added
]);

// ── Folders that are NOT pages (skip them) ────────────────────────────────────
const SKIP_DIRS = new Set(['privacy']);

// ── Known top-level utility pages (add new ones here as they are created) ─────
const UTILITY_PAGES = [
  { slug: 'schedule', priority: '0.9', changefreq: 'daily'  },
  { slug: 'watch',    priority: '0.8', changefreq: 'daily'  },
  { slug: 'articles', priority: '0.8', changefreq: 'daily'  },
  { slug: 'knockout', priority: '0.9', changefreq: 'daily'  },
  { slug: 'groups',   priority: '0.9', changefreq: 'daily'  },
  { slug: 'contact',  priority: '0.5', changefreq: 'monthly'},
];

// ── Build URL entries ──────────────────────────────────────────────────────────
const entries = [];

function addEntry(loc, priority, changefreq) {
  entries.push({ loc, priority, changefreq, lastmod: today });
}

// 1. Homepage
addEntry(`${BASE_URL}/`, '1.0', 'daily');

// 2. Utility pages that exist on disk
for (const page of UTILITY_PAGES) {
  const dir = path.join(SITE_DIR, page.slug);
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory() &&
      fs.existsSync(path.join(dir, 'index.html'))) {
    addEntry(`${BASE_URL}/${page.slug}/`, page.priority, page.changefreq);

    // 3. Article sub-pages (site/articles/<slug>/index.html)
    if (page.slug === 'articles') {
      const subdirs = fs.readdirSync(dir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort();
      for (const sub of subdirs) {
        if (fs.existsSync(path.join(dir, sub, 'index.html'))) {
          addEntry(`${BASE_URL}/articles/${sub}/`, '0.7', 'weekly');
        }
      }
    }
  }
}

// 4. Team pages — scan site/ for any folder containing index.html
const siteDirs = fs.readdirSync(SITE_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && !SKIP_DIRS.has(d.name))
  .map(d => d.name)
  .sort();

const utilitySlugs = new Set(UTILITY_PAGES.map(p => p.slug));

for (const dir of siteDirs) {
  if (utilitySlugs.has(dir)) continue;
  if (!fs.existsSync(path.join(SITE_DIR, dir, 'index.html'))) continue;

  if (TEAM_SLUGS.has(dir)) {
    addEntry(`${BASE_URL}/${dir}/`, '0.9', 'daily');
  } else {
    // Unknown folder with an index.html — include at medium priority so
    // new page types don't get silently omitted.
    console.warn(`[sitemap] Unknown folder "${dir}" included at priority 0.7. Add it to UTILITY_PAGES or TEAM_SLUGS for a more specific priority.`);
    addEntry(`${BASE_URL}/${dir}/`, '0.7', 'weekly');
  }
}

// ── Render XML ────────────────────────────────────────────────────────────────
function xmlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(xmlEntry),
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(OUT_FILE, xml, 'utf8');
console.log(`[sitemap] Written ${entries.length} URLs to site/sitemap.xml (${today})`);
