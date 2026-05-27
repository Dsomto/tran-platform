# Platform bug audit — 2026-05-27

Findings from a read-only sweep (two agents + spot-verification). Each item is tagged:

- **[VERIFIED]** — I read the code and confirmed it.
- **[REPORTED]** — surfaced by the sweep; **please re-verify before fixing** (agents can over-claim).

Severities: 🔴 critical · 🟠 high · 🟡 medium · ⚪ low.

---

## ✅ 1. Closed assignments are still viewable AND submittable  **[VERIFIED — FIXED 2026-05-27]**
Fixed: `isClosed: false` filter added to the rooms API, stage-board lib, all 5 stage task pages, and `/api/assignments` (now role-aware: admins still see closed, interns only see open tasks for their current stage + track); `isClosed` guard added to the answer endpoint (409). Original finding below.
`Assignment.isClosed` is only checked in `src/app/api/submissions/route.ts` (the writeup/upload POST). The room/terminal flow ignores it:
- `src/app/api/stage/[slug]/rooms/route.ts` — the `assignments` include has **no `isClosed` filter**, so closed tasks still render on the board.
- `src/app/api/stage/[slug]/tasks/[taskId]/answer/route.ts` — **no `isClosed` check**, so FLAG/MCQ answers to closed tasks are still accepted, auto-graded, and awarded points.
- `src/lib/stage-board.ts` (`getBoardData`) — same: fetches assignments without `isClosed`.
- The per-stage task detail pages `src/app/subdomains/stage-*/tasks/[order]/page.tsx` fetch by `roomId+order` with no `isClosed` check, so direct URLs still render closed tasks.

**Fix direction:** filter `isClosed: false` everywhere assignments are listed for interns, and add an `isClosed` guard to the answer endpoint (return 409). Decide: hide closed tasks entirely vs. show-but-locked.

## 🟠 2. Per-intern flag is derivable in the browser  **[VERIFIED — but likely by design]**
`flagSalt` + `internId` are passed into the client component `TaskPage`, and `src/components/widgets/flag-browser.ts:computeFlagBrowser()` computes the expected flag client-side (used by `WebTerminal`, `VulnAppSim`, `template.ts`). This is intentional for the client-side CTF simulations (the flag is planted in the simulated environment), **but** a determined intern can open devtools and derive their own flag without solving the task. **Decision needed:** is client-side flag derivation acceptable for your threat model? If not, flags must be validated server-side only and never shipped to the client.

## 🟠 3. Forgot-password email sent synchronously, fails silently  **[REPORTED]**
`src/app/api/auth/forgot-password/route.ts` (~40-57) sends via direct SMTP, not the EmailQueueItem queue; on failure it's logged and the endpoint still returns the generic success message. On a serverless cold-freeze or SMTP hiccup, the user never gets the reset link and has no way to know/retry. **Fix direction:** route password-reset through the queue (retry/dead-letter) like stage emails.

## 🟠 4. Other transactional emails bypass the queue  **[REPORTED]**
Synchronous, fire-and-forget sends that can silently drop mail (return success even if the send fails):
- `src/app/api/apply/route.ts` (~111-115) — application confirmation; returns 201 regardless.
- `src/app/api/public-applications/[id]/resend-welcome/route.ts` (~42-60).
- `src/lib/advance-stage.ts` — stage-door / advanced emails (direct sends).
**Fix direction:** move these onto EmailQueueItem so the cron drain retries them.

## 🟡 5. `send-credentials` double-send race  **[REPORTED]**
`src/app/api/admin/applicants/send-credentials/route.ts` (~61-72): rows are claimed (`credentialsEmailSentAt` stamped) *after* the pool is read, and the filter narrows *after* the claim — two concurrent runs could both enqueue the same recipients. **Fix direction:** claim atomically (conditional updateMany) before building the email rows.

## 🟡 6. `syncApplicantStages` is fire-and-forget  **[REPORTED]**
`src/app/api/public-applications/bulk-stage/route.ts` (~73) calls `syncApplicantStages()` without `await`, and `src/lib/applicant-stage.ts` (~162-164) swallows errors. If it throws, the route still returns success but stage-advance emails are never queued. **Fix direction:** await it, or enqueue work transactionally.

## 🟡 7. Missing rate limits on mutating endpoints  **[REPORTED]**
No rate limit on: `src/app/api/interns/[id]/points/route.ts` (arbitrary point award), `src/app/api/public-applications/[id]/stage/route.ts`, `src/app/api/public-applications/bulk-stage/route.ts`. **Fix direction:** add `rateLimit()` as other routes do.

## 🟡 8. Broadcast BCC partial-batch failure is silent  **[REPORTED]**
`src/lib/email.ts` (~971-1005): BCC sent in batches of 90; a failed batch is logged but the loop continues and there's no record of which batch failed / no retry. **Fix direction:** track per-batch status; surface failures to the admin.

## 🟡 9. SUPER_ADMIN can grade un-claimed reports  **[REPORTED — may be intentional]**
`src/app/api/admin/reports/[id]/grade/route.ts` (~49-57): super-admin bypasses the "must have claimed this report" rule and can submit/override grades. Confirm this is intended (tiebreak) vs. an over-broad bypass.

## 🟡 10. Elimination/lockout only keys off `PublicApplication.stageStatus`  **[REPORTED — may be intentional]**
`src/lib/auth.ts` (~248-259): a user with no `PublicApplication` (graders/admins created directly) can't be eliminated/locked out via stage status. Likely intended, but note it: directly-provisioned graders are outside that lockout path.

## ⚪ 11. Misc / low  **[REPORTED]**
- `src/app/api/admin/bulk-promote/route.ts` returns 404 (not 403) for non-super-admin — inconsistent with other routes (deliberate obscurity, but inconsistent).
- `src/app/api/board/route.ts` — manual stage-count loop instead of `groupBy` (fragile if data large/empty).
- `src/lib/email-permissions.ts` — reportedly a hardcoded personal sender address; **verify** and move to a service account if so.
- `apply` confirmation returns 201 even when the email send fails (no signal to caller).

---

## Already fixed this session (do NOT re-report)
- Arbitrary promote **and demote** → demotion disabled; bulk endpoint tightened to SUPER_ADMIN.
- Auto-graded task re-answer double-award → tasks lock once solved.
- Admin re-grade double points → awards only the delta.
- Resubmission after a grade → blocked (submissions); FAILED stage reports → no longer re-submittable (terminal).

## Notes for whoever troubleshoots
- This is a **live production** system (MongoDB Atlas, Vercel). Read-only investigation only; no destructive DB ops.
- The cutoff→pending→finalize flow, certificate, and grader-provisioning tab were just added (branch merged to `main`).
