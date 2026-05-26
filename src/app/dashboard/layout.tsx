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

  // Two compulsory gates, in priority order:
  //   1. NDA       — unsigned interns are routed to /dashboard/onboarding.
  //   2. Slack     — once the NDA is signed, interns must self-confirm they
  //                  joined the cohort Slack workspace at /dashboard/slack
  //                  before they can use the rest of the dashboard.
  // The proxy forwards `x-pathname` so we can skip the redirect on the gate's
  // own page; without that we'd loop forever.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const onOnboarding = pathname.startsWith("/dashboard/onboarding");
  const onSlackPage = pathname.startsWith("/dashboard/slack");

  if (!onOnboarding) {
    const intern = await prisma.intern.findUnique({
      where: { userId: session.id },
      select: { ndaSignedAt: true, slackJoined: true },
    });
    if (intern && !intern.ndaSignedAt) {
      const next = pathname && pathname.startsWith("/") ? pathname : "/dashboard";
      redirect(`/dashboard/onboarding?next=${encodeURIComponent(next)}`);
    }
    if (intern && intern.ndaSignedAt && !intern.slackJoined && !onSlackPage) {
      redirect("/dashboard/slack");
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
