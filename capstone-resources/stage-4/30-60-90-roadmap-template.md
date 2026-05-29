# 30 / 60 / 90 REMEDIATION ROADMAP TEMPLATE — Sankofa Digital

Starting skeleton for the 30/60/90 roadmap you'll submit alongside the
risk register, board memo, control mapping, and NDPA letter.

Replace every `[BRACKETED]` field with the specific action you propose.
Delete this "NOTES TO THE INTERN" block before you submit.

---

## Required table (paste into your Google Doc)

| # | Window (30 / 60 / 90 days from board-approval) | Action (concrete, verb-first) | Owner role | Budget tier (S < ₦5M / M ₦5–25M / L ₦25M+) | Stage 1–3 evidence cite | NIST CSF 2.0 function.category | ISO 27001:2022 Annex A control |
|---|---|---|---|---|---|---|---|
| 1 | Days 0–30 | Rotate every credential and IAM role token that touched workstation 10.0.1.87. | Head of Cloud Platform | S | Stage 3 task 1 | RS.MI-01 | A.5.16 |
| 2 | Days 0–30 | `[Action — verb first]` | `[Owner role]` | `[S/M/L]` | `[Stage X task Y]` | `[NIST CSF id]` | `[ISO 27001 id]` |
| 3 | Days 0–30 | `[…]` | | | | | |
| 4 | Days 31–60 | `[…]` | | | | | |
| 5 | Days 31–60 | `[…]` | | | | | |
| 6 | Days 31–60 | `[…]` | | | | | |
| 7 | Days 61–90 | `[…]` | | | | | |
| 8 | Days 61–90 | `[…]` | | | | | |
| 9 | Days 61–90 | `[…]` | | | | | |

You may add up to 3 more rows of your own choosing. **Maximum 12 rows.**

## Deferral list (required section, 100+ words)

After the 30/60/90 table, name at least three real items from Stages 1–3
that you are deliberately NOT scheduling inside this 90-day window, and
why each one waits. For each:

- **Name the weakness** (cite Stage X task Y).
- **State the deferral target window** (days 91-180 / 181-365 / "tracked only").
- **Justify in one sentence WHY this one waits** — capacity, dependency
  on an earlier control, lower blast-radius, or compensating control
  already in place.

Generic "nothing deferred" loses points. The board judges discipline by
what you say no to, not what you say yes to.

`[Item 1]:` `[…]`

`[Item 2]:` `[…]`

`[Item 3]:` `[…]`

## Citation bar (mandatory)

- Every action cites at least one Stage 1–3 artefact (task number + the
  file/log line/payload).
- Every action maps to one NIST CSF 2.0 function.category — use the 2.0
  taxonomy (the GV function exists since Feb 2024). Verify at
  <https://www.nist.gov/cyberframework>.
- Every action maps to one ISO 27001:2022 Annex A control by ID
  (e.g. `A.5.15 Access control`, `A.8.7 Protection against malware`,
  `A.8.16 Monitoring activities`). Made-up Annex A IDs lose points.

## Quality bar

- Concrete actions only. "Improve security culture" loses points.
  "Run a mandatory secure-coding training for all backend developers in
  days 60–75, ≥80% attendance gates Q3 performance reviews" passes.
- Budget tiers are realistic — none of these are budget-tier S except
  staff-hours-only items.
- Each window has a milestone the board can name back to you.
