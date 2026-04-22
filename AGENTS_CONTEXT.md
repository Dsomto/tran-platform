# TRAN · Foundation Rooms — Agent brief

You are one of 50 agents building the TRAN foundation programme (Operation Root
Access, Stages 0–4) for Ubuntu Bridge Initiative. Read this file in full
before doing anything else. It contains everything you need to ship
independently without breaking sister agents' work.

## Repo

`/Users/dsomto891/hng/netforge` — Next.js 16.2.3, Prisma 6, MongoDB Atlas,
Tailwind 4. Key facts from `AGENTS.md`:

> This is NOT the Next.js you know. This version has breaking changes — APIs,
> conventions, and file structure may all differ from your training data.

Notable rename: **`middleware.ts` is now `proxy.ts`** in Next 16. Route
handler signatures still await params: `{ params: Promise<{ slug: string }> }`.

Tailwind 4 uses `@theme inline` in `src/app/globals.css` — there is **no**
`tailwind.config.ts`. Any new CSS tokens go into a stage-local CSS file that
you import from the stage's layout.

## The setting (brief you can use in your copy)

Fictional pan-African fintech **Sankofa Digital** has been breached by an
APT known only as **The Griot**. TRAN's Head of Security **Amaka Eze**
runs the junior analyst programme. Senior analyst **Tunde Bakare** drops
in for hints. Interns work the breach across 5 chapters (Stages 0–4).
Capstone reveals who The Griot is.

Each stage room has its own subdomain: `stage-0.ubinitiative.org`,
`stage-1.ubinitiative.org`, … Locally these map to `stage-0.localhost:3000`.

`src/proxy.ts` already rewrites those subdomains to `/subdomains/stage-X/...`,
so **you build under `src/app/subdomains/stage-X/`** — NOT at the top level.

## Stage themes

| Slug | Name | Codename | Accent | Vibe |
|---|---|---|---|---|
| stage-0 | Induction at the Gate | Chapter 1 | emerald `#34d399` | first-day office, green-on-black, matrix-code ambience, compass icon |
| stage-1 | Ciphers & Secrets | Chapter 2 | violet `#a78bfa` | cryptography lab, runic glyphs, midnight purple gradients, rotor dial |
| stage-2 | The Attack Surface | Chapter 3 | rose `#fb7185` | red-team ops, radar sweep, scanner grid, neon pink/red |
| stage-3 | Inside the Walls | Chapter 4 | amber `#fbbf24` | DFIR / SOC, alarm-amber haze, timeline ribbons, clock/sigil |
| stage-4 | The Debrief | Finale | cyan `#22d3ee` | executive boardroom, holographic glass, blueprint cyan, award ribbon |

Theme definitions live in `src/components/stage/themes.ts` — import
`STAGE_THEMES["stage-N"]` for canonical values.

## Shared building blocks (USE THESE — do not rewrite)

- `@/components/stage/StageShell` — page chrome with header + footer.
- `@/components/stage/StageLogin` — client login card.
- `@/components/stage/TaskPage` — client task page (briefing + widget + submission).
- `@/components/stage/themes` — `STAGE_THEMES` object.
- `@/components/widgets/TaskWidget` — dispatcher: pass `kind` + `config` + `context`.
- `@/lib/stage-login` — `STAGE_SLUG_TO_ENUM`, `getDoorSession(slug)`, `stageEncodingHint(slug)`.
- `@/lib/db` — Prisma client.
- `@/lib/flag` — `computeFlag(flagSalt, internId)` (server) / `computeFlagBrowser` (client).

Widget kinds available:
`NONE | WEB_TERMINAL | CIPHER_TOOLS | STEGO_VIEWER | LOG_VIEWER | VULN_APP_SIM | PORT_SCANNER | FILE_DOWNLOAD | DIAGRAM_UPLOAD | MCQ_QUIZ | WRITEUP_PAD`.

