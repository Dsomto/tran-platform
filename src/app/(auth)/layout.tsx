import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell min-h-screen flex relative overflow-hidden hero-bg">
      {/* Hex pattern */}
      <div className="hex-pattern" aria-hidden="true" />

      {/* Back to home */}
      <Link
        href="/"
        className="auth-home-link absolute top-5 left-5 z-10 inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold backdrop-blur-xl transition-all focus-visible:outline-none"
        aria-label="Back to home"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <LogoMark size={32} />
          <span className="text-2xl font-bold text-foreground tracking-tight">
            UBI
          </span>
        </Link>

        {/* Card */}
        <div className="w-full max-w-md glass-strong rounded-3xl p-8 shadow-xl">
          {children}
        </div>

        <p className="text-xs text-muted mt-8">
          &copy; 2026 Ubuntu Bridge Initiative. All rights reserved.
        </p>
      </div>
    </div>
  );
}
