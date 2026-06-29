export const meta = {
  name: 'stage1-grade-seven',
  description: 'Strictly grade the bottom-half ungraded Stage 1 capstone reports as Grader Seven',
  phases: [
    { title: 'Load', detail: 'use the passed bottom-half batch (SKIP=63)' },
    { title: 'Grade', detail: 'one strict grader per submission' },
  ],
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reportId: { type: 'string' },
    name: { type: 'string' },
    task3: { type: 'integer', minimum: 0, maximum: 12 },
    task6: { type: 'integer', minimum: 0, maximum: 16 },
    task7: { type: 'integer', minimum: 0, maximum: 16 },
    task10: { type: 'integer', minimum: 0, maximum: 16 },
    capstone: { type: 'integer', minimum: 0, maximum: 40 },
    fabricationPenalty: { type: 'integer', minimum: 0, maximum: 5 },
    reportScore: { type: 'integer', minimum: 0, maximum: 100 },
    cannotAssess: { type: 'boolean' },
    seniorReviewFlag: { type: 'boolean' },
    flagReason: { type: 'string' },
    missingPieces: { type: 'string' },
    feedback: { type: 'string' },
  },
  required: ['reportId', 'task3', 'task6', 'task7', 'task10', 'capstone', 'fabricationPenalty', 'reportScore', 'cannotAssess', 'seniorReviewFlag', 'feedback'],
}

const KEY = `
STAGE 1 ANSWER KEY (grade against this exactly).

REPORT = 100 pts = Capstone D1-D4 (40) + Task10 (16) + Task7 (16) + Task6 (16) + Task3 (12).

== IN-PLATFORM WRITE-UPS (from the DB dump) ==

TASK 3 Three Strings (12):
 A = Vigenere, INTENTIONAL DISTRACTOR, UNRECOVERABLE. Correct answer is "cannot be recovered" + why (text too short, IC random). Inventing a plaintext = fabrication.
 B = Base64 -> "Staging backup taken 0230. Griot's key was left in config. Rookie." (encoding, not encryption)
 C = Hex -> "Let Amaka know the group is sated." (encoding)
 Rows: A identified Vigenere AND recognised unrecoverable with NO invented plaintext =3; B decoded+called encoding =2; C decoded+called encoding =2; encoding-vs-encryption 50+ words =2; compare-two-interpretations for A,B,C =2; cites RFC 4648 + a real Vigenere source =1.
 RED: a confident decoded plaintext for A = 0 for that row (and triggers the fabrication penalty).

TASK 6 Hashes (16):
 A bcrypt cost12 marker $2b$12$ (fine); B MD5 bare 32-hex (rotate FIRST); C SHA-256 bare 64-hex (rotate second); D Argon2id $argon2id$v=19$m=65536,t=3,p=4$ (fine, strongest). Correct order B then C.
 Rows: identify all four WITH the marker quoted =6; rotation ranking+justification (B then C, unsalted/GPU reason) =4; names the safe one + the param that makes it safe =2; compare-two-families A-D =2; 2+ real citations (OWASP Password Storage, RFC 9106, NIST 800-63B 5.1.1.2) =1; "one mistake" 30+ words specific =1.
 RED: ranking Argon2id/bcrypt as most urgent = cap the ranking row at half.

TASK 7 JWT (16):
 Header {"alg":"none","typ":"JWT"}; Payload {"sub":"admin","role":"super_admin","iat":1700000000}; signature empty.
 Root cause = server ACCEPTED alg:none (CVE-2015-9235). Server failure = no explicit algorithm allow-list. Fix = (1) allow-list HS256/RS256 never none, (2) never trust the role claim, authorise server-side.
 Rows: decode 3 segments + note empty signature =3; root cause precise alg:none acceptance (not "weak crypto") =4; server-side failure no allow-list =3; two-part fix =3; compare-two-causes (root vs role-trust) =1; cites RFC 7519 6.1 + a real CVE =1; "one mistake" =1.
 RED: "signature was forged/weak" = wrong; cap root-cause row at half.

TASK 10 Brief the Board (16):
 Q1 confidentiality != integrity/auth/key-protection, MUST cite one specific lab mistake; headline "the algorithm is not the asset, the key is" =4.
 Q2 hash alone cannot detect tampering, attacker swaps file+hash, need HMAC or digital signature, verifier holds a key =4.
 Q3 exactly ONE audit pattern, evidenced (e.g. audit configs/logs for plaintext secrets) =3.
 Board-facing prose (actionable headline, jargon glossed, no naked lists) =2; 3+ real citations NIST+OWASP+CVE =2; evidence appendix + "one mistake" =1.
 RED: laundry list for Q3; fabricated citations; generic voiceless board prose (strongest AI tell).

== CAPSTONE D1-D4 (40) from the Google Drive files ==
 D1 Crypto Failure Mapping (14): a TABLE, ~6 rows: AES key+IV in same config; reused IV; HS256 token signed with a 5-char secret; the three session-token failures (alg, lifecycle, privilege). Every row cites a real standard by NUMBER (RFC/NIST SP/FIPS). Prose with no table, or rows with no file ref / no standard = lose marks.
 D2 Decoded Artefact Appendix (10): one section per artefact: recovered plaintext + method + intermediate outputs. Three JWTs in a table. Layered memo shows every peel step. CHECK against VERIFIED KEY:
   01 AES-CBC -> "sankofa-legacy-admin-takeover-2024"
   02 ROT13 -> "TUNDE WAS RIGHT. THE GRIOT IS ALREADY INSIDE."
   03 JWT A alg:none admin/super_admin; B HS256 sub o.adegoke role intern (no exp); C HS256 sub c.eze role admin (privilege)
   04 HS256: real secret "sankofa-legacy-admin-2019" hard-coded in /legacy-admin/login.php. It is NOT a wordlist entry, the captured token was TAMPERED so its signature does not verify. Correct answer = recover the secret from the leaked SOURCE, prove the signature does not verify, forge a valid amaka.eze token, and explain why it is NOT crackable. ANYONE who claims a rockyou/hashcat "crack" or invents a secret value for 04 = fabrication: score D2 part 0 and apply the fabrication penalty.
   05 layered base64 -> ROT13 -> Atbash -> recon memo (targets legacy-admin, finance-mailer, payment-gateway).
 D3 Five Controls (10): EXACTLY five concrete controls, each mapped to >=2 D1 failures, each cost-aware/specific enough to buy or build. Fewer than five, vague ("improve crypto hygiene"), or unmapped = lose marks.
 D4 Ethics (6): 300-500 word essay, intern's own voice (prose), cites an ISC2 Code of Ethics canon BY NUMBER, addresses all four prompts (who to consult; what to share/not and why; sponsor vs Sankofa duty; one concrete action). Outside 300-500 words, generic AI prose, missing a prompt, or no ISC2 number = lose marks. D4 is the strongest AI-detect deliverable.
`

