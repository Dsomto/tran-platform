"use client";

import { Bell, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface TopbarProps {
  title: string;
  subtitle?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export function Topbar({ title, subtitle, firstName, lastName, avatarUrl }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
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

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        {/* Profile */}
        <Avatar
          src={avatarUrl}
          firstName={firstName}
          lastName={lastName}
          size="sm"
        />
      </div>
    </header>
  );
}
