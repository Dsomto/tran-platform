# Cohort 1 kickoff — copy/paste into /admin/broadcast

The Newsletter tab at **/admin/broadcast** has a Subject field and a Message field. Copy each block below verbatim. The composer:
- Auto-wraps everything in the UBI gradient/branded HTML shell.
- Replaces `{First name}` with each recipient's real first name.
- Turns `[words](https://link)` into clickable links.
- Auto-links bare http(s) URLs.

## Filter

Set the filter dropdowns to:
- **Status:** `Approved` (only people accepted into the cohort)
- **Stage:** `Any` (don't restrict by stage)
- **Track:** leave blank
- **Country:** leave blank

Click "Apply filters", then pick **"Everyone matching the filters"** in the Send to section. Preview before sending.

---

## Subject

```
Cohort 1 starts Saturday — your kickoff pack, {First name}
```

---

## Message

```
Hi {First name},

You're in. Cohort 1 of TRAN — The Root Access Network — starts this Saturday with the kickoff town hall, and Stage 0 opens Monday, June 1 at 09:00 WAT.

Here is the calendar with every milestone for the next six weeks — town halls, stage opens, submission deadlines, results, the laptop-winner decision. Click once and 21 events drop into your calendar:

[Add the cohort calendar to my phone or laptop](https://ubuntubridgeinitiatives.org/tran-cohort-schedule.ics)

Key dates (Africa/Lagos, WAT):
• Saturday 17:00 — Cohort kickoff town hall
• Monday 09:00 — Stage 0 opens
• Every Friday 18:00 — submission deadline
• Every Sunday 18:00 — results published

Three things to do today:

1) Add the calendar. Tap the link above on your phone, or click it on your laptop. Works with Google Calendar, Apple Calendar, Outlook, and Samsung Calendar.

2) Get into your account. Your welcome email with credentials should already be in your inbox (check the spam folder too). If you cannot find it, go to the login page and click "Forgot password" — a fresh reset link will be sent to the email you applied with. No need to write us, no need to wait.

[Open the login page](https://ubuntubridgeinitiatives.org/login)

3) Join the cohort Slack. This is where we run the cohort day-to-day — announcements, peer help, grader office hours. Sign up from any device:

[Join the Cohort Slack](https://join.slack.com/t/ubuntubridgei-b0a2120/shared_invite/zt-3yovczvzb-aYyq5hkUsa2RYyvRcB3Jsw)

No app? The web version at https://slack.com works fine on a PC — log in, bookmark it, treat it like Gmail.

————

A word on what makes this possible.

This cohort exists because of Peter Ejiofor. Sponsorship at this scale — fully funded cybersecurity training for hundreds of Nigerians, no strings attached — is rare in Nigeria and rare anywhere in the world. We do not take it for granted, and neither should you. When you finish this programme and someone asks how you got there, his name belongs in that sentence.

Thank you, Peter.

————

See you Saturday at the town hall.

— The TRAN team
Ubuntu Bridge Initiatives
```

---

## Workflow

1. Push the new `public/tran-cohort-schedule.ics` to `main`. Vercel deploys it; the download link goes live in 1–2 minutes.
2. Log in at the production site as the programme-owner account (the only one allowed to send per [src/lib/email-permissions.ts](src/lib/email-permissions.ts)).
3. Open **/admin/broadcast**.
4. Apply filters (Status: Approved, Stage: Any).
5. Confirm the recipient count matches your cohort size (~500).
6. Paste the **Subject** above into the Subject field.
7. Paste the **Message** above into the Message field.
8. Click **"Preview email"** — make sure the UBI gradient header renders and the merge field shows a sample name.
9. Click **"Send to N recipients"**, enter your 2FA code, confirm.
10. Track delivery on the Email Queue page.
