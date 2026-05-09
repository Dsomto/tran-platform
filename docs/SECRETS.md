# Secrets — what they are, where they live, how to rotate

Every secret used by this app, in one place. If a secret leaks (chat, screenshot, Git, log paste), rotate it from this list. **Never commit secrets to the repo. Never paste them in chat.**

## Inventory

| Env var | Purpose | Where it lives | Generate with |
|---|---|---|---|
| `DATABASE_URL` | MongoDB Atlas connection string for the prod cluster | Atlas → Database Access | Atlas: edit user → set password → copy URI |
| `NEXTAUTH_SECRET` | JWT signing key for session cookies | Vercel env | `openssl rand -hex 32` |
| `JWT_SECRET` | Same family — used for token signing | Vercel env | `openssl rand -hex 32` |
| `CRON_SECRET` | Bearer token gating `/api/cron/*` and `/api/debug/*` endpoints | Vercel env | `openssl rand -hex 32` |
| `FLAG_SIGNING_SECRET` | HMAC for letter URLs, certificate links, flag tokens | Vercel env | `openssl rand -hex 32` |
| `SMTP_PASS` | Resend API key (sent over SMTP as the password) | Vercel env | Resend dashboard → API Keys → Create |
| `SMTP_USER` | Literal string `resend` (Resend's SMTP username convention) | Vercel env | n/a — it's the constant `resend` |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.resend.com` / `587` | Vercel env | n/a — constants |
| `RESEND_WEBHOOK_SECRET` | Verifies webhook payloads from Resend | Resend dashboard → Webhooks | Resend generates on webhook create |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis-backed rate limiter | Upstash dashboard | Upstash creates on database create |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | Sentry dashboard → Project Settings | Sentry generates on project create |
| `PUBLIC_APP_URL` | Canonical public URL for absolute links in emails | Vercel env | constant: `https://ubuntubridgeinitiatives.org` |
| `SLACK_CHANNEL_URL` | Optional — Slack invite link surfaced in welcome email | Vercel env (optional) | Slack workspace → Invite people → Copy invite link |

## Rotation procedure (any secret)

1. **Generate the new value** at the provider (Atlas / Resend / Upstash / Sentry / `openssl`). Never reuse old values.
2. **Update Vercel** → Project → Settings → Environment Variables → find the var → Edit → paste new value → Save. Confirm the **Production** scope is ticked.
3. **Trigger a fresh deploy** so running lambdas pick up the new env. Vercel only re-evaluates env on a new build, NOT on env-var change alone. Use `Deployments → ⋯ → Redeploy → uncheck "Use existing build cache"` or push any commit.
4. **Revoke the old value** at the provider. Don't leave both valid — that's how leaks linger.
5. **Smoke-test** at least one feature that depends on the rotated secret (run `/api/debug/smtp-test` for SMTP, log in for auth, hit a cron endpoint with the new bearer for `CRON_SECRET`).

## When to rotate

- **Immediately** if any secret appears in: chat with anyone, a screenshot you shared, a screenshare recording, a public Git commit, a public log paste, a screenshare with screen-share-recording on (Slack, Loom, etc.), or anywhere you don't fully control.
- **On schedule** — every 90 days for `JWT_SECRET` / `NEXTAUTH_SECRET` / `CRON_SECRET` / `FLAG_SIGNING_SECRET`. These don't get exposed naturally but rotation limits damage if they ever do.
- **On personnel change** — if anyone with admin access leaves the team, rotate `DATABASE_URL`, `CRON_SECRET`, every API key, and every admin-account password.

## Safe handling

- Generate strong values: `openssl rand -hex 32` (= 256 bits, 64 hex chars). Anything weaker is a guess waiting to happen.
- Never email a secret to yourself or a teammate. Use 1Password / Bitwarden / Apple Keychain shared vaults.
- Never paste a secret into an LLM chat (yes, including this one). The transcript is logged.
- Never set a secret in `.env` and commit `.env`. Confirm `.env*` is in `.gitignore`.
- Avoid weak passwords for any account that gates production data — ESPECIALLY the database. `Password123!` is in every credential-stuffing dictionary on the planet.

## Secrets that have been exposed in the past (track this)

If a secret has appeared anywhere it shouldn't have, write the date and what was rotated. Empty list is a goal, not a fact.

| Date | Secret | How exposed | Rotated? |
|---|---|---|---|
| _Add entries here_ | | | |

## Quick reference: rotation commands

```bash
# Generate strong random secrets
openssl rand -hex 32       # for JWT_SECRET / CRON_SECRET / etc
openssl rand -base64 24    # alternative format

# Force a fresh Vercel deploy (no cache)
git commit --allow-empty -m "chore: redeploy to pick up new env" && git push origin main
```

## Provider-specific rotation

**Atlas (MongoDB)** — Database Access → user → Edit Password → Edit User Password (new strong password) → Update User. Update `DATABASE_URL` in Vercel env, redeploy.

**Resend (SMTP)** — API Keys → click old key → Revoke. Create API Key → copy. Paste into Vercel `SMTP_PASS` → save → redeploy.

**Upstash (Redis)** — Database → Details → Reset password (the REST token). Update `UPSTASH_REDIS_REST_TOKEN` in Vercel env, redeploy.

**Sentry** — Settings → Auth Tokens / Client Keys → revoke old → create new → update `SENTRY_DSN` env, redeploy.

## Known production caveats

These are noted here so anyone running the system knows they exist.

### `/api/upload` writes to local filesystem

`src/app/api/upload/route.ts` saves to `public/uploads`. On Vercel
serverless, that directory is **per-lambda ephemeral storage** — files
written there don't survive a cold start, don't replicate across
regions, and aren't shared between concurrent invocations.

**Where this matters today:** the `DiagramUpload` task widget in stage
rooms uses this endpoint. A diagram uploaded by one intern may not be
retrievable later. The report-submission flow does **not** use this —
reports are link-based (Google Drive URL) so they're unaffected.

**Fix path when you need durable uploads:** swap the local-disk write
for **Vercel Blob** (https://vercel.com/docs/vercel-blob, ~30 minutes
to wire) or **Cloudflare R2** / **AWS S3** (an hour, more setup).
Until then, treat any feature using `/api/upload` as best-effort.
