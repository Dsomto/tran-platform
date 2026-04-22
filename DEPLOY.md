# Deploy to Vercel — Step-by-step

## 0. One-time local prep

```bash
cd netforge

# Regenerate the Prisma client so the new models (StageReport, EmailQueueItem, etc.) are typed
npx prisma generate

# Push the new schema to your MongoDB Atlas database
npx prisma db push

# Generate two random secrets — save these, you'll paste them into Vercel in step 2
openssl rand -hex 32   # → NEXTAUTH_SECRET
openssl rand -hex 32   # → CRON_SECRET
```

Then commit and push to GitHub:

```bash
git add -A
git commit -m "Add stage reports, grading flow, scholarship, cron, rate limits"
git push
```

---

## 1. Cloudflare (free, ~10 min)

Gives you free DDoS protection and easier DNS management than IONOS's interface.

1. Sign up at **cloudflare.com** (free plan).
2. **Add a site** → enter your domain → Free plan.
3. Cloudflare gives you **two nameservers** (e.g. `amy.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
4. Log into **IONOS** → Domains → your domain → **Nameservers** → switch to custom → paste Cloudflare's two nameservers → Save.
5. Wait up to 24 hours. Cloudflare emails you when active.

---

## 2. Vercel (~15 min)

1. Sign up at **vercel.com** with your GitHub.
2. **Add New Project** → import the `netforge` repo.
3. Under **Environment Variables**, add:

```
DATABASE_URL       = (your Atlas connection string)
NEXTAUTH_SECRET    = (paste the first secret you generated)
NEXTAUTH_URL       = https://therootaccessnetwork.com
PUBLIC_APP_URL     = https://therootaccessnetwork.com
SMTP_HOST          = smtp.zoho.com
SMTP_PORT          = 587
SMTP_USER          = (your Zoho email)
SMTP_PASS          = (your Zoho app password)
CRON_SECRET        = (paste the second secret you generated)
```

4. Click **Deploy**. Wait ~3 minutes. You'll get a temporary URL like `netforge-xyz.vercel.app` — confirm it loads before continuing.

---

## 3. Connect your domain (~5 min)

1. In Vercel → Project → **Settings → Domains**.
2. Add `therootaccessnetwork.com` → Vercel shows you a CNAME/A record to add.
3. Add `www.therootaccessnetwork.com` too (redirect to apex).
4. Go back to **Cloudflare → DNS → Records** and add the records Vercel requested. Each should be:
   - Type: **CNAME**
   - Target: `cname.vercel-dns.com`
   - Proxy status: **DNS only** (grey cloud — Vercel handles SSL directly)
5. Back in Vercel, click **Refresh** next to each domain. They should go green within a minute or two.

**Note on stage URLs:** stages are reached at path tokens (e.g. `therootaccessnetwork.com/k7m2xq9bt4`) rather than subdomains. No wildcard needed — works on Vercel Hobby. Tokens live in `src/lib/stage-routes.ts` — rotate there if one leaks.

---

## 4. Verify

1. Visit `https://therootaccessnetwork.com` → landing page loads.
2. Visit `https://stage-1.therootaccessnetwork.com` → Stage 1 login page loads.
3. Test the cron manually:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://therootaccessnetwork.com/api/cron/email-drain
```

Should return `{"sent":0,"drained":0,"remaining":0}` if the email queue is empty.

4. Vercel's daily cron will hit `/api/cron/email-drain?limit=300` at 09:00 UTC automatically — nothing else to wire up. Check **Vercel → Project → Crons** after 24 hours to confirm it ran.

---

## 5. Create the admin user (one-time)

SSH is not needed. Run the seed from your laptop against the production database:

```bash
DATABASE_URL="your-prod-atlas-url" npx tsx prisma/seed.ts
```

Or log in with the admin credentials you already seeded (`admin@tran.io` / `admin123456` if using the existing seed).

---

## Future subdomain additions

If you launch Stage 5 later, just add `stage-5.therootaccessnetwork.com` in Vercel Domains + the matching CNAME in Cloudflare. Takes 2 minutes.

---

## If something breaks

- **500 error on load**: check Vercel → Deployments → latest → **Runtime Logs**. Most likely missing env var or database connection.
- **Domain stuck "Invalid Configuration"**: wait — Cloudflare DNS propagation can take an hour. If still stuck after 2 hours, confirm the CNAME in Cloudflare has grey cloud (DNS only), not orange (proxy).
- **Emails not sending**: test the Zoho creds with the cron endpoint curl above. If it fails, the credentials are wrong or Zoho is blocking.
