import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { SiteBackground } from "@/components/landing/site-background";

// Applications are not open. The form lives in ./apply-form.tsx; to reopen,
// render it from here again.
export const metadata: Metadata = {
  title: "Applications coming soon",
  description: "Applications for the next Ubuntu Bridge Initiative cohort are coming soon.",
  alternates: { canonical: "/apply" },
};

export default function ApplyComingSoon() {
  return (
    <div className="landing-page site min-h-screen bg-background text-foreground">
      <SiteBackground />
      <Navbar />
      <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-5 pt-28 pb-20 text-center sm:px-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-foreground-muted">
          <span className="h-2 w-2 rounded-full bg-signal" aria-hidden="true" />
          Next cohort
        </p>
        <h1 className="mt-6 text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
          Applications are <span className="serif font-normal text-sky">coming soon.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-foreground-muted">
          We&apos;re getting the next cohort ready. Check back here soon.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/interns"
            className="inline-flex h-14 items-center gap-2 rounded-full bg-foreground px-8 text-[15px] font-semibold text-background transition-colors hover:bg-signal hover:text-ink"
          >
            Meet Cohort 1 <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/volunteer"
            className="inline-flex h-14 items-center rounded-full border border-border px-8 text-[15px] font-semibold transition-colors hover:border-foreground"
          >
            Volunteer with us
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