Task kinds: `FLAG | MULTIPLE_CHOICE | WRITEUP | UPLOAD`.

## Per-intern flag convention

For FLAG tasks the expected flag is derived server-side as
`TRAN{HMAC-SHA256(flagSalt, internId).slice(0,16)}`. Widgets compute the
same client-side so the intern-specific scenario (file contents, fake SQL
row, stego passphrase) matches what the intern will submit. Every FLAG
task you author MUST include a unique `flagSalt` string (use the task's
slug padded with the stage, e.g. `"stage-0-task-1-salt"`).

### Templating in widgetConfig strings

Any string inside `widgetConfig` can embed these placeholders — they are
resolved to per-intern values at widget mount time:

- `{FLAG}` → the intern's full `TRAN{…}` for this task's `flagSalt`.
- `{SECRET:<salt>:<len>}` → hex slice of `HMAC(salt, internId)`; `len`
  optional (default 16). Use for stego passphrases, non-flag secrets.

Widgets that support templating:

- `WEB_TERMINAL`: file-system entries may be `{ kind: "flag", salt }` or
  `{ kind: "secret", salt, len }`.
- `LOG_VIEWER`: `logs` and `instructions` strings are template-resolved.
- `CIPHER_TOOLS`: preset config keys are template-resolved — `caesarInput`,
  `vigenereInput`, `vigenereKey`, `base64Input`, `base64Plaintext` (which
  is auto-base64-encoded for the base64 tab), `hexInput`, `binaryInput`,
  `aesKey`, `aesIv`, `aesCiphertext`, `hmacKey`, `hmacMessage`, `jwtInput`,
  `hashInput`, plus `initialTab` and `caesarShift` (number).
- `STEGO_VIEWER`, `VULN_APP_SIM`, `FILE_DOWNLOAD`: each resolve `{FLAG}` /
  `{SECRET:…}` in their config strings. Review the component before
  authoring to match its exact field names.

## Auto-grading

- `FLAG` → server compares `computeFlag(flagSalt, internId)` vs submitted flag.
- `MULTIPLE_CHOICE` → server compares submitted `choiceIndex` vs `correctIndex`.
- `WRITEUP` / `UPLOAD` → SUBMITTED, admin grades manually.

## Authoring rules

- **No emojis in code or copy** — agents must not inject them.
- **No comments that describe the task** — clean code only.
- **No backwards-compat shims** — create what is needed, nothing more.
- **Do not install new npm packages** — everything you need is available.
- **Do not edit files outside your assigned scope** — the shared components
  are DONE. If you need a new shared helper, inline it instead.
- **Do not edit `prisma/schema.prisma`** — schema is frozen.
- **When you create React components, mark them `"use client"` only if they
  use hooks/state/event handlers.** Data fetching pages are server components
  and use `getDoorSession(slug)` directly.

## Seed JSON format

Every content agent produces one file at
`prisma/seed-rooms-scenarios/stage-N/task-M.json`, shaped exactly like:

```json
{
  "order": 3,
  "title": "Hash this",
  "description": "Short one-paragraph briefing, shown above the widget.",
  "maxPoints": 10,
  "kind": "FLAG",
  "widget": "WEB_TERMINAL",
  "widgetConfig": { ... },
  "flagSalt": "stage-0-task-3-salt",
  "choices": null,
  "correctIndex": null,
  "minWords": null
}
```

The seed orchestrator (to be written at `prisma/seed-rooms.ts`) upserts a
Room per stage and an Assignment per task keyed by `(roomId, order)`.

## File you MUST NOT touch

Everything in `src/lib/`, `src/components/widgets/`, `src/components/stage/`,
`src/app/api/`, `src/proxy.ts`, `prisma/schema.prisma`, the existing pages
under `src/app/` (dashboard, admin, etc.). These are frozen.

## Your scope

Your individual prompt names exactly the files you must create and nothing
else. If in doubt, check the file path in your prompt — if it is not in that
list, do not create it.
