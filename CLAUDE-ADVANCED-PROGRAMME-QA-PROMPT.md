# Independent QA Prompt — UBI Advanced Programme (Stages 5–9)

Copy everything below into Claude from the repository root. This is a **read-only, adversarial review**. Do not ask Claude to implement fixes until the review is complete and approved.

---

## Your role

Act as a senior product designer, UX writer, frontend architect, accessibility reviewer, cybersecurity assessment designer, and application-security QA lead.

Review the UBI / The Root Access Network advanced programme experience for Stages 5–9. Be direct, skeptical, and specific. Do not praise the work unless you can point to evidence. Do not return vague comments such as “improve spacing,” “check security,” or “looks good.” Every issue must identify:

1. the affected route;
2. the exact file and line or component;
3. why it is a problem;
4. its user or security impact;
5. the smallest credible correction;
6. whether it blocks release.

Do not modify the database, open or close any stage, send announcements, email learners, download identity-bound artifacts, expose secrets, push commits, or alter unrelated dirty-worktree files. You may run read-only inspection, TypeScript, lint, local route checks, and browser-based visual/responsive/accessibility checks.

## Product intent

This is an advanced cybersecurity internship programme, not a video course and not a decorative challenge portal.

After five foundation stages, each learner is registered in exactly one specialist track:

- SOC Analysis
- Ethical Hacking / VAPT
- GRC Analysis

Each track has five connected projects mapped to Stages 5–9. The work must become more independent and demanding across the sequence:

- Stage 5 / Advanced Project 1: Signal
- Stage 6 / Advanced Project 2: Exposure
- Stage 7 / Advanced Project 3: Architecture
- Stage 8 / Advanced Project 4: Adversity
- Stage 9 / Advanced Project 5: The Final Case

The projects are not meant to be five unrelated assignments. Each project must reuse or extend interfaces, evidence models, code, tests, or decisions from the prior project. The final case should demonstrate accumulated capability.

The participant must understand four things on every project page:

1. **Receive** — which identity-bound case, overlay, marker, environment, and references they receive.
2. **Build** — what working system and scored outputs they must produce.
3. **Prove** — which acceptance tests, evidence, reproduction rules, and defense requirements establish that the work is real.
4. **Hand off** — what must carry forward into the next project or portfolio.

## Non-negotiable rules

### Access and operational control

- The public/participant stage URL must not accept a track selector from the browser.
- The server must derive the participant's track from the authenticated intern record.
- A participant must only receive the project, assignment overlay, resources, and artifact grant for their registered track.
- A participant must not access a future stage.
- An inactive participant must not access a stage.
- A stage defaults to closed if its window record is missing.
- Only an authenticated super admin may change a stage between `OPEN`, `PAUSED`, and `CLOSED`.
- Closing or pausing a stage must prevent participant stage access, resource access, assignment-overlay access, artifact access, drafts, and submissions where applicable.
- Staff access may intentionally differ, but any bypass must be explicit and role-bound.
- Stage 5–9 should remain closed operationally until the programme owner opens them.

### Preview versus production

- `/stage-preview` is a development-only design index. It intentionally shows all three tracks to the reviewer.
- `/stage-preview/[track]/[stage]` is a development-only dedicated page for each of the 15 project combinations.
- Preview routes must call `notFound()` outside development.
- The preview index is not proof of participant track gating. Review the production stage and resource paths separately.
- Protected resources shown inside preview pages must look protected and must not create misleading links that fail with `401`.
- Production actions must still point to the correct secured Stage 5–9 route.

### Assessment integrity

- Do not recommend easy-to-forge screenshot-only submissions.
- Material claims should resolve to raw artifacts and exact locators.
- Deliverables should include reproducible source, tests, evidence indices, manifests, hashes, and clean-build instructions appropriate to the project.
- Public fixtures should teach the interface and expected behavior without revealing hidden answers.
- Identity-bound markers, variants, and artifact grants must not be derived from a public or shared secret.
- Common briefs and templates may be shared across tracks only where they do not leak track-specific case facts.
- The platform must not claim that assignments are fully validated for launch merely because the code compiles.
- The remaining programme launch requirement is real lab evidence and two independent human test solves per variant. This review must record that as a pre-release validation dependency, not pretend it has been completed.

