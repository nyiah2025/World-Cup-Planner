#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const BASE_CSS_LINK = '<link rel="stylesheet" href="/assets/base.3ea7f29e.css">';
const ARTICLE_CSS_LINK = '<link rel="stylesheet" href="/assets/article-page.afaedc0a.css">';

const ARTICLE_DIR = path.join(__dirname, '../site/articles');

// Regex to match the full <style>...</style> block inside <head>
const STYLE_BLOCK_RE = /<style>[\s\S]*?<\/style>\s*\n/;

// CSS lines/patterns that are now in base.css or article-page.css
// We strip these from inline styles and keep only what's truly unique
const SHARED_PATTERNS = [
  // tokens
  /^:root\{/,
  /^\*\{margin:0;padding:0/,
  /^body\{background:var\(--bg\)/,
  /^body::after\{content:'';/,
  // nav
  /^\.topnav\{/,
  /^\.nav-logo\{/,
  /^\.nav-logo span\{/,
  /^\.nav-home\{/,
  /^\.nav-home:hover\{/,
  /^\.nav-active\{/,
  /^\.nav-menu-btn\{/,
  /^\.nav-links-wrap\{/,
  /^\.nav-close-btn\{/,
  /^@media\(max-width:768px\)\{/,
  /^  \.nav-menu-btn\{/,
  /^  \.nav-links-wrap\{/,
  /^  \.nav-links-wrap\.open\{/,
  /^  \.nav-links-wrap\.open \.nav-close-btn\{/,
  /^  \.nav-links-wrap \.nav-home\{/,
  /^  \.nav-links-wrap\.open \.nav-home\{/,
  // hero
  /^\.hero\{background:var\(--ink\)/,
  /^\.hero::before\{/,
  /^\.hero-inner\{max-width:760px/,
  /^\.breadcrumb\{/,
  /^\.breadcrumb a\{/,
  /^\.breadcrumb a:hover\{/,
  /^\.hero-eyebrow\{/,
  /^\.hero h1\{/,
  /^\.hero-meta\{/,
  /^\.article-wrap\{/,
  // toc
  /^\.toc\{/,
  /^\.toc-title\{/,
  /^\.toc ol\{/,
  /^\.toc ol li\{/,
  /^\.toc ol li:last-child\{/,
  /^\.toc ol li::before\{/,
  /^\.toc ol li a\{/,
  /^\.toc ol li a:hover\{/,
  // article-section
  /^\.article-section\{/,
  /^\.article-section:last-of-type\{/,
  /^\.article-section h2\{/,
  /^\.article-section h3\{/,
  /^\.article-section p\{/,
  /^\.article-section p:last-child\{/,
  /^\.article-section p strong\{/,
  /^\.article-section a\{/,
  /^\.article-section a:hover\{/,
  // callout
  /^\.callout\{/,
  /^\.callout-gold\{/,
  /^\.callout-grass\{/,
  /^\.callout-ink\{/,
  /^\.callout strong\{/,
  /^\.callout-ink strong\{/,
  // data-table
  /^\.data-table\{/,
  /^\.data-table thead tr\{/,
  /^\.data-table th\{/,
  /^\.data-table td\{/,
  /^\.data-table tbody tr:last-child td\{/,
  /^\.data-table tbody tr:hover\{/,
  /^\.data-table td strong\{/,
  // bc-row/bc-card
  /^\.bc-row\{/,
  /^\.bc-card\{/,
  /^\.bc-top\{/,
  /^\.bc-top\.free\{/,
  /^\.bc-top\.paid\{/,
  /^\.bc-body\{/,
  /^\.bc-type\{/,
  /^\.bc-type\.free\{/,
  /^\.bc-type\.paid\{/,
  /^\.bc-name\{/,
  /^\.bc-platform\{/,
  /^\.bc-detail\{/,
  /^\.bc-cta\{/,
  /^\.bc-cta:hover\{/,
  /^\.bc-cta\.free-cta\{/,
  /^\.bc-cta\.free-cta:hover\{/,
  /^\.bc-cta\.paid-cta\{/,
  /^\.bc-cta\.paid-cta:hover\{/,
  // stat-row/stat-chip
  /^\.stat-row\{/,
  /^\.stat-chip\{/,
  /^\.stat-chip \.sv\{/,
  /^\.stat-chip \.sl\{/,
  // pull-quote
  /^\.pull-quote\{/,
  /^\.pull-quote p\{/,
  // stage-flow
  /^\.stage-flow\{/,
  /^\.sf-item\{/,
  /^\.sf-item:last-child\{/,
  /^\.sf-num\{/,
  /^\.sf-label\{/,
  /^\.sf-sub\{/,
  // related-grid / related-card
  /^\.related-grid\{/,
  /^\.related-card\{/,
  /^\.related-card:hover\{/,
  /^\.rc-cat\{/,
  /^\.rc-img\{/,
  /^\.rc-img-placeholder\{/,
  /^\.rc-body\{/,
  /^\.rc-title\{/,
  /^\.rc-desc\{/,
  // article-cta
  /^\.article-cta\{/,
  /^\.article-cta:hover\{/,
  /^\.article-cta-text \.ac-label\{/,
  /^\.article-cta-text \.ac-title\{/,
  /^\.article-cta-arrow\{/,
  // footer
  /^footer\{/,
  /^footer a\{/,
  /^footer strong\{/,
  // emoji
  /^img\.emoji\{/,
  // closing brace for nav media query
  /^\}$/,
];

function isSharedLine(line) {
  const trimmed = line.trim();
  if (trimmed === '') return true;
  return SHARED_PATTERNS.some(p => p.test(trimmed));
}

function extractUniqueCSS(styleContent) {
  // Split by lines
  const lines = styleContent.split('\n');
  const unique = [];

  // Track if we're in the nav @media block or other shared blocks
  let inSharedMedia = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip the nav @media(max-width:768px) block
    if (trimmed === '@media(max-width:768px){') {
      inSharedMedia = true;
      continue;
    }
    if (inSharedMedia) {
      if (trimmed === '}') {
        inSharedMedia = false;
      }
      continue;
    }

    // Skip shared patterns
    if (isSharedLine(line)) continue;

    // Skip the main @media(max-width:600px) block if it only has shared article CSS
    // We detect this as the LAST @media block in the file
    if (trimmed.startsWith('@media(max-width:600px){') && i === lines.length - 2) {
      continue;
    }

    unique.push(line);
  }

  // Remove leading/trailing empty lines
  while (unique.length && unique[0].trim() === '') unique.shift();
  while (unique.length && unique[unique.length - 1].trim() === '') unique.pop();

  return unique.join('\n');
}

// Handle articles/index.html (listing page) separately
function migrateListingPage() {
  const filePath = path.join(ARTICLE_DIR, 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');

  // The listing page uses base.css only (no article-page.css)
  // Replace from <link rel="preconnect"> through </style>
  const fontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600&family=Instrument+Mono&display=swap" rel="stylesheet">';

  // Find the style block content
  const styleStart = html.indexOf('<style>');
  const styleEnd = html.indexOf('</style>') + '</style>'.length;

  if (styleStart === -1 || styleEnd === -1) {
    console.log(`articles/index.html: no <style> block found`);
    return;
  }

  const styleContent = html.slice(styleStart + '<style>'.length, html.indexOf('</style>'));

  // Extract listing-specific CSS - remove shared tokens/body/nav/hero/footer/emoji
  const lines = styleContent.split('\n');
  const uniqueLines = [];
  let inSharedMedia768 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '@media(max-width:768px){') { inSharedMedia768 = true; continue; }
    if (inSharedMedia768) {
      if (trimmed === '}') { inSharedMedia768 = false; }
      continue;
    }

    // Skip shared CSS
    if (/^:root\{/.test(trimmed)) continue;
    if (/^\*\{margin:0/.test(trimmed)) continue;
    if (/^body\{background/.test(trimmed)) continue;
    if (/^body::after\{/.test(trimmed)) continue;
    if (/^\.topnav\{/.test(trimmed)) continue;
    if (/^\.nav-logo/.test(trimmed)) continue;
    if (/^\.nav-home/.test(trimmed)) continue;
    if (/^\.nav-active/.test(trimmed)) continue;
    if (/^\.nav-menu-btn/.test(trimmed)) continue;
    if (/^\.nav-links-wrap/.test(trimmed)) continue;
    if (/^\.nav-close-btn/.test(trimmed)) continue;
    if (/^footer\{/.test(trimmed)) continue;
    if (/^footer a\{/.test(trimmed)) continue;
    if (/^footer strong\{/.test(trimmed)) continue;
    if (/^img\.emoji\{/.test(trimmed)) continue;

    uniqueLines.push(line);
  }

  while (uniqueLines.length && uniqueLines[0].trim() === '') uniqueLines.shift();
  while (uniqueLines.length && uniqueLines[uniqueLines.length - 1].trim() === '') uniqueLines.pop();

  const uniqueCSS = uniqueLines.join('\n');

  const replacement = `${fontsLink}
<link rel="stylesheet" href="/assets/base.3ea7f29e.css">
<style>
${uniqueCSS}
</style>`;

  const before = html.slice(0, html.indexOf('<link rel="preconnect" href="https://fonts.googleapis.com">'));
  const after = html.slice(styleEnd);

  const newHtml = before + replacement + after;
  fs.writeFileSync(filePath, newHtml);
  console.log(`articles/index.html: migrated`);
}

// Migrate all article detail pages
function migrateArticle(articleSlug) {
  const filePath = path.join(ARTICLE_DIR, articleSlug, 'index.html');
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${articleSlug} not found`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Find the <style> block
  const styleStart = html.indexOf('<style>');
  const styleEnd = html.indexOf('</style>') + '</style>'.length;

  if (styleStart === -1) {
    console.log(`SKIP: ${articleSlug} already updated or no <style> block`);
    return;
  }

  const styleContent = html.slice(styleStart + '<style>'.length, html.indexOf('</style>'));
  const uniqueCSS = extractUniqueCSS(styleContent);

  const fontsLineStart = html.indexOf('<link rel="preconnect" href="https://fonts.googleapis.com">');

  let replacement;
  if (uniqueCSS.trim().length > 0) {
    replacement = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600&family=Instrument+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/base.3ea7f29e.css">
<link rel="stylesheet" href="/assets/article-page.afaedc0a.css">
<style>
${uniqueCSS}
</style>`;
  } else {
    replacement = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600&family=Instrument+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/base.3ea7f29e.css">
<link rel="stylesheet" href="/assets/article-page.afaedc0a.css">`;
  }

  const before = html.slice(0, fontsLineStart);
  const after = html.slice(styleEnd);

  const newHtml = before + replacement + after.replace(/^\n+/, '\n');
  fs.writeFileSync(filePath, newHtml);

  const uniqueLineCount = uniqueCSS.trim().length > 0 ? uniqueCSS.split('\n').length : 0;
  console.log(`${articleSlug}: migrated (${uniqueLineCount} unique CSS lines remaining)`);
}

const articles = fs.readdirSync(ARTICLE_DIR).filter(d => {
  const full = path.join(ARTICLE_DIR, d);
  return fs.statSync(full).isDirectory();
});

migrateListingPage();
for (const article of articles) {
  migrateArticle(article);
}

console.log('\nDone! All article pages migrated.');