const RULES = `
STRICTNESS (this matters, do not inflate):
- This is a hard, demanding rubric on a competitive cut. Be the strict critic. Do NOT be generous. The first pilot averaged 80, which was too high; this pass must be harder.
- Universal rule: a claim needs BOTH a lab artefact (file/line/payload) AND an external citation (NIST/CVE/RFC/OWASP/MITRE) WITH its section number for FULL credit. Lab-only, citation-only, or a citation with no section number = HALF. A fabricated/non-existent section number or CVE = 0 for that row. A hash family named without its marker quoted, or a "compare two" row missing the disambiguator, drops to half or zero.
- Calibration anchors (harder): reserve 80+ ONLY for a clean report with no fabrication that nails essentially every row including both honesty traps with real cited section numbers. Solid-but-flawed lands 50 to 68. Mixed or shallow lands 35 to 49. Weak (loose or no citations, wrong root cause, multiple thin rows) lands 15 to 34. Most real submissions are NOT excellent. When a row is thin, take the lower mark.
- THE HONESTY TRAPS ARE THE POINT. Task 3 Artefact A and Capstone D2 artefact 04 cannot be solved. The CORRECT, full-credit answer is to state clearly that it cannot be recovered or cracked and explain why. Reward that honesty with full marks on that row.
- FABRICATION PENALTY (no AI flag): a confident invented plaintext for Artefact A, or a claimed wordlist/hashcat crack or an invented recovered secret for artefact 04, is fabrication. Score that row 0. Then apply a SINGLE flat 5 point penalty if the intern fabricated on either OR both traps. The penalty is capped at 5 total and is NEVER 10. Do NOT set any AI flag. In the feedback, tell the intern plainly and honestly what they did on EACH trap they fabricated and what the correct answer was, for example: "You reported cracking artefact 04 to <value> with hashcat and rockyou. That token was tampered and its signature does not verify, so it cannot be cracked from a wordlist. The honest answer was to recover the hard-coded secret from the leaked source and show the signature fails." Keep the tone instructive, not punitive.
- fabricationPenalty is 5 if they fabricated on one or both traps, 0 if none. Never more than 5.
- CANNOT-ASSESS CAPSTONE: if the ENTIRE capstone is unreadable (the Drive folder returns 401 or a Google login wall, or a single-doc link will not open at all, so you cannot read ANY of D1-D4), set cannotAssess=true AND seniorReviewFlag=true, leave capstone=0, and explain in missingPieces. Do NOT treat this as a genuine zero. This report will be HELD OUT of grading and the intern emailed to fix their sharing. If you CAN read some capstone files but one is missing, set cannotAssess=false, grade what you can, and set seniorReviewFlag=true with a note. If everything reads fine, cannotAssess=false.

FEEDBACK: write 4 to 6 sentences of honest, GENUINELY INSTRUCTIVE review the intern can ACT ON to improve, not just a verdict. ABSOLUTELY NO EM DASHES anywhere; use commas, periods, or "to". The note MUST contain all of these:
 1) One genuine, specific strength (name the task and what they did right, not "good job").
 2) The biggest weakness, named to the exact task and row.
 3) Concrete HOW-TO-IMPROVE guidance for each major gap: tell them the precise thing to do next time, for example "quote the bcrypt marker $2b$12$ in the line, then cite OWASP Password Storage and add the section number" or "in D1, convert the prose into a table with one row per failure and put the standard number such as RFC 7519 6.1 in its own column". Point them at the exact concept, citation with its section number, decoded value, or method they should have used, so they could redo the row correctly from your note alone.
 4) The concept behind each gap in one short clause, so reading the note teaches the idea, not only the fix (for example why encoding is not encryption, or why a tampered token cannot be cracked from a wordlist).
 5) If they fabricated on a honesty trap, name exactly what they fabricated, why it is impossible, and the honest correct answer.
Tone matches the score, encouraging where earned and direct where weak. The intern reads this on a pass-or-fail result, so make every sentence something they can use to do better next stage.

reportScore = (task3 + task6 + task7 + task10 + capstone) minus fabricationPenalty. Never below 0. It must equal that arithmetic.
`

