import Link from "next/link";
import { LogoMark } from "@/components/logo";

const links = {
  Program: [
    ["Apply", "/apply"],
    ["Stages", "#stages"],
    ["Tracks", "#tracks"],
    ["FAQ", "#faq"],
  ],
  Company: [
    ["About", "#program"],
    ["Why UBI", "#why"],
    ["Graduates", "#testimonials"],
    ["For Employers", "/hire"],
    ["Contact", "#"],
  ],
  Legal: [
    ["Privacy", "#"],
    ["Terms", "#"],
    ["Code of Conduct", "#"],
  ],
};

export function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-border/60 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="UBI homepage" className="flex items-center gap-2.5 mb-4">
              <LogoMark size={24} />
              <span className="text-base font-semibold text-foreground">UBI</span>
            </Link>
            <p className="text-xs text-muted leading-relaxed max-w-[200px]">
              Building the next generation of cybersecurity professionals.
            </p>
          </div>

          {Object.entries(links).map(([heading, items]) => (
            <nav key={heading} aria-label={heading}>
              <h3 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wider">{heading}</h3>
              <ul className="space-y-2.5" role="list">
                {items.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith("/") ? (
                      <Link href={href} className="text-xs text-muted hover:text-foreground transition-colors">{label}</Link>
                    ) : (
                      <a href={href} className="text-xs text-muted hover:text-foreground transition-colors">{label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-muted">&copy; {new Date().getFullYear()} UBI. All rights reserved. A programme by <a href="https://therootaccessnetwork.com/" target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">The Root Access Network</a>.</p>
        </div>
      </div>
    </footer>
  );
}
