#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
node scripts/fingerprint.cjs
node scripts/inject-article-share.cjs