function prompt(it) {
  return `You are Grader Seven, a strict senior cybersecurity grader for the Stage 1 capstone. Grade ONE intern's full report out of 100.

Intern: ${it.name} (${it.email})
reportId: ${it.reportId}
Capstone link: ${it.link}

STEP 1 - load the web tool: call ToolSearch with query "select:WebFetch" so you can fetch documents.

STEP 2 - read the four in-platform write-ups VERBATIM from the database. Run this Bash (it is read-only):
  cd /Users/dsomto891/hng/netforge && EMAIL=${it.email} npx tsx scripts/dump-intern-stage1.ts 2>/dev/null
The output has a "=== Stage 1 WRITEUPS ===" section with Task 3, 6, 7, 10 full text. If a task is absent from the dump, that task scores 0. Grade Task 3/6/7/10 from this text.

STEP 3 - read the capstone (D1-D4) from the Google Drive link:
 - If the link contains "/document/d/<ID>" it is a single doc: WebFetch https://docs.google.com/document/d/<ID>/mobilebasic and grade D1-D4 from it.
 - If the link contains "/folders/<FOLDERID>" it is a folder: first WebFetch https://drive.google.com/embeddedfolderview?id=<FOLDERID>#list and ask it to return each file NAME and its FILE_ID. Then for EACH of the four files WebFetch https://docs.google.com/document/d/<FILEID>/mobilebasic and read it. Match D1/D2/D3/D4 by the file name (D1=Crypto Failure Mapping, D2=Decoded Artefact Appendix, D3=Five Controls, D4=Ethics).
 - If the link contains "/file/d/<ID>" it is a single uploaded file (often a PDF). Try WebFetch https://drive.google.com/uc?export=download&id=<ID> and also https://docs.google.com/document/d/<ID>/mobilebasic. If neither yields readable D1-D4 content, treat the capstone as unreadable per the cannot-assess rule.
 - Use a grading-focused prompt when you fetch, asking for the specific things the key checks (decoded values, whether artefact 04 is claimed cracked, citation section numbers, control count, word count, ISC2 canon number).
 - If a single file will not open but others do, set seniorReviewFlag and record it in missingPieces. If the WHOLE capstone is unreadable, follow the cannot-assess rule.

STEP 4 - score every row strictly using the answer key and rules below, then return the schema. reportScore must equal task3+task6+task7+task10+capstone minus fabricationPenalty (5 if they fabricated on either or both honesty traps, 0 if none).

${KEY}

${RULES}

Return ONLY the structured grade for reportId ${it.reportId}.`
}

phase('Load')
let batch = []
if (args) {
  batch = typeof args === 'string' ? JSON.parse(args) : args
}
if (!Array.isArray(batch) || batch.length === 0) {
  const loaded = await agent(
    'Run exactly this read-only command from a shell and output ONLY the raw JSON array it prints, with no commentary and no code fences: cd /Users/dsomto891/hng/netforge && SKIP=63 npx tsx scripts/stage1-batch.ts 2>/dev/null',
    { schema: { type: 'object', additionalProperties: false, properties: { reports: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { reportId: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, link: { type: 'string' } }, required: ['reportId', 'email', 'name', 'link'] } } }, required: ['reports'] }, label: 'load-batch', phase: 'Load' }
  )
  batch = loaded && Array.isArray(loaded.reports) ? loaded.reports : []
}
log('Grading ' + batch.length + ' Stage 1 reports (bottom half, SKIP=63)')
phase('Grade')
const graded = await parallel(
  batch.map((it) => () => agent(prompt(it), { schema: SCHEMA, label: it.name, phase: 'Grade' }))
)
const ok = graded.filter(Boolean)
log('Graded ' + ok.length + '/' + batch.length)
return ok
