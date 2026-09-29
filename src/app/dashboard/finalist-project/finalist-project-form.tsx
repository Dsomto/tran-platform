"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Film, Link2, Presentation, Rocket, ShieldCheck } from "lucide-react";
import { Topbar } from "@/components/dashboard/topbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Initial = {
  projectTitle: string;
  projectSummary: string;
  projectUrl: string;
  videoUrl: string;
  publicationConsent: boolean;
  submittedAt: string;
} | null;

const TRACK_LABEL: Record<string, string> = {
  SOC_ANALYSIS: "SOC Analysis",
  ETHICAL_HACKING: "Ethical Hacking",
  GRC: "GRC",
};

export function FinalistProjectForm({
  firstName,
  lastName,
  avatarUrl,
  track,
  initial,
}: {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  track: string;
  initial: Initial;
}) {
  const [projectTitle, setProjectTitle] = useState(initial?.projectTitle ?? "");
  const [projectSummary, setProjectSummary] = useState(initial?.projectSummary ?? "");
  const [projectUrl, setProjectUrl] = useState(initial?.projectUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [publicationConsent, setPublicationConsent] = useState(initial?.publicationConsent ?? false);
  const [submittedAt, setSubmittedAt] = useState(initial?.submittedAt ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submittedLabel = useMemo(() => {
    if (!submittedAt) return null;
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(submittedAt));
  }, [submittedAt]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch("/api/finalist-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectTitle, projectSummary, projectUrl, videoUrl, publicationConsent }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not save your submission.");
        return;
      }
      setSubmittedAt(result.submission.submittedAt);
      setSuccess(true);
    } catch {
      setError("Network error. Your entries are still here; please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar
        title="Stage 9B Final Project"
        subtitle="Submit the project and two-minute showcase links"
        firstName={firstName}
        lastName={lastName}
        avatarUrl={avatarUrl}
      />

      <div className="flex-1 overflow-y-auto bg-background">
        <section className="border-b border-border bg-[#071A2F] text-white">
          <div className="mx-auto grid max-w-6xl gap-7 px-6 py-9 md:grid-cols-[1.45fr_0.75fr] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-300">Final ten · {TRACK_LABEL[track] ?? track}</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-4xl">Build the work. Explain it simply. Defend every decision.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Your project may come from any area of cybersecurity. The judges need a working result, clear evidence, a meaningful problem, and an explanation that survives questions.</p>
            </div>
            <div className="border-l-4 border-emerald-400 bg-white/8 px-5 py-4">
              <p className="text-xs font-bold uppercase text-emerald-300">Public showcase</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">Your approved video may be published on UBI&apos;s YouTube channel and included in the public voting showcase.</p>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={submit} className="space-y-6">
            {submittedLabel && (
              <div className="flex items-start gap-3 border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div><p className="text-sm font-bold">Submission received</p><p className="mt-0.5 text-xs">Last submitted {submittedLabel} WAT. Saving again replaces the links and summary on your finalist record.</p></div>
              </div>
            )}

            <div className="border-b border-border pb-6">
              <div className="mb-5 flex items-center gap-3"><Rocket className="h-5 w-5 text-blue" /><div><h2 className="font-semibold text-foreground">Project identity</h2><p className="text-xs text-muted">Tell the judges what they are about to open.</p></div></div>
              <div className="space-y-5">
                <Input id="projectTitle" label="Project title" maxLength={120} required value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="A clear name for the project" />
                <div>
                  <Textarea id="projectSummary" label="Plain-English project summary" minLength={80} maxLength={1200} required value={projectSummary} onChange={(event) => setProjectSummary(event.target.value)} className="min-h-36" placeholder="What problem does it solve, who benefits, what did you build, and what changed because it exists? Avoid unexplained technical jargon." />
                  <p className="mt-1.5 text-right text-xs text-muted">{projectSummary.length}/1,200</p>
                </div>
              </div>
            </div>

            <div className="border-b border-border pb-6">
              <div className="mb-5 flex items-center gap-3"><Link2 className="h-5 w-5 text-blue" /><div><h2 className="font-semibold text-foreground">Project access</h2><p className="text-xs text-muted">GitHub, a live website, a shared folder, or another public project URL.</p></div></div>
              <Input id="projectUrl" type="url" label="Main project or demonstration URL" required value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} placeholder="https://github.com/you/project" />
              {projectUrl && <a href={projectUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline">Test this link <ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>

            <div className="border-b border-border pb-6">
              <div className="mb-5 flex items-center gap-3"><Film className="h-5 w-5 text-blue" /><div><h2 className="font-semibold text-foreground">Two-minute video</h2><p className="text-xs text-muted">Upload the final video file to Google Drive and share its view link.</p></div></div>
              <Input id="videoUrl" type="url" label="Google Drive video URL" required value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://drive.google.com/file/d/.../view" />
              {videoUrl && <a href={videoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline">Test this link <ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>

            <label className="flex cursor-pointer items-start gap-3 border border-border bg-surface px-4 py-4">
              <input type="checkbox" checked={publicationConsent} onChange={(event) => setPublicationConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-blue" />
              <span className="text-sm leading-6 text-foreground">I confirm that I created or have permission to share the submitted material. I understand that UBI may publish the video on its YouTube channel and include the project in a public showcase and voting session.</span>
            </label>

            {error && <div className="border-l-4 border-danger bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
            {success && <div className="border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">Your finalist project links were saved successfully.</div>}

            <Button type="submit" size="lg" isLoading={saving} disabled={!publicationConsent} className="w-full sm:w-auto">
              <Presentation className="h-4 w-4" />
              {submittedAt ? "Update finalist submission" : "Submit finalist project"}
            </Button>
          </form>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="border border-border bg-surface p-5">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><Film className="h-4 w-4 text-blue" /> Video checklist</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                <li><strong className="text-foreground">Maximum two minutes.</strong> Edit before uploading.</li>
                <li>Explain the problem, the people affected, what you built, and the result.</li>
                <li>Use plain language. The public should understand it without a cybersecurity background.</li>
                <li>Set Drive access to <strong className="text-foreground">Anyone with the link can view</strong>.</li>
                <li>Keep unrelated tabs, notifications, credentials, API keys, and private information out of the recording.</li>
              </ul>
            </div>
            <div className="border border-border bg-surface p-5">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Before submitting</h2>
              <p className="mt-3 text-sm leading-6 text-muted">Open both links in a private browser window. If the judges must request access, sign in, install unexplained software, or ask which file to open, the submission is not ready.</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
