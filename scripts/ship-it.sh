#!/usr/bin/env bash
# Run this ONCE to prepare the repo for Vercel.
# Usage:  bash scripts/ship-it.sh
# After it finishes, follow DEPLOY.md from step 1 (Cloudflare).

set -e

cd "$(dirname "$0")/.."

echo ""
echo "══════════════════════════════════════════════════════════"
echo " TRAN — ship to Vercel prep"
echo "══════════════════════════════════════════════════════════"
echo ""

# ── 1. Prisma client + schema push ───────────────────────
echo "→ Regenerating Prisma client..."
npx prisma generate

echo ""
echo "→ Pushing schema to MongoDB Atlas..."
echo "   (Reads DATABASE_URL from .env / .env.local)"
npx prisma db push

# ── 2. Secrets ───────────────────────────────────────────
NEXTAUTH_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)

echo ""
echo "══════════════════════════════════════════════════════════"
echo " Your Vercel environment variables"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "CRON_SECRET=$CRON_SECRET"
echo ""
echo "Paste these two into Vercel → Settings → Environment Variables"
echo "along with DATABASE_URL, SMTP_*, NEXTAUTH_URL, PUBLIC_APP_URL."
echo ""

# Also save them locally so you don't lose them.
echo "# Generated $(date)" > .vercel-secrets.local
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .vercel-secrets.local
echo "CRON_SECRET=$CRON_SECRET" >> .vercel-secrets.local
echo "→ Saved to .vercel-secrets.local (gitignored)"

# ── 3. Git commit + push ─────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo " Git"
echo "══════════════════════════════════════════════════════════"
echo ""

if ! git remote | grep -q .; then
  echo "⚠  No git remote configured."
  echo ""
  echo "Create a private repo on GitHub (name it anything, e.g. 'tran-platform'),"
  echo "then copy the 'push existing repository' commands GitHub shows you."
  echo ""
  echo "Or, if you have gh CLI authenticated:"
  echo "   gh repo create tran-platform --private --source=. --push"
  echo ""
  exit 0
fi

git add -A
git commit -m "Reports, grading flow, scholarship, cron, deploy config" || {
  echo "(nothing to commit — already clean)"
}
git push

echo ""
echo "══════════════════════════════════════════════════════════"
echo " Done. Now open DEPLOY.md and follow from step 1."
echo "══════════════════════════════════════════════════════════"
