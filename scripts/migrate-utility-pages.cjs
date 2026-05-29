#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const BASE_CSS_LINK = '<link rel="stylesheet" href="/assets/base.3ea7f29e.css">';
const FONTS_PRECONNECT = '<link rel="preconnect" href="https://fonts.googleapis.com">';
const FONTS_LINK = "<link href=\"https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600&family=Instrument+Mono&display=swap\" rel=\"stylesheet\">";

// Shared CSS selectors/blocks to strip from all pages
// These are now covered by base.css
const SHARED_MULTILINE_STARTS = [
  ':root {',
  ':root{',
  '* { margin:0',
  '* {',
  'body {',
  'body{',
  'body::after {',
  'body::after{',
  '/* ── TOP NAV ── */',
  '/* ── NAV ── */',
  '/* NAV */',
  '/* NAV*/\n',
  '.topnav {',
  '.topnav{',
  '.nav-logo {',
  '.nav-logo{',
  '.nav-logo span {',
  '.nav-logo span{',
  '.nav-home {',
  '.nav-home{',
  '.nav-home:hover {',
  '.nav-home:hover{',
  '.nav-active {',
  '.nav-active{',
  '.nav-menu-btn {',
  '.nav-menu-btn{',
  '.nav-links-wrap {',
  '.nav-links-wrap{',
  '.nav-close-btn {',
  '.nav-close-btn{',
  '@media(max-width:768px){',
  '/* FOOTER */',
  '/* ── FOOTER ── */',
  'footer {',
  'footer{',
  'footer a {',
  'footer a{',
  'footer strong {',
  'footer strong{',
  'img.emoji {',
  'img.emoji{',
  '/* ── TWEMOJI ── */',
  '/* TWEMOJI */',
];

// Strip a multi-line CSS block starting at a given index
// Returns the index after the closing } (or end of block)
function stripBlock(text, start) {
  // Find the first { from start
  let braceCount = 0;
  let inBlock = false;
  let i = start;

  // Skip to end of line for comment-type strips
  const line = text.indexOf('\n', start);
  if (line === -1) return text.length;

  // Find the block structure
  for (let j = start; j < text.length; j++) {
    if (text[j] === '{') {
      braceCount++;
      inBlock = true;
    } else if (text[j] === '}') {
      braceCount--;
      if (inBlock && braceCount === 0) {
        // Skip past any trailing whitespace/newline
        let end = j + 1;
        while (end < text.length && (text[end] === '\n' || text[end] === '\r')) {
          end++;
        }
        return end;
      }
    }
  }
  return line + 1;
}

