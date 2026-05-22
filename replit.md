# myteamkickoff.com

A 2026 FIFA World Cup match timezone converter — pure static HTML/CSS/JS site with 48 team pages and a homepage, all served locally for editing.

## Run & Operate

- `node server.js` — start the local preview server (port 3000)
- The "Start application" workflow runs this automatically

## Stack

- Pure static HTML/CSS/JavaScript — no framework, no build step
- Client-side timezone conversion using the browser's Intl API
- Deployed on Cloudflare Pages via GitHub (push to deploy)

## Where things live

- `site/` — all site files (edit these, then push to GitHub)
  - `site/index.html` — homepage (placeholder — upload real file)
  - `site/<team>/index.html` — one page per qualified team (48 teams)
  - `site/sitemap.xml` — 49 URLs
  - `site/robots.txt` — points to sitemap
  - `site/_redirects` — Cloudflare Pages clean URL rules
- `server.js` — minimal Node.js static file server for local preview

## Architecture decisions

- Static-first: no backend, no database, no build step — all changes are direct file edits
- Clean URLs handled by `_redirects` on Cloudflare and by `server.js` locally (falls back to `<path>/index.html`)
- The homepage `index.html` was not in the uploaded zip — a placeholder is at `site/index.html` until the real file is added

## Product

A match timezone converter for the 2026 FIFA World Cup. Users pick their team and see all fixture kick-off times converted to their local timezone. One page per qualified team (48 teams), each with its own SEO title, meta description, and match list.

## User preferences

- Do not restructure or rewrite any site files unless explicitly asked
- Make only targeted edits: match data updates, Twemoji flag support, AdSense snippets, bug fixes
- Site deploys via GitHub push to Cloudflare Pages — Replit is the editing workspace only

## Gotchas

- After editing files in `site/`, restart the "Start application" workflow to see changes in preview
- The homepage (`site/index.html`) is a placeholder — the real file needs to be uploaded
- `_redirects` is for Cloudflare Pages only; the local server handles clean URLs via `server.js`
- Team pages use self-contained embedded styles and scripts — no shared CSS/JS files

## Pointers

- See `site/_redirects` for the full list of clean URL rules
- See `site/sitemap.xml` for all 49 URLs
