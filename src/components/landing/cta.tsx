import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function CTA() {
  return (
    <section aria-labelledby="cta-heading" className="px-5 pb-16 sm:px-8 sm:pb-20">
      <div
        data-reveal
        className="relative mx-auto grid max-w-[80rem] items-center gap-10 overflow-hidden rounded-3xl bg-blue p-8 text-white sm:p-12 lg:grid-cols-[1.4fr_1fr]"
      >
        <div>
          <h2 id="cta-heading" className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
            Earn your <span className="serif font-normal text-signal">place.</span>
          </h2>
          <p className="mt-6 text-lg text-white/80">It takes about 15 minutes to apply.</p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/apply"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-signal px-8 text-[15px] font-semibold text-ink transition-colors hover:bg-white"
            >
              Apply now
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" aria-hidden="true" />
            </Link>
            <Link href="/login" className="text-[15px] text-white/80 underline-offset-4 hover:text-white hover:underline">
              Already applied? Log in
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
          <Image src="/images/hero-2.jpg" alt="" fill sizes="(min-width: 1024px) 420px, 90vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
