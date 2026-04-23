"use client";

import { LogoMark } from "@/components/logo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
});

export default function OnakoyaProposalPage() {
  return (
    <>
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
                <p>ubuntubridgeinitiatives.org</p>
              </div>
            </div>

            <p className="text-[13px] text-gray-700 mb-8">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            <div className="text-[13px] text-gray-800 leading-relaxed mb-8">
              <p className="font-semibold">Mr. Tunde Onakoya</p>
              <p>Founder &amp; Convener, Chess in Slums Africa</p>
              <p>Lagos, Nigeria</p>
            </div>

            <p className="text-[13px] text-gray-800 mb-6">Dear Tunde,</p>

            <p className="text-[13px] font-bold text-gray-900 mb-6 underline underline-offset-4">
              A REQUEST FOR YOUR HELP — UBI TRAINS 5,000 NIGERIAN YOUTH IN CYBERSECURITY, AT NO COST TO THEM
            </p>

            <div className="text-[13px] text-gray-800 leading-[1.85] space-y-4">

              <p>
                I will not open with flattery. I will say only this: the kids you have moved from Makoko, from Ikorodu, from the barber&apos;s shop where you learned chess yourself — that work has changed what is possible for the generation behind them. You have spent almost a decade proving, in public and at scale, that a Nigerian child&apos;s circumstance does not dictate their ceiling.
              </p>

              <p>
                I am writing to ask for your help with something adjacent to what you do. Not the same, but the same reason.
              </p>

              {/* ── WHO WE ARE ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Who We Are</p>

              <p>
                I run <strong>The Root Access Network (TRAN)</strong>. We are a nonprofit. Our flagship programme is the <strong>Ubuntu Bridge Initiative (UBI)</strong> — a free, selective cybersecurity internship for young Nigerians and Africans. Free to them, always. No tuition, no hidden fees, no participation cost.
              </p>

              <p>
                We trained over <strong>1,000 participants</strong> in our 2025 foundational cohort. We are scaling to <strong>5,000 in 2026</strong>, including expansion into secondary schools and underserved communities where cybersecurity is not yet visible as a career.
              </p>

              <p>
                We do with cybersecurity what you have done with chess. We believe merit travels further than circumstance. We believe the children from Ikorodu and Makoko and Oshodi can defend digital infrastructure as well as any child from Lekki, given the same access. What Chess in Slums proved on the board, UBI wants to prove in the keyboard.
              </p>

              {/* ── THE ASK ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">The Ask</p>

              <p>
                We need funding, and I am asking you directly. Not because you have the deepest pockets — I know you do not — but because you have something rarer: a demonstrated conviction about African youth and a platform that converts conviction into support. Anything you give or anything you move toward us matters more than its face value.
              </p>

              <p>
                Every naira, every dollar, goes directly to the participants. Nobody at TRAN takes a salary. Every administrative cost is volunteer-run. The money buys four things — in this order of priority:
              </p>

              {/* ── WHERE THE MONEY GOES ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Where Your Support Goes</p>

              <table className="w-full my-3 border-collapse text-[12px]">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 font-bold text-gray-900">Area</th>
                    <th className="text-left py-2 font-bold text-gray-900">What it funds</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold align-top">Professional certifications</td>
                    <td className="py-2">CompTIA Security+, ISO 27001 Foundation, CEH exam vouchers for the top participants who reach Stage 5. A single certification can change a young Nigerian&apos;s career overnight — nobody should be blocked from it because the voucher costs ₦250,000.</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold align-top">Weekly data scholarships</td>
                    <td className="py-2">Mobile data credits for participants whose household cannot sustain daily internet. The biggest reason our 2025 participants dropped out was not difficulty — it was data running out mid-stage. We fix that directly.</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold align-top">Laptops and hardware</td>
                    <td className="py-2">Refurbished laptops for high-performing participants who do not own one. Many of our best participants take Stage 0 on a shared phone. We want them on a keyboard by Stage 3.</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold align-top">Community &amp; school outreach</td>
                    <td className="py-2">Travelling to secondary schools, community centres, and underserved neighbourhoods — visiting children who have never considered cybersecurity because nobody told them it was possible. The same places your chessboards go, we want to follow with laptops.</td>
                  </tr>
                </tbody>
              </table>

              {/* ── WHY YOU ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Why I Am Writing to You Specifically</p>

              <p>
                Because you love helping young people, and you have not been subtle about it. Because when you stood at a chessboard in Times Square for sixty hours straight, you were not playing for yourself. You were playing for the kind of child who would otherwise never get a chance. We serve that same child — just at a different age, with a different tool.
              </p>

              <p>
                Because your voice amplifies. A single post, a single introduction to one of your funders, a single dinner where you mention us to the right person — any of those is worth more to UBI than months of my own outreach. If you do nothing more than read this letter and send one reply, I will be grateful.
              </p>

              {/* ── WHAT ANY AMOUNT DOES ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What Any Amount Does</p>

              <p>
                I am not going to pretend there is a minimum. I will tell you honestly what each tier buys:
              </p>

              <ul className="list-disc pl-6 space-y-1.5 my-3">
                <li><strong>₦50,000</strong> — one Security+ certification voucher for a top participant.</li>
                <li><strong>₦100,000</strong> — weekly data credits for twenty participants for one month.</li>
                <li><strong>₦500,000</strong> — one refurbished laptop for a high-performer who has been borrowing one.</li>
                <li><strong>₦1,000,000</strong> — a school outreach tour of four Lagos secondary schools, including equipment and volunteer stipends.</li>
                <li><strong>₦2,000,000</strong> — sponsors a full named cohort — e.g. &ldquo;The Onakoya Scholars&rdquo; — of ten participants through the entire programme, including certifications.</li>
              </ul>

              <p>
                If the number that feels right is smaller than any of these, that is fine. We started this programme with almost nothing.
              </p>

              {/* ── IN RETURN ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We Offer In Return</p>

              <ul className="list-disc pl-6 space-y-1.5 my-3">
                <li>Named recognition on our platform, graduation communications, and participants&apos; certificates.</li>
                <li>A named cohort or scholarship track in your honour, if you want one.</li>
                <li>Quarterly impact reports with participant names, stages reached, and certifications earned — sent to you directly.</li>
                <li>A referral channel for Chess in Slums alumni who are old enough to join UBI — they apply through a dedicated queue, and we track their outcomes back to you by name.</li>
                <li>Speaking or attendance slots at our orientation and graduation events.</li>
              </ul>

              {/* ── THE ASK AGAIN ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Next Steps</p>

              <p>
                A twenty-minute conversation. In person in Lagos if convenient, or on a call. I can walk you through the platform live, show you a participant&apos;s report, and answer anything this letter leaves unclear. If after that it is a no, I will respect it and follow your work quietly as I have been for the last six years.
              </p>

              <p>
                Thank you for reading this. Thank you for what you have already given to this country&apos;s children. We are trying to take the baton forward into the digital economy. Any help, at any size, gets us there faster.
              </p>
            </div>

            <div className="mt-12 text-[13px] text-gray-800">
              <p>With respect,</p>

              <div className={`mt-6 mb-2 ${dancingScript.className}`}>
                <p className="text-[32px] leading-none text-gray-900">
                  Okoma Somto
                </p>
              </div>

              <div className="w-64 border-t border-gray-400 pt-2">
                <p className="font-bold">Okoma Somtochukwu</p>
                <p>Founder, The Root Access Network (TRAN)</p>
                <p>Head of Programme, Ubuntu Bridge Initiative (UBI)</p>
                <p>09153203421</p>
                <p>somtochukwu.okoma@ethnoscyber.com</p>
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
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
        }
      `}</style>
    </>
  );
}
