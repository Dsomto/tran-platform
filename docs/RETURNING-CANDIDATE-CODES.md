# Returning-candidate codes

A returning-candidate code is a one-time "come back" pass for an intern who was
eliminated **after reaching a stage** — both those who submitted and those who
did not (reaching the stage is the bar). It is delivered in their result email
and, when a future cohort's applications open, lets them re-enter automatically.

This is a real, persistent part of the system — schema + code, no hard-coded
list. Any maintainer or tool (Claude, Codex, a human) can read the schema and
`src/lib/returning-code.ts` to understand and operate it.

## Where it lives

| Piece | Location |
|---|---|
| Storage | `PublicApplication.returningCode` / `returningCodeIssuedAt` / `returningCodeStage` / `returningCodeRedeemedAt` in `prisma/schema.prisma` |
| Generation + redemption logic | `src/lib/returning-code.ts` |
| Minting at Finalize | `src/app/api/admin/stage-results/route.ts` — `handleFinalize` (submitters, elimination branch + advanced inline non-submitters) and `handleFinalizeNonSubmitters` (non-submitters) |
| Email delivery | same file — `renderResultEmail` (eliminated submitters) and `renderNoSubmissionEmail` (non-submitters) |
| Redemption on apply | `src/app/api/apply/route.ts` + the "Returning-candidate code" field in `src/app/apply/page.tsx` |

## Lifecycle

1. **Mint** — when you click **Finalize** on a stage, every eliminated intern who
   reached that stage gets a unique code (`NF-XXXX-XXXX`) stored on their
   `PublicApplication` row. Minting is **idempotent**: a row that already has a
   code keeps it, so re-running Finalize never invalidates a code already emailed.
2. **Deliver** — the code appears in that person's result / no-submission email
   with instructions.
3. **Redeem** — when the next cohort's applications are open, the candidate
   applies at `/apply` **with the same email address** and enters the code. A
   valid, unused code flips their existing application to `status = "queued_approved"`
   (the auto-approved queue) and stamps `returningCodeRedeemedAt`. From there the
   normal "send pending welcome emails" flow mints their intern ID.

## Rules

- **Bound to the email it was issued to.** Redemption requires the same address;
  this keeps it to one row and avoids the `PublicApplication.email` unique constraint.
- **One use.** Once `returningCodeRedeemedAt` is set, the code is spent.
- **Eligibility = reached the stage and was eliminated at Finalize.** Applies to
  Stage 5 onward (earlier stages were finalized before this feature existed).

## Operational notes

- Nothing is minted until **Finalize** runs — the feature sits dormant until then.
- To see who holds a live (unredeemed) code:
  `PublicApplication` where `returningCode != null AND returningCodeRedeemedAt == null`.
- Codes use a human-friendly alphabet (no `0/O/1/I/L/U`) so they survive being
  copied out of an email months later.
