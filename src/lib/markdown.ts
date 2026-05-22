// Minimal, dependency-free Markdown → HTML renderer. It only needs to cover
// the subset used by the staff docs in src/content/staff-docs.ts: headings,
// pipe tables, ordered/unordered lists, bold/italic/code, horizontal rules,
// and paragraphs. Input is HTML-escaped first, so it is safe to inject the
// output with dangerouslySetInnerHTML for our own controlled content.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/(^|[\s(])_([^_]+)_/g, "$1<em>$2</em>");
}

function renderTable(rows: string[]): string {
  const cells = (line: string) =>
    line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const header = cells(rows[0]);
  const body = rows.slice(2); // row 1 is the |---| separator
  const head = `<tr>${header.map((c) => `<th>${inline(c)}</th>`).join("")}</tr>`;
  const trs = body
    .map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead>${head}</thead><tbody>${trs}</tbody></table>`;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      out.push("<hr/>");
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Table (consecutive lines beginning with "|")
    if (line.trim().startsWith("|")) {
      const block: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        block.push(lines[i].trim());
        i++;
      }
      out.push(renderTable(block));
      continue;
    }

    // Unordered list
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*-\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Paragraph
    out.push(`<p>${inline(line)}</p>`);
    i++;
  }

  return out.join("\n");
}

// A self-contained, printable HTML document for download.
export function markdownToHtmlDocument(title: string, md: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<style>
  body { font: 15px/1.65 -apple-system, "Segoe UI", Roboto, sans-serif; color: #0f172a; max-width: 820px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 26px; } h2 { font-size: 20px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  h3 { font-size: 16px; } code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 14px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f8fafc; } hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
  em { color: #475569; } @media print { body { margin: 0; } }
</style>
</head>
<body>
${renderMarkdown(md)}
</body>
</html>`;
}
