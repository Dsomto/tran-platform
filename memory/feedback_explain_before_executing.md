---
name: Explain before executing
description: Somto wants a clear "here's what I'm about to do" before any non-trivial change — not execute-then-summarize
type: feedback
---

Before executing any non-trivial change, state what I'm about to do in plain language — the files I'll touch, the shape of the change, what I'm deliberately *not* doing. Wait for acknowledgement on the first pass; subsequent similar changes can proceed without repeating the explanation.

**Why:** Somto pushed back with "You just run into things. Tell me what you have done first before you do things." Auto mode's "execute immediately" default was overriding his preference for alignment before action. Walls of output after the fact are harder for him to course-correct than a short plan up front.

**How to apply:** For changes beyond trivial edits (fixing a typo, tightening a label, obvious bug fix), describe the plan first. Include files, shape, and explicit non-goals. For sweeping refactors (schema changes, new routes, renaming models), the plan should come before *any* code is written, not just the big chunks. Pure reasoning / reads / audits don't need this — only mutations.
