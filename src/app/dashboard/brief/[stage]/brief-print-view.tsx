"use client";

import { useEffect } from "react";
import type { StageBrief } from "@/lib/stage-briefs";

interface Props {
  brief: StageBrief;
  internCode: string;
  issuedAt: string;
}

export function BriefPrintView({ brief, internCode, issuedAt }: Props) {
  // Auto-fire the browser's print dialog after layout settles.
  useEffect(() => {
    const id = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(id);
  }, []);

  const issued = new Date(issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Print-only stylesheet — clean A4-style layout with brand bar. */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 18mm 16mm;
        }
        @media print {
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .brief-print-toolbar { display: none !important; }
          a {
            color: #2563eb;
            text-decoration: none;
          }
          a[href^="http"]::after {
            content: " (" attr(href) ")";
            font-size: 9pt;
            color: #64748b;
          }
        }
        .brief-doc {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          line-height: 1.55;
          color: #0f172a;
        }
        .brief-doc h1 { font-size: 28pt; line-height: 1.1; margin: 0 0 8pt; }
        .brief-doc h2 { font-size: 14pt; margin: 28pt 0 8pt; color: #2563eb; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 700; }
        .brief-doc h3 { font-size: 12pt; margin: 16pt 0 4pt; color: #0f172a; }
        .brief-doc p { font-size: 11pt; margin: 0 0 8pt; }
        .brief-doc ol, .brief-doc ul { margin: 0 0 8pt; padding-left: 18pt; }
        .brief-doc li { font-size: 11pt; margin-bottom: 4pt; }
        .brief-doc .pill {
          display: inline-block; font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase;
          background: #2563eb; color: white; padding: 2pt 8pt; border-radius: 999pt; font-weight: 700;
        }
        .brief-doc .meta-row { display: flex; gap: 12pt; align-items: center; flex-wrap: wrap; margin-bottom: 18pt; padding-bottom: 12pt; border-bottom: 1pt solid #cbd5e1; font-size: 9pt; color: #64748b; }
        .brief-doc .accent-bar { width: 40pt; height: 3pt; background: #2563eb; margin: 12pt 0 18pt; }
        .brief-doc .task-card { border: 1pt solid #cbd5e1; border-left: 3pt solid #2563eb; padding: 8pt 12pt; margin-bottom: 8pt; border-radius: 4pt; page-break-inside: avoid; }
        .brief-doc .task-card .title { font-weight: 700; font-size: 11pt; }
        .brief-doc .task-card .deliverable { font-size: 9.5pt; color: #2563eb; font-weight: 600; margin-top: 4pt; }
        .brief-doc .task-card .alternate { font-size: 9.5pt; color: #475569; font-style: italic; margin-top: 3pt; }
        .brief-doc .drive-card { background: #2563eb; color: white; padding: 14pt; border-radius: 6pt; margin: 12pt 0; }
        .brief-doc .drive-card .label { font-size: 9pt; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700; }
        .brief-doc .drive-card .url { font-size: 10pt; font-family: monospace; word-break: break-all; margin-top: 4pt; display: block; color: white; text-decoration: underline; }
        .brief-doc .resource { padding: 6pt 0; border-bottom: 0.5pt solid #e2e8f0; font-size: 10pt; }
        .brief-doc .resource:last-child { border-bottom: 0; }
        .brief-doc .resource .kind { display: inline-block; min-width: 60pt; font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: #2563eb; font-weight: 700; }
        .brief-doc footer { margin-top: 32pt; padding-top: 12pt; border-top: 0.5pt solid #cbd5e1; font-size: 8.5pt; color: #94a3b8; text-align: center; }
      `}</style>

      {/* Toolbar — only visible on screen, hidden in print */}
      <div className="brief-print-toolbar" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "#0f172a",
        color: "white",
        padding: "10px 20px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          The print dialog should open automatically. Click <strong>Save as PDF</strong> in the destination dropdown.
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              background: "#2563eb",
              color: "white",
              border: 0,
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Open print dialog
          </button>
          <button
            onClick={() => window.close()}
            style={{
              background: "transparent",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Close tab
          </button>
        </div>
      </div>

      {/* The document */}
      <div
        className="brief-doc"
        style={{
          maxWidth: 760,
          margin: "60px auto 60px",
          padding: "32px 40px",
          background: "white",
          boxShadow: "0 2px 30px rgba(0,0,0,0.06)",
        }}
      >
        <header className="meta-row">
          <span className="pill">Capstone brief</span>
          <span>·</span>
          <span>{brief.label}</span>
          <span style={{ marginLeft: "auto" }}>Issued {issued} · {internCode}</span>
        </header>

        <h1>{brief.subtitle}</h1>
        <div className="accent-bar" />

        <h2>The scenario</h2>
        {brief.missionBrief.map((p, i) => (
          <p key={i}>{p}</p>
        ))}

        <h2>You will be graded on</h2>
        <ol>
          {brief.sections.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>Practical activities</h2>
        {brief.practicalTasks.map((task, idx) => (
          <div key={task.id} className="task-card">
            <div className="title">{idx + 1}. {task.title}</div>
            <p style={{ fontSize: 10.5, marginTop: 4 }}>{task.description}</p>
            <div className="deliverable">Deliverable: {task.deliverable}</div>
            {task.alternate && (
              <div className="alternate">Alternate path: {task.alternate}</div>
            )}
          </div>
        ))}

        <h2>Resources</h2>
        <div className="drive-card">
          <div className="label">Open your stage's Drive folder</div>
          <a className="url" href={brief.resourcesDriveUrl} target="_blank" rel="noopener noreferrer">
            {brief.resourcesDriveUrl}
          </a>
        </div>

        {brief.resources.length > 0 && (
          <>
            <h3>Tools and readings</h3>
            <div>
              {brief.resources.map((r) => (
                <div key={r.href} className="resource">
                  <span className="kind">{r.kind}</span>
                  <a href={r.href} target="_blank" rel="noopener noreferrer">{r.label}</a>
                  {r.description && <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>{r.description}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        <h2>How to submit</h2>
        <p>
          Put every deliverable into one shared folder on Google Drive,
          OneDrive, or Dropbox. On the stage&apos;s submission page in the
          UBI dashboard, paste the folder link, write a short executive
          summary, and submit.
        </p>

        <footer>
          Ubuntu Bridge Initiative · {brief.label} capstone brief · Confidential to the participant
        </footer>
      </div>
    </>
  );
}
