"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, X } from "lucide-react";

export function ImpersonationBanner({
  internName,
  internEmail,
}: {
  internName: string;
  internEmail: string;
}) {
  const [stopping, setStopping] = useState(false);
  const router = useRouter();

  async function stop() {
    setStopping(true);
    try {
      const res = await fetch("/api/admin/impersonate/stop", { method: "POST" });
      if (res.ok) {
        // Drop back to the admin home — fresh session is already in cookies.
        router.push("/admin");
        router.refresh();
      } else {
        setStopping(false);
      }
    } catch {
      setStopping(false);
    }
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap sticky top-0 z-50 shadow">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="h-4 w-4" />
        <span className="font-semibold">Viewing as {internName}</span>
        <span className="font-mono text-xs text-amber-900/80 hidden sm:inline">
          ({internEmail})
        </span>
      </div>
      <button
        onClick={stop}
        disabled={stopping}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-950 text-amber-50 hover:bg-amber-900 disabled:opacity-50"
      >
        {stopping ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
        Return to admin
      </button>
    </div>
  );
}
