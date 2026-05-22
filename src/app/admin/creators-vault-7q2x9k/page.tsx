import { Download, FileText, Lock } from "lucide-react";
import { STAFF_DOCS } from "@/content/staff-docs";
import { renderMarkdown } from "@/lib/markdown";

// Creators' vault — the grader rubric + PM SOP, hosted behind a deliberately
// cryptic path. The /admin layout already restricts this to logged-in staff
// (admin, super-admin, grader), so access requires a login; the obscure URL is
// the extra layer. Documents are viewable here and downloadable as .md / .html.
export const dynamic = "force-dynamic";

export default function CreatorsVaultPage() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Creators&apos; Vault</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Internal grading and coordination documents. Visible only to logged-in staff.
          Download and share with graders and program managers as needed.
        </p>
      </header>

      <div className="space-y-10">
        {STAFF_DOCS.map((doc) => (
          <section key={doc.slug} className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-blue shrink-0" />
                <h2 className="text-base font-semibold text-foreground truncate">{doc.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/admin/staff-docs/${doc.slug}?format=html`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue text-white hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download (.html)
                </a>
                <a
                  href={`/api/admin/staff-docs/${doc.slug}?format=md`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted/50"
                >
                  <Download className="h-3.5 w-3.5" />
                  .md
                </a>
              </div>
            </div>
            <div
              className="staff-doc p-5 md:p-8 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.markdown) }}
            />
          </section>
        ))}
      </div>

      <style>{`
        .staff-doc h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.75rem; }
        .staff-doc h2 { font-size: 1.2rem; font-weight: 700; margin: 1.75rem 0 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border, #e2e8f0); }
        .staff-doc h3 { font-size: 1rem; font-weight: 600; margin: 1.25rem 0 0.4rem; }
        .staff-doc p { margin: 0.5rem 0; line-height: 1.65; font-size: 0.925rem; }
        .staff-doc ul, .staff-doc ol { margin: 0.5rem 0 0.5rem 1.25rem; line-height: 1.65; font-size: 0.925rem; }
        .staff-doc li { margin: 0.2rem 0; }
        .staff-doc table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; font-size: 0.85rem; }
        .staff-doc th, .staff-doc td { border: 1px solid #e2e8f0; padding: 0.5rem 0.6rem; text-align: left; vertical-align: top; }
        .staff-doc th { background: #f8fafc; font-weight: 600; }
        .staff-doc code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 0.8rem; }
        .staff-doc hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
        .staff-doc em { color: #64748b; }
      `}</style>
    </div>
  );
}
