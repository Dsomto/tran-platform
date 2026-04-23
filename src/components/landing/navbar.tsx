"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { Menu, X, ArrowLeft } from "lucide-react";

const navLinks = [
  ["Tracks", "/tracks"],
  ["For Employers", "/hire"],
  ["Play", "/play"],
  ["Data Scholarship", "/apply/data-scholarship"],
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
                href="/"
                aria-label="Go to home"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-border/60 bg-white/60 backdrop-blur hover:bg-white text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <Link href="/" aria-label="UBI homepage" className="flex items-center gap-2.5">
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
            <Link href="/login" className="text-[13px] font-medium text-muted hover:text-foreground transition-colors px-3 py-2">
              Log in
            </Link>
            <Link
              href="/apply"
              className="text-[13px] font-semibold text-white bg-blue px-5 py-2 rounded-full hover:bg-blue-dark transition-colors"
            >
              Apply now
            </Link>
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
              <Link href="/login" className="flex-1 text-center text-sm font-medium text-foreground border border-border rounded-full py-2.5 hover:bg-surface-hover transition-colors">
                Log in
              </Link>
              <Link href="/apply" className="flex-1 text-center text-sm font-semibold text-white bg-blue rounded-full py-2.5">
                Apply now
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
