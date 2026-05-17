// Branded shell for newsletter / broadcast emails.
//
// Shared between the send route and the in-app preview so what the admin
// previews is exactly what the recipient receives.
//
// Two authoring helpers the admin can use in the subject and message:
//   - {First name}  — replaced with each recipient's real first name.
//   - [words](https://link) — turns the words into a clickable link.
//     Bare http(s) URLs are linked automatically too.

// Matches {First name} in any casing / spacing — {first name}, {FirstName}, etc.
const FIRST_NAME_TOKEN = /\{\s*first\s*name\s*\}/gi;

/**
 * Fill in the {First name} merge field. Used for both subject and message.
 * Falls back to a friendly neutral when the name is missing, so a blank
 * record never produces "Hi ,".
 */
export function personalizeText(text: string, firstName: string): string {
  const name = (firstName || "").trim() || "there";
  return text.replace(FIRST_NAME_TOKEN, name);
}

/** Pull a usable first name out of a stored full name. */
export function firstNameOf(fullName: string | null | undefined): string {
  return (fullName || "").trim().split(/\s+/)[0] || "there";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// [text](url) link, or a bare http(s) URL. Run on already-escaped text.
// Only http/https is matched — anything else stays plain text, so no
// javascript: URIs can slip into an href.
const LINK_PATTERN =
  /\[([^\]]+)\]\((https?:\/\/[^\s)"'<>]+)\)|(https?:\/\/[^\s)"'<>]+)/g;

function anchor(url: string, label: string): string {
  return `<a href="${url}" style="color:#2563EB;text-decoration:underline;" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function linkify(escaped: string): string {
  return escaped.replace(LINK_PATTERN, (_m, mdText, mdUrl, bareUrl) => {
    if (mdUrl) {
      // [words](https://link) — the words become the link.
      return anchor(mdUrl, mdText);
    }
    // Bare URL — trim trailing sentence punctuation so "see https://x.com."
    // doesn't swallow the full stop into the link.
    const trail = bareUrl.match(/[.,;:!?]+$/)?.[0] ?? "";
    const url = trail ? bareUrl.slice(0, -trail.length) : bareUrl;
    return anchor(url, url) + trail;
  });
}

export function renderBroadcastEmail({ message }: { message: string }): string {
  const safe = linkify(escapeHtml(message)).replace(/\n/g, "<br/>");
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#2563EB,#0891B2);padding:32px;border-radius:16px;text-align:center;color:white;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;">UBI</h1>
        <p style="margin:0;font-size:13px;opacity:0.9;">Ubuntu Bridge Initiative</p>
      </div>
      <div style="background:white;padding:32px;border-radius:16px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="color:#334155;line-height:1.7;font-size:14px;">${safe}</div>
      </div>
      <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:24px;">
        Ubuntu Bridge Initiative · ubuntubridgeinitiatives.org
      </p>
    </div>
  `;
}
