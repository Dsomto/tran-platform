import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex relative overflow-hidden hero-bg">
      {/* Hex pattern */}
      <div className="hex-pattern" aria-hidden="true" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <LogoMark size={32} />
          <span className="text-2xl font-bold text-foreground tracking-tight">
            Net<span className="text-blue">Forge</span>
          </span>
        </Link>

        {/* Card */}
        <div className="w-full max-w-md glass-strong rounded-3xl p-8 shadow-xl">
          {children}
        </div>

        <p className="text-xs text-muted mt-8">
          &copy; 2026 UBI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
