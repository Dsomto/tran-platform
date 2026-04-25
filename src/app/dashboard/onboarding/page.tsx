import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OnboardingForm } from "./onboarding-form";

interface SearchParams {
  next?: string;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { ndaSignedAt: true },
  });

  // If they aren't an intern at all, send back to dashboard.
  if (!intern) redirect("/dashboard");

  const { next } = await searchParams;
  // Only honour relative paths so an attacker can't redirect off-domain.
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/dashboard";

  // Already signed — send them where they were going.
  if (intern.ndaSignedAt) redirect(safeNext);

  return (
    <main className="min-h-screen bg-background bg-scan py-12 px-5">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-muted hover:text-foreground inline-flex items-center gap-1 mb-6"
        >
          ← Back to dashboard
        </Link>
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue mb-2">
            One-time onboarding
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
            Welcome aboard.
          </h1>
          <p className="text-base text-muted leading-relaxed max-w-2xl">
            Before you step into the first stage, a quick paperwork moment.
            Read both documents, then sign once at the bottom. You will not
            see this page again.
          </p>
        </header>

        <OnboardingForm
          fullName={`${session.firstName} ${session.lastName}`.trim()}
          nextHref={safeNext}
        />
      </div>
    </main>
  );
}
