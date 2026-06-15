// Server-side structure checks for the Stage-2 `/verify` route (T3 SQLi, T6 SSRF).
// Pure, deterministic, no DB, no network — see STAGE-HARDENING-COLLAB.md Turn 6/7.
//
// These do NOT run SQL or make requests. They assert the *shape* of a real
// exploit so the per-intern flag is only released to a candidate who actually
// constructed the injection / reached the IAM metadata path. The salt is
// withheld from the client for these tasks, so the flag cannot be derived in
// devtools (the bypass for every other Stage-2 FLAG task).

export type VerifyOutcome =
  | { ok: true }
  | { ok: false; error: string; message: string };

// ── T3: SQLi UNION-extraction structure check ───────────────────────────────
// verify = { kind:"sqli", columns: 5, targetColumn:"iam_token", targetOrdinal: 3 }
export function verifySqli(
  payload: string,
  cfg: { columns?: number; targetColumn?: string; targetOrdinal?: number }
): VerifyOutcome {
  const columns = cfg.columns ?? 5;
  const targetColumn = (cfg.targetColumn ?? "iam_token").toLowerCase();
  const targetOrdinal = cfg.targetOrdinal ?? 3; // 1-based position in the SELECT list

  // Normalize: collapse whitespace incl. inline comments the candidate may use.
  const s = payload
    .replace(/\/\*.*?\*\//g, " ") // /* */ comments
    .replace(/--.*$/gm, " ") // -- line comments (incl. the trailing `-- -`)
    .replace(/#.*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Reject the seductive boolean auth-bypass BEFORE the UNION check, so a payload
  // that's ONLY `' OR '1'='1` returns the teaching error, not "not-a-union-select".
  const hasUnionSelect = /\bunion\b[\s/*]*\bselect\b/i.test(s);
  const looksLikeBoolBypass =
    /\bor\b\s+('?\d'?|'[^']*')\s*=\s*('?\d'?|'[^']*')/i.test(s) ||
    /\bor\b\s+'?1'?\s*=\s*'?1'?/i.test(s);
  if (!hasUnionSelect && looksLikeBoolBypass) {
    return {
      ok: false,
      error: "auth-bypass-not-extraction",
      message:
        "That's a boolean auth-bypass — it may log you in, but it does not EXTRACT the IAM token row. " +
        "Use a UNION SELECT that returns the token column.",
    };
  }
  if (!hasUnionSelect) {
    return {
      ok: false,
      error: "not-a-union-select",
      message: "No UNION SELECT found. Build a UNION-based extraction.",
    };
  }

  const lower = s.toLowerCase();
  // Isolate the SELECT list of the FIRST union branch: everything between
  // `union select` and the first ` from ` (or end).
  const m = lower.match(/\bunion\b[\s/*]*\bselect\b(.*?)(?:\bfrom\b|$)/);
  if (!m) {
    return { ok: false, error: "not-a-union-select", message: "Malformed UNION SELECT." };
  }
  const selectList = m[1];

  // Split the projection on top-level commas (no nested parens). The task's
  // expected answer is flat `1,2,iam_token,4,5`; nested function calls aren't
  // needed to extract one column, so a flat split is sufficient and we reject
  // anything whose top-level arity ≠ target.
  const cols = splitTopLevelCommas(selectList).map((c) => c.trim()).filter(Boolean);
  if (cols.length !== columns) {
    return {
      ok: false,
      error: "wrong-column-count",
      message: `UNION column count is ${cols.length}; the table returns ${columns}. Match it.`,
    };
  }

  // The target column must appear as its own projection item in the right ordinal
  // (1-based). We accept `iam_token`, `t.iam_token`, or backtick-quoted forms.
  const at = cols[targetOrdinal - 1] ?? "";
  const bare = at.replace(/`/g, "").replace(/^[a-z0-9_]+\./, "").trim();
  if (bare !== targetColumn) {
    return {
      ok: false,
      error: "target-column-misplaced",
      message: `Column ${targetOrdinal} of your SELECT must be \`${targetColumn}\`.`,
    };
  }
  return { ok: true };
}

function splitTopLevelCommas(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

// ── T6: SSRF — reach the IAM credentials path on the metadata host ──────────
// verify = { kind:"ssrf", metadataIp:"169.254.169.254",
//            iamPath:"/latest/meta-data/iam/security-credentials/" }
export function verifySsrf(
  payload: string,
  cfg: { metadataIp?: string; iamPath?: string }
): VerifyOutcome {
  const META = cfg.metadataIp ?? "169.254.169.254";
  const IAM = cfg.iamPath ?? "/latest/meta-data/iam/security-credentials/";

  let u: URL;
  try {
    u = new URL(payload.trim());
  } catch {
    return { ok: false, error: "malformed-url", message: "Not a valid URL." };
  }

  // Reject userinfo trickery (http://169.254.169.254@evil / http://evil@169...).
  // `new URL` puts the part before '@' in username/password and the REAL host
  // after it — so url.username being set at all is the classic SSRF allow-list
  // bypass attempt. We only accept it if the *actual* host normalizes to META.
  const hadUserinfo = u.username !== "" || u.password !== "";

  const normalized = normalizeHostToIpv4(u.hostname); // strips [], ::ffff:, decimal, octal, hex
  const isMeta = normalized === META;

  if (!isMeta) {
    // A bypass-looking encoding (userinfo, IPv6-mapped, decimal/octal) that did
    // NOT normalize to the metadata IP → the specific teaching error. A host
    // that genuinely normalizes to META is a real working bypass and PASSES
    // (Turn 7 lock): bypass-didnt-normalize is reserved for forms whose real
    // host is NOT the metadata IP.
    if (hadUserinfo || /^\[|:|^0x|^\d{8,}$/.test(u.hostname) || /^0\d/.test(u.hostname)) {
      return {
        ok: false,
        error: "bypass-didnt-normalize",
        message:
          "That encoding doesn't resolve to the metadata host. Use the canonical " +
          `${META} (or an encoding that genuinely normalizes to it).`,
      };
    }
    return { ok: false, error: "wrong-host", message: `Host is not the metadata service (${META}).` };
  }

  // Host IS the metadata IP (possibly via a legit normalizing encoding). Now the
  // path must reach IAM creds, not just /latest/meta-data/ inventory.
  const path = u.pathname;
  if (!path.startsWith(IAM)) {
    return {
      ok: false,
      error: "metadata-but-not-iam",
      message: "You reached the metadata service but not the IAM credentials path. Keep going.",
    };
  }
  const role = path.slice(IAM.length).split("/").filter(Boolean)[0] ?? "";
  if (!role) {
    return {
      ok: false,
      error: "metadata-but-not-iam",
      message: "IAM path reached, but no role name. Append the role to read its credentials.",
    };
  }
  return { ok: true };
}

// Normalize a URL hostname to dotted-quad IPv4 if (and only if) it encodes one.
// Handles: [::ffff:169.254.169.254] and ::ffff:a9fe:a9fe (IPv6-mapped),
// decimal (2852039166), octal (0250.0376.0250.0376), hex (0xA9FEA9FE).
// Returns "" if it can't be reduced to an IPv4 literal (e.g. a real domain).
function normalizeHostToIpv4(host: string): string {
  let h = host.trim().toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1); // strip IPv6 brackets

  // IPv4-mapped IPv6: ::ffff:169.254.169.254  or ::ffff:a9fe:a9fe
  const mapped = h.match(/::ffff:(.+)$/);
  if (mapped) {
    const tail = mapped[1];
    if (/^\d+\.\d+\.\d+\.\d+$/.test(tail)) return tail; // already dotted
    const hx = tail.split(":"); // a9fe:a9fe
    if (hx.length === 2 && hx.every((p) => /^[0-9a-f]{1,4}$/.test(p))) {
      const n = (parseInt(hx[0], 16) << 16) | parseInt(hx[1], 16);
      return ipv4FromInt(n >>> 0);
    }
  }
  // Plain dotted quad, but each octet may be decimal/octal/hex.
  const parts = h.split(".");
  if (parts.length === 4) {
    const octs = parts.map(parseOctet);
    if (octs.every((o) => o >= 0 && o <= 255)) return octs.join(".");
    return "";
  }
  // Single 32-bit integer: decimal (2852039166) or hex (0xA9FEA9FE).
  if (parts.length === 1) {
    const n = parseOctet(parts[0]);
    if (n >= 0 && n <= 0xffffffff && /^(0x[0-9a-f]+|0[0-7]*|\d+)$/.test(parts[0])) {
      return ipv4FromInt(n >>> 0);
    }
  }
  return "";
}

function parseOctet(p: string): number {
  if (/^0x[0-9a-f]+$/.test(p)) return parseInt(p, 16);
  if (/^0[0-7]+$/.test(p)) return parseInt(p, 8);
  if (/^\d+$/.test(p)) return parseInt(p, 10);
  return -1;
}

function ipv4FromInt(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}
