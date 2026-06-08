"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Search, UserCircle2 } from "lucide-react";

interface Intern {
  id: string;
  name: string;
  email: string;
  stage: string;
  track: string;
}

const STAGE_LABEL: Record<string, string> = {
  STAGE_0: "Stage 0",
  STAGE_1: "Stage 1",
  STAGE_2: "Stage 2",
  STAGE_3: "Stage 3",
  STAGE_4: "Stage 4",
};

export function ImpersonatePicker({ interns }: { interns: Intern[] }) {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return interns.filter((i) => {
      if (stage !== "all" && i.stage !== stage) return false;
      if (query && !i.name.toLowerCase().includes(query) && !i.email.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [interns, q, stage]);

  async function impersonate(internId: string) {
    if (
      !confirm(
        "View the dashboard as this intern?\n\nYou'll be signed in with their session. A banner will stay at the top of the page to remind you and to switch back."
      )
    ) {
      return;
    }
    setBusyId(internId);
    setError(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not impersonate");
        setBusyId(null);
        return;
      }
      // Now logged in as the intern; jump to /dashboard.
      router.push("/dashboard");
    } catch {
      setError("Network error");
      setBusyId(null);
    }
  }

  const stages = Array.from(new Set(interns.map((i) => i.stage))).sort();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Eye className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">View as intern</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Pick an intern to sign in as their account. You'll see the dashboard,
          assignments, and any stage UI exactly as they see it — same design, same
          gates, same content. Every start and stop is audited.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 p-2 border border-border rounded-lg text-sm bg-white"
          />
        </div>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="p-2 border border-border rounded-lg text-sm bg-white"
        >
          <option value="all">All stages</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s] ?? s}
            </option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground">
          {filtered.length} of {interns.length}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <ul className="divide-y divide-border max-h-[28rem] overflow-y-auto">
          {filtered.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
              <UserCircle2 className="h-7 w-7 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {i.name}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground truncate">
                  {i.email}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue/10 text-blue border border-blue/30 font-mono">
                {STAGE_LABEL[i.stage] ?? i.stage}
              </span>
              <button
                onClick={() => impersonate(i.id)}
                disabled={busyId !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-white hover:bg-muted/40 disabled:opacity-50"
              >
                {busyId === i.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                View as
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No interns match.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
