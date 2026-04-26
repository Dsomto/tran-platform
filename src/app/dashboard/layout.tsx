import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  // One-time NDA gate: any unsigned intern is routed to onboarding before
  // they see the rest of the dashboard. The proxy forwards `x-pathname`
  // so we can skip this when the user is already on the onboarding page,
  // which would otherwise loop.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (!pathname.startsWith("/dashboard/onboarding")) {
    const intern = await prisma.intern.findUnique({
      where: { userId: session.id },
      select: { ndaSignedAt: true },
    });
    if (intern && !intern.ndaSignedAt) {
      const next = pathname && pathname.startsWith("/") ? pathname : "/dashboard";
      redirect(`/dashboard/onboarding?next=${encodeURIComponent(next)}`);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role="INTERN"
        userName={`${session.firstName} ${session.lastName}`}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
