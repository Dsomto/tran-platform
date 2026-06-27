import { prisma } from "@/lib/db";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { LogoMark } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function PublicFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.feedbackInvite.findUnique({
    where: { token },
    include: { response: true },
  });

  const invalid = !invite;
  const alreadyDone = !!invite?.respondedAt || !!invite?.response;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-blue dark:text-blue-400">UBI</span> Cybersecurity Internship
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {invalid ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h1 className="text-xl font-bold text-foreground">This link is not valid</h1>
            <p className="text-sm text-muted mt-2">
              The feedback link looks incorrect or has expired. If you believe this is a mistake,
              reply to the email we sent you and we will send a fresh one.
            </p>
          </div>
        ) : alreadyDone ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h1 className="text-xl font-bold text-foreground">You have already responded</h1>
            <p className="text-sm text-muted mt-2">
              Thank you — your feedback is recorded. There is nothing more to do.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                {invite!.name ? `Hi ${invite!.name.split(" ")[0]}, ` : ""}we would love your feedback
              </h1>
              <p className="text-sm text-muted mt-2 max-w-xl">
                You were part of our cybersecurity internship, and how it went for you matters.
                This takes about 5 minutes. Your answers help us improve the programme and make the
                case to support more people like you. Everything except a testimonial you choose to
                share stays private and is only ever reported in aggregate.
              </p>
            </div>
            <FeedbackForm
              token={invite!.token}
              prefillName={invite!.name ?? ""}
              prefillEmail={invite!.email}
              source="public"
            />
          </>
        )}
      </main>
    </div>
  );
}
