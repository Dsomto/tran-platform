import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const dynamic = "force-dynamic";

export default async function DashboardSurveyPage() {
  const session = await getSession();
  // Keep the destination: someone opening the survey link from an email while
  // logged out lands back on the survey after signing in, instead of being
  // dumped on the dashboard and losing the form.
  if (!session) redirect("/login?next=/dashboard/survey");

  // If this intern already responded (matched by email on an invite), show a
  // short thank-you instead of the form so they can't double-submit.
  const existing = await prisma.feedbackInvite.findFirst({
    where: { email: session.email.toLowerCase(), respondedAt: { not: null } },
    select: { id: true },
  });

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Your feedback</h1>
        <p className="text-sm text-muted mt-2 max-w-xl">
          Tell us how the programme has gone for you. It takes about 5 minutes and directly shapes
          the next cohort. Everything except a testimonial you choose to share stays private.
        </p>
      </header>

      {existing ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <div className="text-4xl mb-2">✅</div>
          <h2 className="text-lg font-bold text-foreground">Thank you — already received</h2>
          <p className="text-sm text-muted mt-2">Your feedback is recorded. Nothing more to do.</p>
        </div>
      ) : (
        <FeedbackForm
          prefillName={`${session.firstName} ${session.lastName}`.trim()}
          prefillEmail={session.email}
          source="dashboard"
        />
      )}
    </div>
  );
}
