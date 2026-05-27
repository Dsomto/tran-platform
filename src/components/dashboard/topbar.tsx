"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "./notification-bell";

interface TopbarProps {
  title: string;
  subtitle?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export function Topbar({ title, subtitle, firstName, lastName, avatarUrl }: TopbarProps) {
  const [spin, setSpin] = useState(false);
  const [night, setNight] = useState(false);
  // Egg #4: between 00:00–00:59 the greeting line becomes "Night shift active."
  useEffect(() => setNight(new Date().getHours() === 0), []);
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {night ? (
          <p className="text-xs text-blue">Night shift active.</p>
        ) : subtitle ? (
          <p className="text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-background rounded-xl px-3 py-2 border border-border">
          <Search className="w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none w-40"
          />
        </div>

        {/* Notifications — real dropdown of the latest announcements */}
        <NotificationBell />

        {/* Profile — double-click for a single spin (egg #16) */}
        <span
          onDoubleClick={() => {
            setSpin(true);
            setTimeout(() => setSpin(false), 700);
          }}
          className={`inline-block cursor-pointer ${spin ? "animate-[spin_700ms_linear_1]" : ""}`}
        >
          <Avatar src={avatarUrl} firstName={firstName} lastName={lastName} size="sm" />
        </span>
      </div>
    </header>
  );
}
