import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TwoFactorPanel } from "./two-factor-panel";
import { Shield } from "lucide-react";

export default async function SecuritySettingsPage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      email: true,
      totpEnabled: true,
      totpLastUsedAt: true,
      role: true,
    },
  });

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const isPrivileged =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "GRADER";

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Security</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Protect your account with two-factor authentication and manage your
          session.
        </p>
      </header>

      {user.totpEnabled && (
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <Shield className="h-3.5 w-3.5" /> Paranoid, professionally.
        </div>
      )}

      {isPrivileged && !user.totpEnabled && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
          <strong>Recommended:</strong> your account has admin or grader
          privileges. Turn on two-factor authentication below — it stops someone
          with your password from logging in.
        </div>
      )}

      <TwoFactorPanel
        email={user.email}
        initiallyEnabled={user.totpEnabled}
        lastUsedAt={user.totpLastUsedAt ? user.totpLastUsedAt.toISOString() : null}
      />
    </div>
  );
}
