"use client";

import { LogoMark } from "@/components/logo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
});

export default function ProposalSultanPage() {
  return (
    <>
      {/* Print button */}
      <div className="fixed top-6 right-6 z-50 print:hidden flex gap-3">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 px-6 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          Download as PDF
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 py-12 px-4 print:bg-white print:py-0 print:px-0">
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none">
          <div className="px-16 py-14 print:px-[25mm] print:py-[20mm]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

            {/* Letterhead */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b-2 border-gray-800">
              <div className="flex items-center gap-3">
                <LogoMark size={36} />
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                    TRAN
                  </h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em]" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                    The Root Access Network
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-600 leading-relaxed">
                <p>Lagos, Nigeria</p>
                <p>somtochukwu.okoma@ethnoscyber.com</p>
              </div>
            </div>

            {/* Date */}
            <p className="text-[13px] text-gray-700 mb-8">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            {/* Recipient */}
            <div className="text-[13px] text-gray-800 leading-relaxed mb-8">
              <p className="font-semibold">Akintunde Sultan (Hack Sultan)</p>
              <p>Via email: akintundesultan@gmail.com</p>
            </div>

            {/* Salutation */}
            <p className="text-[13px] text-gray-800 mb-6">Dear Sultan,</p>

            {/* Subject */}
            <p className="text-[13px] font-bold text-gray-900 mb-6 underline underline-offset-4">
              PARTNERSHIP &amp; SUPPORT REQUEST — THE ROOT ACCESS NETWORK (TRAN): TRAINING 5,000 NIGERIAN YOUTHS IN CYBERSECURITY
            </p>

            {/* Body */}
            <div className="text-[13px] text-gray-800 leading-[1.85] space-y-4">

              <p>
                I write to introduce <strong>The Root Access Network (TRAN)</strong> and to humbly ask for your support — in whatever form you are willing to give, no matter how small — for our mission to train <strong>5,000 Nigerian and African youths</strong> in practical, job-ready cybersecurity skills in 2025.
              </p>

              <p>
                You have spent years building one of the most trusted voices in Nigeria&apos;s tech ecosystem. What we are doing at TRAN sits at the intersection of everything you champion — access, community, and equipping young Nigerians with real skills for real careers. We are not waiting for everything to be perfect before we start. We started with what we had, and we are reaching out to people like you because even the smallest push can move mountains when the cause is right.
              </p>

              {/* ── THE PROBLEM ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">The Problem</p>

              <p>
                Nigeria does not have a resource problem — we have a <strong>skills problem</strong>. There are over 3.5 million unfilled cybersecurity positions globally, and Africa is one of the most underrepresented regions. Our youth have the hunger and the talent, but they lack access to structured, hands-on training that leads to employment.
              </p>

              <p>
                Cybercrime costs Africa over <strong>$4 billion annually</strong>. The same young people vulnerable to recruitment by cybercriminals could become the professionals who protect our digital infrastructure — if someone opens the door for them. TRAN is that door.
              </p>

              {/* ── WHAT WE DO ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What TRAN Does</p>

              <p>
                TRAN is a free, fully remote, 10-stage elimination-based cybersecurity internship. Participants specialise in one of three tracks:
              </p>

              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li><strong>SOC Analysis</strong> — Threat detection, SIEM, incident response</li>
                <li><strong>Ethical Hacking</strong> — Penetration testing, offensive security</li>
                <li><strong>GRC</strong> — Governance, risk management, compliance auditing</li>
              </ol>

              <p>
                But we don&apos;t stop at the online programme. We go into <strong>secondary schools</strong>, <strong>universities</strong>, and <strong>underserved communities</strong> — literally under bridges and at bus stops — to introduce cybersecurity as a career to young people who have never considered it.
              </p>

              <p>
                We also spotlight and partner with organisations doing incredible work in skills development across Nigeria — like <strong>AltSchool Africa</strong>, which is reshaping how young Africans access world-class tech education, and <strong>SkillUp</strong>, which is equipping thousands with practical, in-demand skills. Together, we believe a rising tide lifts all boats. Our goal is not to compete — it is to build a network where every initiative making young Nigerians more employable is amplified and celebrated.
              </p>

              {/* ── TRACK RECORD ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We&apos;ve Done So Far</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Trained <strong>over 1,000 Nigerian youths</strong> in 2024</li>
                <li>Featured in <strong>BusinessDay</strong> for our impact in youth cybersecurity development</li>
                <li>Currently have <strong>₦2 million</strong> in funding for programme operations</li>
                <li>Scaling to <strong>5,000 youths</strong> in 2025 — our most ambitious cohort</li>
              </ul>

              {/* ── BUDGET ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We Need: ₦15 Million</p>

              <p>
                We need ₦15 million to deliver this at scale. Here is exactly where every naira goes:
              </p>

              <table className="w-full my-4 border-collapse text-[12px]">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 font-bold text-gray-900">Item</th>
                    <th className="text-left py-2 font-bold text-gray-900">Details</th>
                    <th className="text-right py-2 font-bold text-gray-900">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Professional Certifications</td>
                    <td className="py-2">CompTIA Security+, CEH, ISO 27001 exam vouchers for top performers</td>
                    <td className="py-2 text-right whitespace-nowrap">₦4.5M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Laptops &amp; Hardware</td>
                    <td className="py-2">Devices for finalists who lack personal equipment</td>
                    <td className="py-2 text-right whitespace-nowrap">₦4M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">School Outreach</td>
                    <td className="py-2">Cybersecurity workshops at secondary schools and universities</td>
                    <td className="py-2 text-right whitespace-nowrap">₦2M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Under-the-Bridge Initiative</td>
                    <td className="py-2">Street-level workshops for out-of-school youth in underserved communities</td>
                    <td className="py-2 text-right whitespace-nowrap">₦1.5M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Lab Infrastructure</td>
                    <td className="py-2">Cloud-based hacking labs, SIEM environments, practice platforms</td>
                    <td className="py-2 text-right whitespace-nowrap">₦1.5M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Mentorship &amp; Staffing</td>
                    <td className="py-2">Industry mentors, graders, and programme coordinators</td>
                    <td className="py-2 text-right whitespace-nowrap">₦1.5M</td>
                  </tr>
                  <tr className="border-t-2 border-gray-300">
                    <td className="py-2 font-bold text-gray-900" colSpan={2}>Total</td>
                    <td className="py-2 text-right font-bold text-gray-900 whitespace-nowrap">₦15M</td>
                  </tr>
                </tbody>
              </table>

              {/* ── HOW HE CAN HELP ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">How You Can Help</p>

              <p>
                We are not asking for everything — we are asking for anything. Your strength is community, reach, and credibility, and even the smallest gesture from you would mean the world to us and to the thousands of young people we are trying to reach. Here are a few ways you could help:
              </p>

              <ol className="list-decimal pl-6 space-y-3 my-4">
                <li>
                  <strong>Amplify:</strong> A single post from you reaches tens of thousands of people in the exact demographic we serve. Share our story, and young Nigerians who need this programme will find it.
                </li>
                <li>
                  <strong>Connect:</strong> If you know organisations, founders, or CSR departments that fund youth and education initiatives, an introduction from you carries weight that a cold email never will.
                </li>
                <li>
                  <strong>Advise:</strong> You have scaled community initiatives in Nigeria&apos;s tech ecosystem. 15 minutes of your perspective on how we can reach 5,000 youths effectively would be invaluable.
                </li>
              </ol>

              <p>
                If direct sponsorship is also on the table, any contribution — ₦50,000 or ₦5 million — goes directly into certifications, laptops, and outreach. Every naira counts. We started this initiative with almost nothing, and we trained over 1,000 youths. Imagine what we can do with even a little more. We are fully transparent with how funds are used and provide quarterly impact reports to all supporters.
              </p>

              {/* ── WHAT WE OFFER ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We Offer Partners</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Branding across the TRAN platform, website, and all certificates issued</li>
                <li>Co-branded content and social media campaigns</li>
                <li>Named scholarship track (e.g. &quot;The Hack Sultan Cybersecurity Scholars&quot;)</li>
                <li>Quarterly impact reports with real numbers and outcomes</li>
                <li>First access to our talent pool for cybersecurity hiring</li>
              </ul>

              {/* ── CLOSING ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Next Steps</p>

              <p>
                I would be grateful for even 15 minutes of your time — a quick call or chat to explore how we can work together. We are not too proud to start small. We started under bridges. We started with ₦2 million. We started with one cohort. And we will keep going — but with your support, no matter how small, we can go further and faster.
              </p>

              <p>
                Thank you for your time, Sultan. Whatever you decide, we appreciate you even reading this far.
              </p>
            </div>

            {/* Sign-off */}
            <div className="mt-12 text-[13px] text-gray-800">
              <p>Yours faithfully,</p>

              <div className={`mt-6 mb-2 ${dancingScript.className}`}>
                <p className="text-[32px] leading-none text-gray-900">
                  Okoma Somto
                </p>
              </div>

              <div className="w-64 border-t border-gray-400 pt-2">
                <p className="font-bold">Okoma Somtochukwu</p>
                <p>Head of Program</p>
                <p>The Root Access Network (TRAN)</p>
                <p>09153203421</p>
                <p>somtochukwu.okoma@ethnoscyber.com</p>
              </div>
            </div>

            {/* Appendix */}
            <div className="mt-16 pt-8 border-t-2 border-gray-300">
              <p className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-4" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                Appendix — Programme at a Glance
              </p>

              <div className="grid grid-cols-4 gap-4 my-6">
                {[
                  { val: "1,000+", label: "Youths trained in 2024" },
                  { val: "5,000", label: "Target for 2025" },
                  { val: "₦15M", label: "Total funding needed" },
                  { val: "3", label: "Specialisation tracks" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{stat.val}</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-gray-600 leading-relaxed space-y-2">
                <p><strong>Media:</strong> Featured in BusinessDay Nigeria for youth cybersecurity training impact.</p>
                <p><strong>Website:</strong> therootaccessnetwork.com</p>
                <p><strong>Format:</strong> 10 stages, elimination-based, fully remote, 100% free for participants.</p>
                <p><strong>Outreach:</strong> School visits, under-the-bridge workshops, community centre sessions across Lagos and beyond.</p>
                <p><strong>Alumni Outcomes:</strong> Stage 5+ alumni gain job-readiness programmes and industry connections. Finalists receive mentorship, laptops, certifications, and priority hiring placement.</p>
                <p><strong>Ecosystem Partners:</strong> We spotlight and collaborate with organisations like AltSchool Africa and SkillUp — building a collective movement for youth employability across Nigeria.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
