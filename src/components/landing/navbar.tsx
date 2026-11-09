"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Menu, X, ArrowLeft, ArrowRight, LogOut } from "lucide-react";

// Kept deliberately short; stages, FAQ and employers live in the footer.
const navLinks: [string, string][] = [
  ["Programme", "/#program"],
  ["Tracks", "/#tracks"],
  ["Volunteer", "/volunteer"],
];

type AuthState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "authed"; role: string; firstName: string };

// When logged in, "home" means your dashboard, not the landing page.
// Admin/super-admin go to the ops area; everyone else to /dashboard.
function homeForRole(role: string): string {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "GRADER") return "/admin/reports";
  return "/dashboard";
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch auth state once on mount. Silent 401 → anon.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (d?.user?.id) {
          setAuth({
            status: "authed",
            role: d.user.role,
            firstName: d.user.firstName ?? "",
          });
        } else {
          setAuth({ status: "anon" });
        }
      })
      .catch(() => !cancelled && setAuth({ status: "anon" }));
    return () => {
      cancelled = true;
    };
  }, [pathname]); // refresh on navigation so logout elsewhere reflects

  const authedHome = auth.status === "authed" ? homeForRole(auth.role) : "/";
  const logoHref = auth.status === "authed" ? authedHome : "/";
  const backFallback = auth.status === "authed" ? authedHome : "/";

  function handleBack() {
    // Only use history.back() when we're sure there's app history behind us —
    // otherwise a fresh tab on /tracks/x would jump to whatever was there before.
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push(backFallback);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setAuth({ status: "anon" });
    router.push("/");
    router.refresh();
  }

  return (
    <header role="banner" className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav
        aria-label="Main navigation"
        className={`mx-auto max-w-[80rem] rounded-full border text-foreground backdrop-blur-xl transition-colors duration-500 ${
          scrolled || isOpen ? "border-border bg-background/85 shadow-[0_20px_50px_-24px_rgba(15,23,42,.45)]" : "border-transparent bg-transparent"
        } ${isOpen ? "rounded-3xl" : ""}`}
      >
        <div className="relative flex h-14 items-center justify-between pl-4 pr-2 sm:pl-5">
          <div className="flex items-center gap-2">
            {!isHome && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Link
              href={logoHref}
              aria-label={auth.status === "authed" ? "Go to dashboard" : "UBI homepage"}
              className="flex items-center gap-2"
            >
              <LogoMark size={22} />
              <span className="text-[15px] font-semibold tracking-tight">UBI</span>
            </Link>
          </div>

          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex" role="list">
            {navLinks.map(([label, href]) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      active ? "bg-surface-hover text-foreground" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:block"><ThemeToggle /></span>
            {auth.status === "authed" ? (
              <>
                <Link
                  href={authedHome}
                  className="hidden px-3 py-2 text-sm text-muted transition-colors hover:text-foreground md:block"
                >
                  {auth.firstName ? `Hi, ${auth.firstName}` : "Dashboard"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden h-10 items-center gap-1.5 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-signal hover:text-ink cursor-pointer md:inline-flex"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden px-3 py-2 text-sm text-muted transition-colors hover:text-foreground md:block"
                >
                  Log in
                </Link>
                <Link
                  href="/apply"
                  className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-signal hover:text-ink"
                >
                  Apply
                </Link>
              </>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-surface-hover md:hidden"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div id="mobile-menu" className="px-5 pb-5 md:hidden">
            <ul className="border-t border-border py-2" role="list">
              {navLinks.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between py-3.5 text-2xl font-medium tracking-tight text-foreground"
                  >
                    {label}
                    <ArrowRight className="h-5 w-5 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 border-t border-border pt-4">
              <ThemeToggle />
              {auth.status === "authed" ? (
                <>
                  <Link
                    href={authedHome}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-full border border-border py-3 text-center text-sm text-foreground"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex-1 rounded-full bg-foreground py-3 text-center text-sm font-medium text-background"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-full border border-border py-3 text-center text-sm text-foreground"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
