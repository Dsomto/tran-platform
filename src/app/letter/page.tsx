"use client";

import { LogoMark } from "@/components/logo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
});

export default function LetterPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="fixed top-6 right-6 z-50 print:hidden flex gap-3">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 px-6 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          Download as PDF
        </button>
      </div>

      {/* Letter content */}
      <div className="min-h-screen bg-gray-100 py-12 px-4 print:bg-white print:py-0 print:px-0">
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none">
          {/* Page content with proper margins for A4 */}
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
            <p className="text-[13px] text-gray-700 mb-8">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            {/* Recipient */}
            <div className="text-[13px] text-gray-800 leading-relaxed mb-8">
              <p className="font-semibold">The National Commissioner</p>
              <p>Nigeria Data Protection Commission (NDPC)</p>
              <p>No. 12 Clement Isong Street</p>
              <p>Asokoro, Abuja</p>
            </div>

            {/* Salutation */}
            <p className="text-[13px] text-gray-800 mb-6">
              Dear Dr. Vincent Olatunji,
            </p>

            {/* Subject */}
            <p className="text-[13px] font-bold text-gray-900 mb-6 underline underline-offset-4">
              RE: REQUEST FOR PARTNERSHIP AND SPONSORSHIP — UBUNTU BRIDGE INITIATIVE (UBI) CYBERSECURITY YOUTH INITIATIVE
            </p>

            {/* Body */}
            <div className="text-[13px] text-gray-800 leading-[1.85] space-y-4">
              <p>
                Following our recent conversation on LinkedIn, I write to formally present Ubuntu Bridge Initiative (UBI) to the Nigeria Data Protection Commission and to request the Commission&apos;s partnership and sponsorship support for our upcoming cohort.
              </p>

              <p className="font-bold text-gray-900 mt-6 mb-2">About UBI</p>
              <p>
                UBI is a free, fully remote, elimination-based cybersecurity internship programme designed to equip Nigerian and African youth with practical, job-ready cybersecurity skills. The programme runs over 10 stages across approximately 10 weeks, taking participants from foundational security concepts to advanced specialization in one of three tracks:
              </p>

              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>
                  <strong>SOC Analysis</strong> — Security operations, threat detection, incident response, SIEM operations
                </li>
                <li>
                  <strong>Ethical Hacking</strong> — Penetration testing, vulnerability assessment, offensive security
                </li>
                <li>
                  <strong>Governance, Risk &amp; Compliance (GRC)</strong> — ISO 27001, NIST CSF, data privacy, compliance auditing, risk assessment, and policy development
                </li>
              </ol>

              <p>
                The programme is competitive by design. Participants must meet strict performance benchmarks at every stage or face elimination, ensuring that only the most skilled and committed individuals emerge as finalists. Finalists are then made available to employers through our talent placement network.
              </p>

              <p className="font-bold text-gray-900 mt-6 mb-2">Our Track Record</p>
              <p>
                We have successfully executed a similar initiative in the past, reaching <strong>over 1,500 Nigerian youths</strong> with hands-on cybersecurity training. Building on this proven model, we are now scaling UBI to reach <strong>5,000 youths</strong> in our next cohort.
              </p>

              <p className="font-bold text-gray-900 mt-6 mb-2">Relevance to the NDPC&apos;s Mandate</p>
              <p>
                We believe this initiative is directly aligned with the Commission&apos;s mandate under the Nigeria Data Protection Act (NDPA) 2023. Specifically:
              </p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>
                  The <strong>GRC track</strong> trains participants in the exact competencies required to implement and enforce data protection regulations — compliance auditing, risk assessment, policy development, and frameworks including ISO 27001, NIST, and GDPR
                </li>
                <li>
                  Nigeria&apos;s growing data protection ecosystem requires a pipeline of trained professionals who understand regulatory compliance at a practical level — UBI builds that pipeline
                </li>
                <li>
                  Supporting this initiative positions the NDPC as an institution actively investing in the capacity building needed to operationalise data protection across Nigeria
                </li>
              </ul>

              <p className="font-bold text-gray-900 mt-6 mb-2">Our Request</p>
              <p>
                We respectfully request the Commission&apos;s support in the following areas:
              </p>

              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>
                  <strong>Sponsorship funding</strong> to cover certification costs for participants and programme logistics. This will ensure that qualifying participants receive recognised industry certifications upon completion, increasing their employability and the programme&apos;s impact.
                </li>
                <li>
                  <strong>Institutional endorsement</strong> of the programme, which will strengthen its credibility and encourage wider participation among Nigerian youths.
                </li>
              </ol>

              <p>In return, the NDPC brand and logo will be prominently featured across:</p>

              <ul className="list-disc pl-6 space-y-1 my-4">
                <li>The UBI platform and website</li>
                <li>All certificates issued to participants</li>
                <li>Programme materials and communications</li>
                <li>Social media campaigns and public announcements</li>
                <li>Any events or presentations related to the programme</li>
              </ul>

              <p className="font-bold text-gray-900 mt-6 mb-2">Conclusion</p>
              <p>
                This partnership presents an opportunity for the Commission to make a visible, high-impact investment in Nigeria&apos;s cybersecurity workforce — particularly in the data protection and compliance domain that falls directly within the NDPC&apos;s purview. We are confident that this collaboration will be mutually beneficial and will contribute meaningfully to the Commission&apos;s goals.
              </p>

              <p>
                We would welcome the opportunity to present a detailed proposal or to schedule a meeting at your convenience to discuss this further.
              </p>

              <p>
                Thank you for your time and consideration, sir.
              </p>
            </div>

            {/* Sign-off */}
            <div className="mt-12 text-[13px] text-gray-800">
              <p>Yours faithfully,</p>

              {/* Signature — cursive style */}
              <div className={`mt-6 mb-2 ${dancingScript.className}`}>
                <p className="text-[32px] leading-none text-gray-900">
                  Okoma Somto
                </p>
              </div>

              <div className="w-56 border-t border-gray-400 pt-2">
                <p className="font-bold">Okoma Somtochukwu</p>
                <p>Head of Program</p>
                <p>Ubuntu Bridge Initiative (UBI)</p>
                <p>09153203421</p>
                <p>dsomto891@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
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
