"use client";

import { LogoMark } from "@/components/logo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
});

export function LetterContent({ name, track }: { name: string; track: string }) {
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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

      {/* Letter */}
      <div className="min-h-screen bg-gray-100 py-12 px-4 print:bg-white print:py-0 print:px-0">
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none">
          <div className="px-16 py-14 print:px-[25mm] print:py-[20mm]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

            {/* Letterhead */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b-2 border-gray-800">
              <div className="flex items-center gap-3">
                <LogoMark size={36} />
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                    UBI
                  </h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em]" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                    Ubuntu Bridge Initiative
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-600 leading-relaxed">
                <p>Lagos, Nigeria</p>
                <p>info@ubinitiative.org</p>
              </div>
            </div>

            {/* Date */}
            <p className="text-[13px] text-gray-700 mb-8">{date}</p>

            {/* Recipient */}
            <div className="text-[13px] text-gray-800 leading-relaxed mb-8">
              <p className="font-semibold">{name}</p>
              <p>UBI Cybersecurity Internship Programme</p>
              <p>Cohort 1 — {track}</p>
            </div>

            {/* Salutation */}
            <p className="text-[13px] text-gray-800 mb-6">
              Dear {name.split(" ")[0]},
            </p>

            {/* Subject */}
            <p className="text-[13px] font-bold text-gray-900 mb-6 underline underline-offset-4">
              LETTER OF ACCEPTANCE — UBI CYBERSECURITY INTERNSHIP PROGRAMME (COHORT 1)
            </p>

            {/* Body */}
            <div className="text-[13px] text-gray-800 leading-[1.85] space-y-4">
              <p>
                On behalf of Ubuntu Bridge Initiative (UBI), I am pleased to inform you that your application to the <strong>UBI Cybersecurity Internship Programme</strong> has been <strong>accepted</strong>. Congratulations!
              </p>

              <p>
                After carefully reviewing all applications, you have been selected to join <strong>Cohort 1</strong> of our programme. We received an overwhelming number of applications and your profile stood out among them.
              </p>

              <p className="font-bold text-gray-900 mt-6 mb-2">Programme Details</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>
                  <strong>Orientation:</strong> Friday, 30th May 2025 — A mandatory virtual session where you will meet the team, understand the programme structure, receive your onboarding materials, and get set up for Stage 0.
                </li>
                <li>
                  <strong>Programme Start Date:</strong> Sunday, 1st June 2025 — The official start of the 10-stage programme.
                </li>
                <li>
                  <strong>Track:</strong> {track}
                </li>
                <li>
                  <strong>Format:</strong> Fully remote, self-paced within weekly deadlines. Performance-based progression through 10 stages.
                </li>
              </ul>

              <p className="font-bold text-gray-900 mt-6 mb-2">What You Stand to Gain</p>

              <p>UBI is designed to take you from foundational cybersecurity knowledge to job-ready expertise. Here is what awaits you at each milestone:</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>
                  <strong>Stage 5 — Alumni Community Access:</strong> If you successfully progress to Stage 5, you earn a place in the <strong>UBI Alumni Network</strong>. Our alumni community offers structured programmes designed to make you job-ready, access to exclusive workshops, and direct connections with industry professionals working in cybersecurity across Africa and globally.
                </li>
                <li>
                  <strong>Finalists — Top Tier Benefits:</strong> Participants who make it to the final stage will receive:
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li><strong>Mentorship</strong> — 1-on-1 mentorship from senior cybersecurity professionals</li>
                    <li><strong>Hardware</strong> — Laptops and devices to support your career development</li>
                    <li><strong>Priority Placement</strong> — You will be featured on our official <strong>Hire page</strong>, making you visible to employers. Finalists are prioritised first for job opportunities that come through our network.</li>
                  </ul>
                </li>
              </ul>

              <p className="font-bold text-gray-900 mt-6 mb-2">Important Notes</p>

              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>
                  Attendance at the <strong>orientation on 30th May</strong> is mandatory. Failure to attend may result in forfeiture of your spot.
                </li>
                <li>
                  The programme is elimination-based. You must meet the performance requirements at each stage to advance. There are no exceptions.
                </li>
                <li>
                  Further details, including the Slack workspace invite and onboarding guide, will be sent to you before orientation.
                </li>
              </ol>

              <p>
                We are excited to have you join UBI. This is the beginning of a journey that can reshape your career. Bring your best, stay committed, and make the most of this opportunity.
              </p>

              <p>
                Welcome aboard.
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

              <div className="w-56 border-t border-gray-400 pt-2">
                <p className="font-bold">Okoma Somtochukwu</p>
                <p>Head of Program</p>
                <p>Ubuntu Bridge Initiative (UBI)</p>
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