### Visual direction

- The product brand is **UBI**. The programme is **The Root Access Network**. Do not display “TRAN” as though it were the parent brand in the top navigation.
- The established public-site language is light, clean, and approachable: `#FAFAFA` backgrounds, white surfaces, neutral borders, blue primary actions, rounded cards, rounded-full CTAs, `max-w-6xl` content widths, restrained shadows, clear type hierarchy, and small blue eyebrow labels.
- The advanced pages must remain light even if a dashboard dark-mode preference exists. The owner explicitly rejected a broadly dark advanced experience.
- A compact dark telemetry/console instrument is acceptable when it represents technical output. It must not turn the whole page into a dark theme.
- Track accent colors may identify SOC, VAPT, and GRC, but they must not create a rainbow or make every project look like a different product.
- The landing page should explain the programme. The individual project page should contain the controlling assignment. Do not collapse all 15 assignments into a single landing page or modal.

## What has been implemented

### Programme landing page

`/stage-preview` now contains:

- UBI branding and an advanced-programme preview label;
- a skip link and semantic main landmark;
- a concise learning promise;
- Develop / Demonstrate / Defend expectations;
- programme statistics for three tracks, five linked projects per track, fifteen project pages, and one portfolio;
- a four-part learning model;
- a five-stage progression model;
- track-specific learning outcomes;
- track-specific toolkit summaries;
- a professional destination for each track;
- fifteen project cards;
- a dedicated “View project brief” link for every card;
- a separate “Open secured stage” action routed through the production stage URL helper;
- a learner-resource section covering the mission brief, assigned case pack, starter kits/schemas, fixtures/tests, evidence/manifest templates, and defense-readiness guidance;
- clear language that production learners only see their assigned track and case material.

### Dedicated project pages

Every preview combination has a dedicated route:

- `/stage-preview/soc/5` through `/stage-preview/soc/9`
- `/stage-preview/ethical-hacking/5` through `/stage-preview/ethical-hacking/9`
- `/stage-preview/grc/5` through `/stage-preview/grc/9`

Each page renders the same `AdvancedStageRoom` component used by production and includes:

- stage progress;
- a stage/track/project identity;
- a dedicated objective;
- window, revision, defense, and assignment metadata;
- a restrained technical instrument;
- evidence-marker requirements;
- the Receive / Build / Prove / Hand-off operating brief;
- environment gates;
- mission execution steps;
- engineering constraints;
- acceptance tests;
- required proof;
- automatic hold/fail gates;
- exact deliverables;
- briefs and artifacts;
- a deterministic extension pool;
- a submission section;
- previous and next navigation within the same track;
- a link to the actual secured stage.

In preview mode, protected resource entries are non-clickable and labelled `Protected`. In production, the same entries become authenticated, stage-aware resource links.

### Production participant track workspace

`/dashboard/advanced` is the real participant-facing programme landing page. Unlike the development index, it:

- derives one track from the authenticated intern record;
- renders only that track's five projects;
- requires the participant to have reached Stage 5;
- reads stage-window status, report status, and the participant's artifact grants server-side;
- uses native `<details>` elements so each available/completed project can be opened and closed independently;
- keeps locked, paused, and closed project briefs collapsed and unavailable;
- opens the current project by default;
- links an open project to its secured stage, submission, and valid identity-bound evidence pack;
- does not provide a client-controlled track selector.

### Design alignment changes

- Replaced the independent grey editorial design language with the established UBI light palette.
- Changed the preview brand from `TRAN` to `UBI`.
- Removed theme toggles from development preview pages.
- Removed advanced-page dark-mode overrides.
- Forced advanced programme surfaces to declare a light color scheme.
- Converted primary actions to UBI blue rounded-full buttons.
- Converted programme cards and assignment panels to rounded white surfaces with neutral borders.
- Reduced the desktop project grid from five cramped columns to three readable columns.
- Retained one controlled accent per track.
- Converted the advanced assignment hero from a dark full-width photo overlay to a light briefing surface with a faded image on the right.
- Converted the submission panel from near-black to UBI blue.
- Retained the compact technical instrument as the only intentionally dark operating surface.
- Converted the production `/dashboard/advanced` hero from a dark overlay into a light image-backed briefing surface.
- Aligned the production workspace's expandable project panels, status pills, deliverable chips, actions, and integrity notice with the same rounded UBI component language.
- Added responsive layouts for desktop, tablet, and mobile.
- Added `prefers-reduced-motion` behavior for card motion.

