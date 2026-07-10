import { FeedbackForm } from "@/components/feedback/feedback-form";
import { LogoMark } from "@/components/logo";

export const dynamic = "force-dynamic";

// Public feedback form — no account, no token, no login. Anyone we send the
// link to can fill it in and self-report their name and email. The API already
// accepts an anonymous submission (no token, no session).
export default function PublicOpenFeedbackPage() {
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">We would love your feedback</h1>
          <p className="text-sm text-muted mt-2 max-w-xl">
            You were part of our cybersecurity internship, and how it went for you matters. This
            takes about 5 minutes, and you do not need to log in.
          </p>
          <p className="text-sm text-muted mt-3 max-w-xl">
            Please be honest. We do not only want kind words, we want to know what did not work so
            the next cohort is better. We would like to publish some of these stories, so write
            yours as something you would be proud to see shared. You choose below whether we may
            quote you. Everything else stays private and is only ever reported in aggregate.
          </p>
        </div>

        <FeedbackForm source="public" />
      </main>
    </div>
  );
}
