# Pre-launch & weekly operations checklist

Operation Root Access — the things that will bite if missed. Code-fixable
risks have been fixed on the `stage-experience-redesign` branch; what remains
below is **operational** — it needs a person, not a commit.

---

## One-time — before 1 June

- [ ] **Add a second SUPER_ADMIN.** Tiebreaks, publishing results, opening/
      closing stage windows and resets all require super-admin. If that is one
      person, the whole cohort's weekly progression stalls the moment that
      person is unavailable. *Add a backup before launch.*
- [ ] **Verify database backups are ON and a restore actually works.** The
      platform carries 500 interns for five weeks. Confirm MongoDB Atlas
      automated backups are enabled and do one test restore so the procedure
      is known *before* you need it under pressure.
- [ ] **Decide the Stage 3 & 4 board content.** Stage 3 has 3 mission-board
      tasks, Stage 4 has 3 — all writeups. Under the capstone-only model
      (Option A) those writeups aren't separately graded, so those boards are
      thin. Either seed more auto-graded tasks for 3 & 4, or accept the slim
      boards. (The empty "awaiting task" slots have been removed either way.)
- [ ] **Recruit and calibrate the 10 graders.** One calibration session: all
      graders score the same sample reports against the rubric and align.
      Budget Stage 0 week as ~5 hrs/grader/day — it is the peak.
- [ ] **Set every stage's `passingScore`.** The capstone report score is the
      stage score (Option A). Confirm the threshold per stage.
- [ ] **Confirm the result-email expectation copy.** 500 emails drain over
      time via the queue — interns will receive results minutes-to-hours
      apart. Say so in the email so no one panics that a friend got theirs
      first.

---

## Every Monday — opening a stage

- [ ] **Open the next stage's `StageWindow`** (admin → Stage Windows). An
      intern can only enter a stage whose window is OPEN. Forget this and the
      entire advancing cohort is locked out → support flood. This single
      switch gates everyone.
- [ ] Confirm the previous stage's window is CLOSED (no late drift).
- [ ] Post the stage-open announcement.

---

## Every Friday — publishing results

- [ ] **Clear the tiebreak queue first.** If two graders disagree beyond the
      divergence threshold, that report sits UNDER_REVIEW and **the publish
      will refuse to run until every divergent report is tiebroken.** Resolve
      them earlier in the week — do not discover them at publish time.
- [ ] **Run the publish as a dry-run first** (it reports will-pass / will-fail
      counts) before the real publish.
- [ ] **Watch the publish complete.** It promotes interns + queues emails in
      one ~5-minute function. For a 500-cohort it should fit, but if it times
      out mid-run you get a half-promoted cohort. If in doubt, publish in
      smaller batches and verify counts after.
- [ ] After publishing, confirm the result emails are draining from the queue.

---

## Known limitations (accepted, by design)

- **Board auto-advance is now off.** The task-answer route no longer calls
  `maybeAdvanceStage` — interns advance *only* when an admin publishes results
  and opens the next window. This is intentional. (`maybeAdvanceStage` still
  exists in `src/lib/advance-stage.ts` but is no longer wired to anything —
  leave it unused, or delete it later; do not re-connect it.)
- **The per-stage "debrief" panel** stays locked unless every board task is
  graded. Under the capstone-only model the board writeups are not graded, so
  the debrief panel will usually stay locked. This is cosmetic — it does not
  block progression.
- **The mission board is practice + leaderboard**, not the score. The capstone
  report is the stage score; auto-graded board tasks feed the leaderboard.

---

*This checklist is operations-only. The code-side risks from the audit
(empty placeholder slots, board auto-advance, hardcoded task counts) are
already fixed on the branch.*
