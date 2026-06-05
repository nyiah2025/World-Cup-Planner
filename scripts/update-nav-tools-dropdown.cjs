#!/usr/bin/env node
// Bulk-update all site HTML files:
// 1. Replace plain Wallchart nav link with a Tools dropdown (Wallchart + Sweepstake Kit)
// 2. Replace nav JS with updated version that handles dropdown toggling

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

// ── New dropdown HTML (replaces the wallchart <a> tag) ──────────────────────
const OLD_NAV_LINK = '<a href="/wallchart/" class="nav-home">🗓️ Wallchart</a>';
const NEW_NAV_DROP = `<div class="nav-drop-wrap" id="navDropWrap">
    <button class="nav-home nav-drop-btn" id="navDropBtn" aria-haspopup="true" aria-expanded="false">🛠️ Tools ▾</button>
    <div class="nav-drop-menu" id="navDropMenu" role="menu">
      <a href="/wallchart/" class="nav-drop-item" role="menuitem">🗓️ Wallchart</a>
      <a href="/sweepstake-kit/" class="nav-drop-item" role="menuitem">🎲 Sweepstake Kit</a>
    </div>
  </div>`;

// ── Nav JS replacements ─────────────────────────────────────────────────────
// Single-quote variant (index.html, articles/index.html, etc.)
const OLD_JS_SQ = `(function(){var b=document.getElementById('navMenuBtn'),w=document.getElementById('navLinksWrap'),c=document.getElementById('navCloseBtn');if(!b||!w)return;b.addEventListener('click',function(){w.classList.add('open');});if(c)c.addEventListener('click',function(){w.classList.remove('open');});w.addEventListener('click',function(e){if(e.target.tagName==='A')w.classList.remove('open');});})();`;

// Double-quote variant (team pages, schedule, watch, etc.)
const OLD_JS_DQ = `(function(){var b=document.getElementById("navMenuBtn"),w=document.getElementById("navLinksWrap"),c=document.getElementById("navCloseBtn");if(!b||!w)return;b.addEventListener("click",function(){w.classList.add("open")});if(c)c.addEventListener("click",function(){w.classList.remove("open")});w.addEventListener("click",function(e){if(e.target.tagName==="A")w.classList.remove("open")})})();`;

const NEW_JS = `(function(){var b=document.getElementById('navMenuBtn'),w=document.getElementById('navLinksWrap'),c=document.getElementById('navCloseBtn');if(!b||!w)return;b.addEventListener('click',function(){w.classList.add('open');});if(c)c.addEventListener('click',function(){w.classList.remove('open');});w.addEventListener('click',function(e){if(e.target.tagName==='A')w.classList.remove('open');});var db=document.getElementById('navDropBtn'),dm=document.getElementById('navDropMenu');if(db&&dm){db.addEventListener('click',function(e){e.stopPropagation();var o=dm.classList.toggle('open');db.setAttribute('aria-expanded',String(o));});document.addEventListener('click',function(){dm.classList.remove('open');db.setAttribute('aria-expanded','false');});}})();`;

function main() {
  const files = findHtml(SITE_DIR);

  let navUpdated = 0;
  let jsUpdated = 0;
  let skipped = 0;

  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace nav link with dropdown
    if (html.includes(OLD_NAV_LINK)) {
      html = html.replace(OLD_NAV_LINK, NEW_NAV_DROP);
      navUpdated++;
      changed = true;
    }

    // Replace nav JS (try both quote styles)
    if (html.includes(OLD_JS_SQ)) {
      html = html.replace(OLD_JS_SQ, NEW_JS);
      jsUpdated++;
      changed = true;
    } else if (html.includes(OLD_JS_DQ)) {
      html = html.replace(OLD_JS_DQ, NEW_JS);
      jsUpdated++;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, html, 'utf8');
    } else {
      skipped++;
    }
  }

  console.log(`[nav-tools-dropdown] Nav link updated: ${navUpdated} files`);
  console.log(`[nav-tools-dropdown] Nav JS updated:   ${jsUpdated} files`);
  console.log(`[nav-tools-dropdown] Unchanged:        ${skipped} files`);
}

main();
