"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Megaphone, Pin } from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  createdAt: string;
  isPinned: boolean;
  author?: { firstName: string; lastName: string } | null;
}

// Replaces the dead-icon notification button in the topbar. Fetches the
// latest announcements, shows an "unread" dot for anything newer than the
// last time the user opened the dropdown, and lists the most recent items
// with a link to the full Announcements page.
//
// Read-state is tracked client-side in localStorage (an ISO timestamp of
// the last open). We don't need a server-side AnnouncementRead table for
// the cohort scale, and this avoids a DB write on every page load.
const LAST_SEEN_KEY = "ubi.lastSeenAnnouncementAt";

export function NotificationBell() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>(() => {
    if (typeof window === "undefined") return new Date(0).toISOString();
    return localStorage.getItem(LAST_SEEN_KEY) ?? new Date(0).toISOString();
  });
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Pull recent announcements once on mount; small payload, no need to refetch
  // on every dropdown open.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements?limit=10")
      .then((r) => (r.ok ? r.json() : { announcements: [] }))
      .then((data) => {
        if (!cancelled) setItems(data.announcements ?? []);
      })
      .catch(() => {
        /* ignore — bell stays empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function toggle() {
    if (!open) {
      // Mark everything currently visible as seen the moment we open.
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SEEN_KEY, now);
      setLastSeen(now);
    }
    setOpen((v) => !v);
  }

  const unreadCount = items.filter((a) => a.createdAt > lastSeen).length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={toggle}
        aria-label={unreadCount > 0 ? `${unreadCount} new announcements` : "Notifications"}
        className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5 text-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 inline-flex items-center justify-center text-[10px] font-semibold leading-none bg-danger text-white rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface border border-border rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue dark:text-blue-400" />
              <span className="text-sm font-semibold text-foreground">Announcements</span>
            </div>
            <Link
              href="/dashboard/announcements"
              onClick={() => setOpen(false)}
              className="text-xs text-blue dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No announcements yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((a) => {
                const isUnread = a.createdAt > lastSeen;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/announcements#${a.id}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-3 hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-2">
                        {a.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-blue dark:text-blue-400 mt-1 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${isUnread ? "font-semibold text-foreground" : "text-foreground/85"}`}>
                              {a.title}
                            </p>
                            {isUnread && <span className="h-1.5 w-1.5 bg-danger rounded-full shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(a.createdAt).toLocaleString()}
                            {a.author && ` · ${a.author.firstName} ${a.author.lastName}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