### Production access implementation to inspect

- `src/components/stage/AdvancedStagePage.tsx`
  - calls `getStageAccess(slug)`;
  - derives the intern's track from the database;
  - selects the project by server-side stage and database track;
  - does not accept a track slug from the participant URL.
- `src/lib/stage-access.ts`
  - checks session, active intern, current stage rank, and stage-window status;
  - treats a missing stage window as closed.
- `src/app/api/advanced-stage/resource/route.ts`
  - validates resource paths;
  - rejects traversal;
  - enforces participant stage rank, track, active status, and open window;
  - returns private/no-store responses.
- `src/app/api/advanced-stage/assignment/route.ts`
  - derives the project and overlay from the authenticated intern's track;
  - checks stage rank and open status;
  - validates an existing artifact grant against track, variant, and marker.
- `src/app/api/advanced-stage/artifact/route.ts`
  - checks active status, stage rank, open status, track-bound grant, revocation, expiry, expected variant, expected marker, and stored size.
- `src/app/api/admin/stage-windows/status/route.ts`
  - requires super-admin authorization;
  - accepts only known stages and `OPEN`, `PAUSED`, or `CLOSED`;
  - mirrors `isLocked` for legacy readers;
  - records an audit entry;
  - sends announcements only when explicitly opening with announcement data.

## Files to review

### Preview and shared UI

- `src/app/stage-preview/layout.tsx`
- `src/app/stage-preview/page.tsx`
- `src/app/stage-preview/stage-preview.module.css`
- `src/app/stage-preview/[track]/[stage]/page.tsx`
- `src/app/dashboard/advanced/page.tsx`
- `src/app/dashboard/advanced/advanced-track.module.css`
- `src/components/stage/AdvancedStageRoom.tsx`
- `src/components/stage/AdvancedProjectInstrument.tsx`
- `src/app/subdomains/advanced-theme.css`
- `src/lib/advanced-visuals.ts`
- `src/lib/advanced-stage.ts`
- `src/lib/stage-routes.ts`

### Access, variants, artifacts, and administration

- `src/components/stage/AdvancedStagePage.tsx`
- `src/components/stage/StageShell.tsx`
- `src/components/stage/themes.ts`
- `src/lib/stage-access.ts`
- `src/lib/advanced-variant.ts`
- `src/lib/advanced-artifact-storage.ts`
- `src/app/api/advanced-stage/resource/route.ts`
- `src/app/api/advanced-stage/assignment/route.ts`
- `src/app/api/advanced-stage/artifact/route.ts`
- `src/app/api/admin/stage-windows/status/route.ts`
- `src/app/admin/assignments/[id]/stage-admin-panel.tsx`

### Established design references

- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/landing/navbar.tsx`
- `src/components/landing/hero.tsx`
- `src/components/landing/about.tsx`
- `src/components/landing/tracks.tsx`
- `src/components/stage/StageLanding.tsx`
- `src/lib/stage-landing-theme.ts`

## Required QA procedure

### 1. Establish repository state

- Run `git status --short`.
- Treat all unrelated modified and untracked files as user-owned.
- Do not stage, edit, delete, reset, or reformat unrelated work.
- Identify the exact commit under review and whether the relevant QA changes are committed or only in the working tree.

### 2. Run safe static checks

At minimum:

```bash
npx tsc --noEmit
npx eslint src/app/stage-preview/page.tsx 'src/app/stage-preview/[track]/[stage]/page.tsx' src/components/stage/AdvancedStageRoom.tsx
git diff --check -- src/app/stage-preview src/app/subdomains/advanced-theme.css src/components/stage/AdvancedStageRoom.tsx
```

Do not report a pass if output was truncated or a command did not complete.

### 3. Perform browser QA if a browser is available

Use `http://localhost:3002` and inspect at minimum:

