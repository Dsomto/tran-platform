import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LogoMark } from "@/components/logo";

// Anchor links point at landing-page sections. Prefix with "/" so they work
// from any route — e.g. clicking "Stages" from /play takes you to /#stages,
// not /play#stages (which doesn't exist).
const links = {
  Program: [
    ["Apply", "/apply"],
    ["Volunteer", "/volunteer"],
    ["Stages", "/#stages"],
    ["Tracks", "/#tracks"],
    ["FAQ", "/#faq"],
  ],
  Company: [
    ["About", "/#program"],
    ["Why UBI", "/#why"],
    ["Graduates", "/#testimonials"],
    ["For Employers", "/hire"],
    ["Contact", "/apply"],
  ],
  Legal: [
    ["Privacy", "/"],
    ["Terms", "/"],
    ["Code of Conduct", "/"],
  ],
};

export function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-[#2A3858] bg-[#131C31] text-[#F4F6FB]">
      <div className="max-w-[88rem] mx-auto px-5 sm:px-8 pt-24 pb-10">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1] tracking-[-0.045em]">
              Talent shouldn&apos;t{" "}
              <span className="font-[family-name:var(--font-instrument)] italic font-normal text-[#8DB4FF]">depend on money.</span>
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 rounded-full bg-[#F4F6FB] px-6 py-3 text-sm font-medium text-[#131C31] transition-colors hover:bg-[#C6F24E]"
              >
                Apply now <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/volunteer"
                className="inline-flex items-center rounded-full border border-[#2A3858] px-6 py-3 text-sm text-[#CDD5E4] transition-colors hover:border-[#F4F6FB]/40 hover:text-[#F4F6FB]"
              >
                Volunteer with us
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 lg:col-span-6">
            {Object.entries(links).map(([heading, items]) => (
              <nav key={heading} aria-label={heading}>
                <h3 className="mb-5 text-sm text-[#9AA7C2]">{heading}</h3>
                <ul className="space-y-3" role="list">
                  {items.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-[15px] text-[#CDD5E4] transition-colors hover:text-[#C6F24E]">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-24 flex flex-col gap-4 border-t border-[#2A3858] pt-8 text-sm text-[#9AA7C2] sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" aria-label="UBI homepage" className="inline-flex items-center gap-2.5 text-[#F4F6FB]">
            <LogoMark size={22} tone="dark" />
            <span className="font-medium">Ubuntu Bridge Initiative</span>
          </Link>
          <p>&copy; {new Date().getFullYear()} Ubuntu Bridge Initiative. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
