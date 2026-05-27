"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Users,
  MessageSquare,
  Video,
  LogOut,
  Settings,
  ChevronLeft,
  UserCheck,
  Megaphone,
  BarChart3,
  Award,
  FileText,
  Gavel,
  Heart,
  Activity,
  Shield,
  Mail,
  Send,
  TrendingUp,
  ClipboardList,
  Hourglass,
  Hash,
  UserPlus,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useState } from "react";

interface SidebarProps {
  role: "INTERN" | "GRADER" | "ADMIN" | "SUPER_ADMIN";
  userName: string;
}

const graderLinks = [
  { href: "/admin/reports", label: "Grading Queue", icon: Gavel },
];

const internLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/slack", label: "Join Slack", icon: Hash },
  { href: "/dashboard/assignments", label: "Assignments", icon: BookOpen },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/team", label: "My Team", icon: Users },
  { href: "/dashboard/meetings", label: "Meetings", icon: Video },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/dashboard/settings/security", label: "Security", icon: Shield },
];

const adminLinks = [
  { href: "/ops", label: "Operations", icon: Activity },
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/applicants", label: "Applicants", icon: UserCheck },
  { href: "/admin/applicants?tab=waitlisted", label: "Waitlist", icon: Hourglass },
  { href: "/admin/application-form", label: "Application Form", icon: ClipboardList },
  { href: "/admin/mailing", label: "Decision Emails", icon: Send },
  { href: "/admin/broadcast", label: "Newsletter", icon: Mail },
  { href: "/admin/interns", label: "Interns", icon: Users },
  { href: "/admin/provision", label: "Provision Graders", icon: UserPlus },
  { href: "/admin/teams", label: "Teams", icon: Award },
  { href: "/admin/assignments", label: "Assignments", icon: BookOpen },
  { href: "/admin/reports", label: "Grading Queue", icon: Gavel },
  { href: "/admin/stage-results", label: "Stage Results", icon: BarChart3 },
  { href: "/admin/scholarships", label: "Scholarships", icon: Heart },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/admin/insights", label: "Insights", icon: TrendingUp },
  { href: "/admin/emails", label: "Email Queue", icon: Mail },
];

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "";
  const [collapsed, setCollapsed] = useState(false);

  // Active-link test. Links carrying a ?tab= query (Recommended, Waitlist)
  // match only when that exact tab is open; the plain Applicants link stays
  // active for every other tab.
  function linkActive(href: string): boolean {
    const [p, q] = href.split("?");
    if (q) return pathname === p && `tab=${tab}` === q;
    if (p === "/admin/applicants")
      return pathname === p && tab !== "recommended" && tab !== "waitlisted";
    if (p === "/dashboard" || p === "/admin") return pathname === p;
    return pathname === p || pathname.startsWith(p);
  }

  // The Newsletter tab is super-admin only — a core admin never sees it.
  const links =
    role === "INTERN"
      ? internLinks
      : role === "GRADER"
      ? graderLinks
      : adminLinks.filter(
          (l) => l.href !== "/admin/broadcast" || role === "SUPER_ADMIN"
        );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-white border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={28} className="shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold text-foreground tracking-tight">
              <span className="text-blue">UBI</span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const isActive = linkActive(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue text-white shadow-lg shadow-blue/20"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              )}
              title={collapsed ? link.label : undefined}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3 space-y-1 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover w-full transition-colors cursor-pointer"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 shrink-0 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && "Collapse"}
        </button>

        <Link
          href={role === "INTERN" ? "/dashboard/settings" : "/admin/settings"}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover"
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && "Settings"}
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/5 w-full transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && "Log Out"}
        </button>

        {!collapsed && (
          <div className="px-3 py-2 mt-2">
            <p className="text-xs text-muted truncate">{userName}</p>
            <p className="text-xs font-medium text-blue capitalize">
              {role.toLowerCase().replace("_", " ")}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