- `/stage-preview`
- `/stage-preview/soc/5`
- `/stage-preview/soc/9`
- `/stage-preview/ethical-hacking/7`
- `/stage-preview/grc/9`

If an authenticated participant session is safely available, also inspect `/dashboard/advanced`. Do not bypass authentication, change a participant's track/stage, or open a stage merely to obtain a screenshot.

Inspect at approximate widths:

- 1440 × 1000
- 1024 × 900
- 390 × 844

For every inspected page, check:

- horizontal overflow;
- clipped or overlapping copy;
- sticky-header behavior;
- keyboard focus visibility;
- anchor navigation;
- text contrast;
- type hierarchy;
- line length;
- card density;
- CTA clarity;
- touch-target size;
- previous/next navigation;
- protected-resource presentation;
- whether the page remains light when the root document has a `.dark` class;
- reduced-motion behavior where the browser supports emulation.

If no browser is available, state **“visual QA not executed”**. Do not infer pixel-perfect readiness from source code or substitute a fabricated screenshot.

### 4. Verify the full route matrix

Confirm all 16 development routes render: the index plus all 15 project pages. Confirm invalid combinations return `404`, including:

- `/stage-preview/soc/4`
- `/stage-preview/soc/10`
- `/stage-preview/not-a-track/5`
- `/stage-preview/grc/not-a-number`

Confirm the preview routes are unavailable when `NODE_ENV` is not development by reviewing the route guards. Do not alter the running environment merely to prove this.

### 5. Audit design-system consistency

Compare the preview and advanced assignment pages with the established design-reference files. Answer explicitly:

- Is UBI the visible parent brand?
- Does the page use the established maximum width and navigation height?
- Are primary actions blue, rounded, and clearly distinguished from secondary actions?
- Are card radii, borders, shadows, spacing, and typography recognizably part of the same product?
- Is the page light rather than a near-black dashboard?
- Is the one dark technical instrument justified and visually contained?
- Are track accents restrained?
- Does the page feel like a professional internship briefing rather than a marketing template, game dashboard, or generic AI-generated cyber page?

### 6. Audit content and learning logic

Review every project in `src/lib/advanced-stage.ts`, not only the SOC examples. For each of the 15 projects verify:

- the objective matches the title;
- setup requirements are plausible;
- mission steps produce the listed deliverables;
- technical challenges are relevant and not arbitrary difficulty padding;
- acceptance tests can be run against the stated environment;
- proof requirements establish the central claims;
- gates identify meaningful automatic failures;
- pressure slots use published interfaces and do not introduce unrelated scope;
- resources match the stage and track;
- duration is plausible for the stated workload;
- revision and defense policy rise appropriately across the sequence;
- the continuity hand-off genuinely feeds the next project;
- no requirement relies only on screenshots or prose where machine-readable evidence is possible;
- no wording claims a hidden or human validation has already happened when it has not.

Flag technical infeasibility, excessive workload, ambiguous acceptance criteria, dependency/version risks, unsafe offensive-security instructions, regulatory inaccuracies, and outcomes that cannot be independently reproduced.

### 7. Audit access control and failure behavior

Create an access matrix for:

- unauthenticated user;
- inactive intern;
- SOC intern;
- Ethical Hacking intern;
- GRC intern;
- intern behind the requested stage;
- intern at the requested stage;
- intern beyond the requested stage;
- grader;
- admin;
- super admin.

Evaluate these resources separately:

- production stage page;
- private assignment overlay;
- shared resource;
- track resource;
- identity-bound artifact;
- draft/report creation;
- submission;
- stage-status mutation.

For `OPEN`, `PAUSED`, `CLOSED`, and missing-window states, state the expected and actual behavior. Pay special attention to whether shared resources accidentally bypass track/stage checks, whether staff bypasses are too broad, and whether differences between `getStageAccess`, resource routes, draft routes, and submission routes create inconsistent user experiences.

### 8. Audit copy and semantics

Proofread every visible line in the preview routes for:

