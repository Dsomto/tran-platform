"use client";

import { LogoMark } from "@/components/logo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
});

export default function ProposalIsc2Page() {
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
              <p className="font-semibold">The Executive Committee</p>
              <p>ISC2 Nigeria Chapter</p>
              <p>Lagos, Nigeria</p>
            </div>

            {/* Salutation */}
            <p className="text-[13px] text-gray-800 mb-6">Dear Chapter Leadership,</p>

            {/* Subject */}
            <p className="text-[13px] font-bold text-gray-900 mb-6 underline underline-offset-4">
              FUNDING &amp; SPONSORSHIP REQUEST — THE ROOT ACCESS NETWORK (TRAN): A ONE-OF-A-KIND INITIATIVE TRAINING 5,000 NIGERIAN YOUTHS IN CYBERSECURITY
            </p>

            {/* Body */}
            <div className="text-[13px] text-gray-800 leading-[1.85] space-y-4">

              <p>
                I write directly to introduce <strong>The Root Access Network (TRAN)</strong> and to formally request the financial sponsorship and certification support of the <strong>ISC2 Nigeria Chapter</strong> for our 2026 cohort: <strong>5,000 Nigerian youths</strong> trained in practical, job-ready cybersecurity skills, free of charge.
              </p>

              <p>
                Let me be direct: <strong>we need money, we need sponsors, we need certifications, and we need partners willing to back this at scale.</strong> We currently hold <strong>₦2,000,000</strong> in committed funding — enough to keep the lights on, not enough to deliver at the scale Nigeria needs. We are also actively in conversations with the <strong>Nigeria Data Protection Commission (NDPC)</strong> on alignment with national data-protection capacity-building, and with the office of the <strong>Director-General of NITDA</strong> — Nigeria&apos;s Chief Information Technology Officer — on federal recognition and 3MTT alignment. We are building a coalition of partners around this cohort, and we would be honoured to count ISC2 Nigeria among them.
              </p>

              <p>
                There is, quite simply, <strong>no other initiative like this in the country.</strong> A free, fully-remote, 10-stage, elimination-based cybersecurity programme that takes a young Nigerian from zero to job-ready and ushers them toward globally-recognised credentials does not exist anywhere else at this scale. TRAN is genuinely one of a kind — and it is asking for serious institutional backing to match.
              </p>

              <p>
                ISC2 sits at the centre of the global cybersecurity profession — through certifications like <strong>CC, SSCP, CISSP, CCSP and CGRC</strong>, the Common Body of Knowledge, and the One Million Certified in Cybersecurity initiative. The Nigeria Chapter, in particular, has built a community of practitioners committed to growing local talent. TRAN exists to feed exactly that pipeline: young Nigerians who, today, do not yet know what a SOC analyst does — and who, with the right structured exposure, can become the next generation of CC, SSCP and CISSP holders carrying ISC2&apos;s mission across West Africa.
              </p>

              {/* ── THE PROBLEM ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">The Problem: A Skills Gap, Not a Talent Gap</p>

              <p>
                ISC2&apos;s own Cybersecurity Workforce Study has put the global shortage at over <strong>4 million professionals</strong>, with Africa among the most underrepresented regions. Nigeria does not have a talent problem — we have an <strong>access problem</strong>. Our youth have hunger and aptitude, but they lack structured, hands-on pathways into the profession.
              </p>

              <p>
                Cybercrime costs Africa over <strong>$4 billion annually</strong>. The same young people vulnerable to recruitment by cybercriminals could become the certified professionals who defend our digital infrastructure — if given a real on-ramp. TRAN is that on-ramp, and ISC2&apos;s certifications are the destination we want to point them towards.
              </p>

              {/* ── ABOUT TRAN ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">About The Root Access Network</p>

              <p>
                TRAN is a free, fully remote, 10-stage elimination-based cybersecurity internship programme. Participants specialise in one of three tracks:
              </p>

              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li><strong>SOC Analysis</strong> — Threat detection, SIEM operations, incident response (a natural pipeline to <em>SSCP</em> and ultimately <em>CISSP</em>)</li>
                <li><strong>Ethical Hacking</strong> — Penetration testing, vulnerability assessment, offensive security</li>
                <li><strong>Governance, Risk &amp; Compliance (GRC)</strong> — ISO 27001, NIST, data privacy, compliance auditing (a direct path to <em>CGRC</em>)</li>
              </ol>

              <p>
                The programme is competitive by design — participants must meet strict performance benchmarks at every stage or face elimination — producing professionals who are ready for day-one impact and well-positioned to sit ISC2 examinations.
              </p>

              <p>
                We do not stop at online training. We go into <strong>secondary schools</strong>, <strong>universities</strong>, and <strong>underserved communities</strong> — literally under bridges and at bus stops — to introduce cybersecurity as a career to young people who have never considered it. This grassroots pipeline is exactly the kind of feeder that Nigeria&apos;s cybersecurity profession needs in order to grow ISC2 membership beyond Lagos and Abuja.
              </p>

              {/* ── TRACK RECORD ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Our Track Record</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Trained <strong>over 1,000 Nigerian youths</strong> in cybersecurity in 2025</li>
                <li>Featured in <strong>BusinessDay Nigeria</strong> for my impact in youth cybersecurity development</li>
                <li>Currently operating with <strong>₦2 million</strong> in committed funding — far short of what 5,000 youths require</li>
                <li>In active conversations with the <strong>Nigeria Data Protection Commission (NDPC)</strong> and the office of the <strong>Director-General of NITDA</strong> on national alignment and federal recognition</li>
                <li>Scaling to <strong>5,000 youths</strong> in 2026 — our most ambitious cohort yet</li>
              </ul>

              <p>
                We did not wait for perfect conditions — we trained over 1,000 youths on a shoestring budget because the need was too urgent to wait. Now we are openly asking institutional partners to back us at the scale this challenge actually demands.
              </p>

              {/* ── ALIGNMENT WITH ISC2 ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Alignment with ISC2&apos;s Mission</p>

              <p>
                TRAN&apos;s work directly advances several of ISC2&apos;s strategic priorities:
              </p>

              <ul className="list-disc pl-6 space-y-3 my-4">
                <li>
                  <strong>One Million Certified in Cybersecurity:</strong> Our 5,000 trainees are precisely the audience for the free <em>Certified in Cybersecurity (CC)</em> training and exam. Partnering with TRAN gives ISC2 a structured channel to convert thousands of motivated Nigerian youths into CC holders.
                </li>
                <li>
                  <strong>Workforce Study &amp; Talent Pipeline:</strong> ISC2&apos;s annual workforce study highlights Africa&apos;s shortage. TRAN is one of the few programmes operating at sufficient scale and rigour to materially move that needle in Nigeria.
                </li>
                <li>
                  <strong>Chapter Growth:</strong> Every TRAN finalist who progresses to SSCP or CISSP becomes a future ISC2 Nigeria Chapter member. Partnering now seeds the chapter&apos;s membership pipeline for the next decade.
                </li>
                <li>
                  <strong>Code of Ethics &amp; Professionalism:</strong> Our curriculum can integrate the ISC2 Code of Ethics from Stage 0, ensuring that every trainee is grounded in professional conduct — not just technical skill — from day one.
                </li>
              </ul>

              {/* ── HOW ISC2 CAN HELP ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We Are Asking ISC2 Nigeria For</p>

              <p>
                We are asking the chapter for <strong>three things, in this order: money, certifications, and people.</strong> Any combination would be transformative — but we are being open about the scale of need.
              </p>

              <ol className="list-decimal pl-6 space-y-3 my-4">
                <li>
                  <strong>Direct financial sponsorship:</strong> A cash sponsorship — at any tier the chapter is able to commit — that goes directly into the ₦15M programme budget. ₦500,000 funds laptops for outstanding finalists. ₦2M closes a quarter of our funding gap. ₦5M unlocks the school-outreach and lab infrastructure pillars. We are also open to a <em>multi-year sponsorship commitment</em> so we can plan beyond a single cohort.
                </li>
                <li>
                  <strong>Corporate sponsor introductions:</strong> The chapter&apos;s corporate members are exactly the organisations who should be funding this work. A warm introduction from ISC2 Nigeria to two or three of those corporate sponsors could close our entire funding gap.
                </li>
                <li>
                  <strong>Certified in Cybersecurity (CC) on-ramp:</strong> Enrol our 5,000 cohort in ISC2&apos;s free CC self-paced training and facilitate access to the free CC exam through the One Million Certified initiative. This alone could produce thousands of newly certified Nigerians in 2026.
                </li>
                <li>
                  <strong>SSCP / CCSP / CISSP / CGRC exam vouchers or scholarships:</strong> Sponsored vouchers for our top finalists. Even 50 vouchers a year would change 50 lives and produce 50 new ISC2-credentialed Nigerians annually.
                </li>
                <li>
                  <strong>Mentor pool from ISC2 members:</strong> Chapter members giving 1–2 hours a month as mentors, reviewers, or panelists. With 5,000 trainees, even 50 mentors would transform the programme.
                </li>
                <li>
                  <strong>Speaker support:</strong> Chapter executives and senior members speaking at orientation, masterclasses, and graduation. Professional gravity that no amount of marketing can buy.
                </li>
                <li>
                  <strong>Endorsement &amp; co-branding:</strong> A formal letter of support from ISC2 Nigeria. This single document unlocks corporate sponsorships, media attention, and credibility with parents and universities.
                </li>
                <li>
                  <strong>Curriculum review:</strong> Chapter experts reviewing our SOC, Ethical Hacking and GRC tracks against the CC, SSCP, CCSP and CGRC CBKs — so our graduates are examination-ready by design.
                </li>
                <li>
                  <strong>Job placement bridge:</strong> Open the chapter&apos;s employer network to our finalists. Corporate ISC2 members are precisely the organisations that need certified, junior-level Nigerian talent.
                </li>
              </ol>

              <p>
                We started this initiative with ₦2 million and a conviction that Nigerian youths deserve a real path into the profession. We trained over 1,000 in our first year. With ISC2 Nigeria&apos;s sponsorship and certification support, we can turn that into <strong>5,000 certified, employable cybersecurity professionals carrying the ISC2 standard</strong> — and we can do it in 2026.
              </p>

              {/* ── WHAT WE OFFER ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We Offer in Return</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>ISC2 Nigeria Chapter branding across the TRAN platform, website, and all certificates issued</li>
                <li>A pre-vetted pipeline of CC-ready (and ultimately SSCP/CISSP-ready) Nigerian talent that grows chapter membership year on year</li>
                <li>Quarterly impact reports with verifiable data on youth trained, ISC2 exams attempted, certifications earned, and employment outcomes</li>
                <li>A named scholarship track (e.g. <em>&ldquo;The ISC2 Nigeria Scholars&rdquo;</em>)</li>
                <li>Joint media coverage and press releases highlighting the partnership and its impact</li>
                <li>Co-hosted events: chapter meetups during cohort milestones, mentor-pairing sessions, and a graduation showcase</li>
                <li>Integration of the ISC2 Code of Ethics into the TRAN curriculum from Stage 0 onwards</li>
              </ul>

              {/* ── CLOSING ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Next Steps</p>

              <p>
                I am asking for a 30-minute conversation — virtual or in person in Lagos — at the chapter&apos;s earliest convenience, to discuss a concrete sponsorship and certification partnership for the 2026 cohort. I am happy to come into a chapter meeting, present to the executive committee, or sit down one-on-one with whoever leads partnerships.
              </p>

              <p>
                We are not too proud to start small. We started under bridges and at bus stops, and we will keep going regardless. But the truth is this: <strong>without serious financial support, we cannot deliver this at the scale Nigeria needs.</strong> A one-of-a-kind initiative deserves a one-of-a-kind partner — and we believe ISC2 Nigeria is exactly that.
              </p>

              <p>
                Thank you for your time and consideration. Whatever the chapter decides, we are grateful for the work ISC2 Nigeria is already doing for our profession — and we hope very much to be doing that work alongside you.
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
                  { val: "5,000", label: "Target for 2026" },
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
                <p><strong>ISC2 Alignment:</strong> Pipeline for the One Million Certified in Cybersecurity initiative; integrates ISC2 CBK and Code of Ethics; grows ISC2 Nigeria Chapter membership.</p>
                <p><strong>Ecosystem Partners:</strong> We spotlight and collaborate with organisations like AltSchool Africa and SkillUp — building a collective movement for youth employability across Nigeria.</p>
                <p><strong>Alumni Outcomes:</strong> Stage 5+ alumni gain job-readiness programmes and industry connections. Finalists receive mentorship, laptops, certifications, and priority hiring placement.</p>
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
