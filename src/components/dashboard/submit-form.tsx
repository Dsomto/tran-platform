"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  assignmentId: string;
  existingContent?: string;
  existingAttachmentUrl?: string | null;
  alreadySubmitted: boolean;
  locked: boolean;
};

export function SubmitForm({
  assignmentId,
  existingContent = "",
  existingAttachmentUrl = "",
  alreadySubmitted,
  locked,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(existingContent);
  const [attachmentUrl, setAttachmentUrl] = useState(existingAttachmentUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (locked) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          content: content.trim(),
          attachmentUrl: attachmentUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <div className="pl-8 mt-2">
        <Button size="sm" onClick={() => setOpen(true)}>
          {alreadySubmitted ? "Update submission" : "Submit work"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pl-8 mt-3 space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">
          Your submission
        </label>
        <textarea
          required
          minLength={1}
          maxLength={20000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Paste your write-up, findings, or link summary here…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">
          Attachment URL (Google Drive, GitHub, etc.) — optional
        </label>
        <input
          type="url"
          pattern="https?://.*"
          value={attachmentUrl}
          onChange={(e) => setAttachmentUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={submitting}>
          {alreadySubmitted ? "Update" : "Submit"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