- UBI versus TRAN naming;
- programme versus program consistency;
- assigned track versus choosing a track;
- stage number versus project number;
- “artifact” versus “artefact” consistency with the rest of this repository;
- revision/defense wording;
- claims that overpromise employment readiness or production equivalence;
- jargon without explanation;
- text that is too dense for a landing page;
- text that belongs on a project page but has leaked into the index;
- headings that do not describe the content below them.

Provide exact replacement copy for every copy issue you raise.

### 9. Inspect security-sensitive implementation

Check for:

- path traversal and prefix-confusion mistakes;
- resource paths that can escape `public/advanced-stage` expectations;
- track slug/enum mismatches;
- stage enum/rank mistakes;
- client-controlled variant, marker, track, or artifact identifiers;
- timing or error-message differences that reveal another track's resource existence;
- secrets or private artifact paths committed to public source;
- caching of private resources;
- unsafe content types or inline rendering;
- missing revocation/expiry enforcement;
- missing authorization on stage-status changes;
- announcements triggered by close/pause actions;
- missing audit records;
- preview-only code accidentally available in production.

Do not print secret values. Report only secret names and whether their usage appears separated appropriately.

## Expected invariants

The current implementation claims the following. Independently confirm them:

- exactly three advanced tracks;
- exactly five projects per track;
- exactly fifteen projects total;
- project index 1–5 aligns to Stage 5–9;
- every project has non-empty setup, mission, challenges, acceptance tests, proof, deliverables, gates, pressure slots, and resources;
- resource paths contain no `..` segments;
- no duplicate resource path exists inside one project;
- track-specific resource paths match their project track and stage;
- every “View project brief” route points to the matching track and stage;
- every production stage link points to its matching secured stage;
- previous/next controls cannot cross into another track;
- preview resource entries are non-clickable and labelled protected;
- production resources remain clickable only through the authenticated API;
- no advanced dark-mode override remains;
- all representative routes return `200` in development.

## Required response format

Return exactly these sections:

### A. Executive verdict

- One of: `GO`, `CONDITIONAL GO`, or `NO-GO`.
- Maximum 150 words.
- Separate software readiness from programme-launch validation.

### B. Release blockers

Numbered list. If none, say `None found` and explain the evidence for that conclusion.

### C. Issue register

A table with:

| ID | Severity | Area | Route | File:line | Finding | Impact | Minimal correction | Blocks release? |
|---|---|---|---|---|---|---|---|---|

Use severities `Critical`, `High`, `Medium`, `Low`, and `Nit`. Do not inflate style preferences into security severity.

### D. Design consistency assessment

Score 0–5 and justify each:

- brand consistency;
- layout/system consistency;
- visual hierarchy;
- light-theme execution;
- responsive behavior;
- interaction clarity;
- accessibility;
- perceived authorship/authenticity.

### E. Page-by-page browser results

For each inspected route and viewport, give pass/fail plus specific evidence. If browser QA was unavailable, state that and do not award visual scores as though it ran.

### F. Track and project content audit

A 15-row table:

| Track | Stage | Project | Feasible? | Duration plausible? | Acceptance test quality | Evidence quality | Continuity quality | Main concern |
|---|---:|---|---|---|---|---|---|---|

### G. Access-control matrix

Show role/state against page, overlay, shared resource, track resource, artifact, submission, and status mutation. Mark `Allow`, `Deny`, or `Conditional`, with the controlling code reference.

### H. Copy-edit list

Quote only the short affected phrase, then provide exact replacement copy and rationale.

### I. Commands and evidence

List every command/check executed, its exit status, and any limitation. Do not say “all tests pass” unless you list which tests ran.

### J. Residual risk and human validation

Explicitly list:

- browser/visual QA status;
- real-lab evidence status;
- two-independent-solves-per-variant status;
- any external legal/regulatory verification still required;
- any production data or secret configuration not inspectable in source.

### K. Minimal patch plan

Order only the changes required for release. Keep preferences and optional polish separate.

### L. Final recommendation

State what may ship now, what must wait, and the exact evidence required to change the verdict.

## Final instruction

Your job is to find what the implementation team missed. Verify claims from code and rendered behavior. Do not confuse compilation with correctness, a development preview with production authorization, or technically difficult assignments with validated assignments. Be fair, but do not be deferential.

---