function extractUniqueCSS(styleContent) {
  let text = styleContent;
  const lines = text.split('\n');
  const result = [];

  let i = 0;
  let inSharedBlock = false;
  let sharedBraceDepth = 0;
  let inNavMedia = false;
  let navMediaBraceDepth = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines at start
    if (!result.length && !trimmed) { i++; continue; }

    // Detect nav @media block
    if (trimmed === '@media(max-width:768px){' || trimmed === '@media (max-width: 768px) {' || trimmed === '@media(max-width:768px) {') {
      inNavMedia = true;
      navMediaBraceDepth = 1;
      i++;
      continue;
    }

    if (inNavMedia) {
      for (const ch of trimmed) {
        if (ch === '{') navMediaBraceDepth++;
        else if (ch === '}') navMediaBraceDepth--;
      }
      if (navMediaBraceDepth <= 0) inNavMedia = false;
      i++;
      continue;
    }

    // Check if this line starts a shared block
    let isShared = false;

    // Single-line checks
    if (/^:root\s*\{/.test(trimmed)) isShared = true;
    else if (/^\*\s*\{/.test(trimmed) && trimmed.includes('margin')) isShared = true;
    else if (/^body\s*\{/.test(trimmed)) isShared = true;
    else if (/^body::after\s*\{/.test(trimmed) || /^body::after\{/.test(trimmed)) isShared = true;
    else if (/^\.topnav\s*\{/.test(trimmed)) isShared = true;
    else if (/^\.nav-logo\s*\{/.test(trimmed)) isShared = true;
    else if (/^\.nav-logo span\s*\{/.test(trimmed) || /^\.nav-logo span\{/.test(trimmed)) isShared = true;
    else if (/^\.nav-home\s*\{/.test(trimmed) && !trimmed.includes(':hover')) isShared = true;
    else if (/^\.nav-home:hover\s*\{/.test(trimmed)) isShared = true;
    else if (/^\.nav-active\s*\{/.test(trimmed)) isShared = true;
    else if (/^\.nav-menu-btn\s*\{/.test(trimmed)) isShared = true;
    else if (/^\.nav-links-wrap\s*\{/.test(trimmed)) isShared = true;
    else if (/^\.nav-close-btn\s*\{/.test(trimmed)) isShared = true;
    else if (/^footer\s*\{/.test(trimmed)) isShared = true;
    else if (/^footer a\s*\{/.test(trimmed)) isShared = true;
    else if (/^footer strong\s*\{/.test(trimmed)) isShared = true;
    else if (/^img\.emoji\s*\{/.test(trimmed)) isShared = true;
    // Comments for nav/footer sections
    else if (/^\/\*.*(?:NAV|FOOTER|TWEMOJI).*\*\/$/.test(trimmed)) isShared = true;
    else if (/^\/\*.*(?:TOP NAV).*\*\/$/.test(trimmed)) isShared = true;

    if (isShared) {
      // Skip this block - collect all lines until the block is balanced
      // Count braces in the current line first
      let depth = 0;
      for (const ch of trimmed) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }

      i++;

      // If block didn't close on same line, consume until balanced
      while (i < lines.length && depth > 0) {
        const l = lines[i].trim();
        for (const ch of l) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        i++;
      }

      // Skip the blank line after
      if (i < lines.length && !lines[i].trim()) i++;
      continue;
    }

    result.push(line);
    i++;
  }

  // Remove trailing empty lines
  while (result.length && !result[result.length - 1].trim()) result.pop();

  return result.join('\n');
}

function migratePage(filePath, hasFontsLink) {
  let html = fs.readFileSync(filePath, 'utf8');

  const styleOpen = html.indexOf('<style>');
  const styleClose = html.indexOf('</style>') + '</style>'.length;

  if (styleOpen === -1) {
    console.log(`SKIP: ${filePath} - no <style> block`);
    return;
  }

  const styleContent = html.slice(styleOpen + '<style>'.length, html.indexOf('</style>'));
  const uniqueCSS = extractUniqueCSS(styleContent);

  // Find where to insert the base.css link
  // It should go right before the <style> block (or before fonts link if present)
  let insertPoint = styleOpen;
  const fontsPreconnect = html.lastIndexOf(FONTS_PRECONNECT, styleOpen);
  if (fontsPreconnect !== -1 && fontsPreconnect > styleOpen - 200) {
    insertPoint = fontsPreconnect;
  }

  const before = html.slice(0, insertPoint);
  const after = html.slice(styleClose);

  let replacement;
  if (hasFontsLink) {
    replacement = `${FONTS_PRECONNECT}
${FONTS_LINK}
${BASE_CSS_LINK}`;
  } else {
    replacement = BASE_CSS_LINK;
  }

  if (uniqueCSS.trim().length > 0) {
    replacement += `
<style>
${uniqueCSS}
</style>`;
  }

  const newHtml = before + replacement + after;
  fs.writeFileSync(filePath, newHtml);

  const uniqueLineCount = uniqueCSS.trim().length > 0 ? uniqueCSS.split('\n').length : 0;
  console.log(`${path.relative(process.cwd(), filePath)}: migrated (${uniqueLineCount} unique CSS lines)`);
}

const SITE = path.join(__dirname, '../site');

migratePage(path.join(SITE, 'about/index.html'), true);
migratePage(path.join(SITE, 'watch/index.html'), true);
migratePage(path.join(SITE, 'contact/index.html'), true);
migratePage(path.join(SITE, 'privacy/index.html'), true);
migratePage(path.join(SITE, 'terms/index.html'), true);

console.log('\nDone! All utility pages migrated.');
