import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Return 404 — not a /login redirect — for anyone not already privileged.
  // This prevents external scanners from discovering /admin by watching for
  // auth redirects. The path looks exactly like a non-existent route.
  if (!session) {
    notFound();
  }

  if (
    session.role !== "ADMIN" &&
    session.role !== "SUPER_ADMIN" &&
    session.role !== "GRADER" &&
    session.role !== "ANALYST"
  ) {
    notFound();
  }

  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (
    session.role === "GRADER" &&
    pathname !== "/admin/reports" &&
    !pathname.startsWith("/admin/reports/")
  ) {
    notFound();
  }

  // ANALYST is read-only: it can see the analytics dashboard and nothing else
  // under /admin. Everything outside /admin/analytics 404s for them (the
  // /setup-2fa allowance lets them complete 2FA enrollment first).
  if (
    session.role === "ANALYST" &&
    pathname !== "/admin/analytics" &&
    !pathname.startsWith("/admin/analytics/") &&
    !pathname.startsWith("/setup-2fa")
  ) {
    notFound();
  }

  // Enforce 2FA enrollment for every privileged role. If the user does not
  // have TOTP set up, bounce them to /setup-2fa until they enroll. We allow
  // /setup-2fa itself (and api routes) so the enrollment flow can complete.
  // The proxy forwards x-pathname so we can detect where the request is.
  const isOnSetupPage = pathname.startsWith("/setup-2fa");
  if (!isOnSetupPage) {
    const userRow = await prisma.user.findUnique({
      where: { id: session.id },
      select: { totpEnabled: true },
    });
    if (!userRow?.totpEnabled) {
      redirect("/setup-2fa?reason=required");
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={session.role}
        userName={`${session.firstName} ${session.lastName}`}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
