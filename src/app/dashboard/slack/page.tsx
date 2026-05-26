import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ExternalLink, Hash } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SLACK_INVITE_URL, SLACK_INVITE_PITCH } from "@/lib/slack";
import { JoinedSlackButton } from "./joined-slack-button";

// Compulsory Slack-join page. The cohort coordinates on Slack day-to-day, so
// every intern is expected to join. The page is reachable from the sidebar
// and the dashboard banner; once an intern marks "I've joined", the banner
// goes away and they can keep working normally.
export const dynamic = "force-dynamic";

export default async function SlackJoinPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const intern = await prisma.intern.findUnique({
    where: { userId: session.id },
    select: { slackJoined: true, slackJoinedAt: true },
  });
  const joined = !!intern?.slackJoined;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Hash className="h-6 w-6 text-blue" />
          <h1 className="text-2xl font-bold text-foreground">Join the UBI Slack</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          This is how we coordinate the cohort — assignments, deadlines, and quick help all
          happen here. Joining is required.
        </p>
      </header>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border">
          <p className="text-foreground text-base leading-relaxed mb-5">
            {SLACK_INVITE_PITCH}
          </p>
          <a
            href={SLACK_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#4A154B] text-white font-semibold hover:opacity-90"
          >
            <Hash className="h-4 w-4" />
            Open the Slack invite
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </a>
          <p className="mt-4 text-xs font-mono text-muted-foreground break-all">
            {SLACK_INVITE_URL}
          </p>
        </div>

        <div className="p-6 md:p-8 bg-muted/20">
          {joined ? (
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="font-medium">You&apos;ve joined Slack.</p>
                {intern?.slackJoinedAt && (
                  <p className="text-xs text-muted-foreground">
                    Confirmed {new Date(intern.slackJoinedAt).toLocaleDateString()}.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground mb-3">
                Once you&apos;ve joined the workspace, confirm below so we know you&apos;re in.
              </p>
              <JoinedSlackButton />
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Trouble with the link? Open it from your phone or a different browser, or{" "}
        <Link href="/dashboard/feedback" className="text-blue underline">
          let us know
        </Link>{" "}
        and a program manager will help.
      </p>
    </div>
  );
}
