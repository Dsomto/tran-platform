"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { Menu, X, ArrowLeft, LogOut } from "lucide-react";

const navLinks = [
  ["Tracks", "/tracks"],
  ["For Employers", "/hire"],
  ["Play", "/play"],
  ["Data Scholarship", "/apply/data-scholarship"],
] as const;

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
  const backHref = auth.status === "authed" ? authedHome : "/";

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
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong" : "bg-transparent"
      }`}
    >
      <nav aria-label="Main navigation" className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {!isHome && (
              <Link
                href={backHref}
                aria-label={auth.status === "authed" ? "Back to dashboard" : "Back to home"}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-border/60 bg-white/60 backdrop-blur hover:bg-white text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <Link
              href={logoHref}
              aria-label={auth.status === "authed" ? "Go to dashboard" : "UBI homepage"}
              className="flex items-center gap-2.5"
            >
              <LogoMark size={28} />
              <span className="text-base font-semibold tracking-tight text-foreground">
                UBI
              </span>
            </Link>
          </div>

          <ul className="hidden md:flex items-center gap-8" role="list">
            {navLinks.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-[13px] font-medium text-muted hover:text-foreground transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            {auth.status === "authed" ? (
              <>
                <Link
                  href={authedHome}
                  className="text-[13px] font-medium text-muted hover:text-foreground transition-colors px-3 py-2"
                >
                  {auth.firstName ? `Hi, ${auth.firstName}` : "Dashboard"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-blue px-5 py-2 rounded-full hover:bg-blue-dark transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[13px] font-medium text-muted hover:text-foreground transition-colors px-3 py-2">
                  Log in
                </Link>
                <Link
                  href="/apply"
                  className="text-[13px] font-semibold text-white bg-blue px-5 py-2 rounded-full hover:bg-blue-dark transition-colors"
                >
                  Apply now
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 -mr-2 text-muted hover:text-foreground"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <div id="mobile-menu" className="md:hidden pb-6 border-t border-border/40 mt-1">
            <ul className="space-y-1 pt-4" role="list">
              {navLinks.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} onClick={() => setIsOpen(false)} className="block text-sm text-muted hover:text-foreground py-2.5 px-1">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex gap-3 mt-5">
              {auth.status === "authed" ? (
                <>
                  <Link
                    href={authedHome}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center text-sm font-medium text-foreground border border-border rounded-full py-2.5 hover:bg-surface-hover transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex-1 text-center text-sm font-semibold text-white bg-blue rounded-full py-2.5"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center text-sm font-medium text-foreground border border-border rounded-full py-2.5 hover:bg-surface-hover transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/apply"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center text-sm font-semibold text-white bg-blue rounded-full py-2.5"
                  >
                    Apply now
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
