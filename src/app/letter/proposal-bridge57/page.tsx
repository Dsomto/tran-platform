"use client";

import { LogoMark } from "@/components/logo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
});

export default function Bridge57ProposalPage() {
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
                <p>ubuntubridgeinitiatives.org</p>
              </div>
            </div>

            {/* Date */}
            <p className="text-[13px] text-gray-700 mb-8">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            {/* Recipient */}
            <div className="text-[13px] text-gray-800 leading-relaxed mb-8">
              <p className="font-semibold">Madam Roseline Ilori, M.CIoD CDPO</p>
              <p>Bridge57</p>
              <p>Via email: info@bridge57.com</p>
            </div>

            {/* Salutation */}
            <p className="text-[13px] text-gray-800 mb-6">Dear Madam Roseline,</p>

            {/* Subject */}
            <p className="text-[13px] font-bold text-gray-900 mb-6 underline underline-offset-4">
              PARTNERSHIP PROPOSAL — THE ROOT ACCESS NETWORK (TRAN) × BRIDGE57: A GRC TALENT PIPELINE
            </p>

            <div className="text-[13px] text-gray-800 leading-[1.85] space-y-4">

              <p>
                Thank you for your response, and congratulations once again on Bridge57&apos;s ATO accreditation. That is a meaningful signal for data-protection capacity on the continent, and I do not take lightly the work that milestone represents.
              </p>

              <p>
                You asked me to shed more light on TRAN&apos;s offerings, how Bridge57 fits in, and what the benefits of partnership would be. This letter is my attempt to answer those three questions fully, so you can reach a decision without needing a follow-up call — though I would welcome one.
              </p>

              {/* ── WHO WE ARE ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Who We Are</p>

              <p>
                <strong>The Root Access Network (TRAN)</strong> is a nonprofit organisation building a cybersecurity talent pipeline from communities currently underrepresented in the African digital workforce. We run one flagship programme — the <strong>Ubuntu Bridge Initiative (UBI)</strong> — a free, selective cybersecurity internship. UBI is where the training happens; TRAN is the entity that raises funding, pays for infrastructure, and signs partnership agreements like this one.
              </p>

              <p>
                We are fully free to participants. No tuition. No hidden fees. Selection is on merit, not on prior credentials. Our 2025 foundational cohort trained over <strong>1,000 participants</strong>. Our 2026 target is <strong>5,000</strong>, with expansion into secondary schools and underserved communities where cybersecurity is not yet visible as a career path.
              </p>

              {/* ── GRC TRACK ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">The GRC Track — Where Our Work Meets Yours</p>

              <p>
                Every UBI participant begins in a shared five-stage foundation covering Linux, applied cryptography, web application security, incident response, and governance. Those who complete the foundation choose one of three specialist tracks at Stage 5. One of those tracks is <strong>Governance, Risk &amp; Compliance (GRC)</strong> — and that is where UBI and Bridge57 share the same body of knowledge, often word for word.
              </p>

              <p>
                Participants who qualify for the GRC track study what your corporate clients actually need in their Data Protection Officers and compliance teams:
              </p>

              <ul className="list-disc pl-6 space-y-1.5 my-4">
                <li>ISO/IEC 27001 — information security management systems</li>
                <li>NIST Cybersecurity Framework — risk-based control design</li>
                <li><strong>NDPA</strong> (Nigeria Data Protection Act) — the most important regulatory stack for any Nigerian-facing DPO today</li>
                <li>GDPR — for clients with cross-border data flows</li>
                <li>Risk registers, control matrices, and audit-ready documentation</li>
                <li>Privacy Impact Assessments (PIAs) and DPIAs</li>
                <li>Incident response and breach notification workflows</li>
              </ul>

              <p>
                Every GRC graduate has written — and had graded by a practitioner — a risk assessment, a compliance finding report, and a board-facing communication. They arrive at their first job ready to do the work, not ready to start learning the work.
              </p>

              {/* ── WHY BRIDGE57 ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Why I Am Writing Specifically to Bridge57</p>

              <p>
                Three reasons. First, your ATO accreditation gives this partnership a credibility we cannot provide ourselves. A UBI graduate who subsequently earns a Bridge57 certification is materially more employable than one holding only our programme completion.
              </p>

              <p>
                Second, you train Data Protection Officers; we produce people who want to be Data Protection Officers. That is rare alignment. Most cybersecurity training organisations in Africa cover technical tracks at the expense of the compliance track that Bridge57 specialises in — we deliberately fund and prioritise GRC equally.
              </p>

              <p>
                Third, both Bridge57 and TRAN are African-first organisations. Our participants see a Bridge57 partnership as proof that the local ecosystem is coherent — that training does not end in a dead-end certificate, but connects to practitioners who can carry them further. That values alignment is rarer than it should be.
              </p>

              {/* ── COLLABORATION PATHS ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Three Collaboration Paths</p>

              <p>
                I have structured these from lightest-touch to deepest. We can begin with any one. They are not mutually exclusive.
              </p>

              <p className="font-semibold mt-3">Path A — Certification Scholarships for UBI Finalists</p>
              <p>
                Bridge57 sponsors the certification fees for a cohort of ten to twenty top UBI GRC graduates per year. In exchange, Bridge57 is listed as the exclusive certification partner on every UBI GRC communication, and receives first-look access to this talent for Bridge57&apos;s hiring and corporate-client placement. Cost is predictable; visibility is substantial.
              </p>

              <p className="font-semibold mt-3">Path B — Co-branded GRC Curriculum Module</p>
              <p>
                One Stage 5 GRC module is co-designed and co-branded as UBI × Bridge57. Bridge57 contributes one or two subject-matter videos, live office-hours with DPO practitioners, and the canonical NDPA case-study library. We provide the platform, the participants, and the scenario engine that grades them. Both brands appear on the module completion certificate. The cost is time, not money.
              </p>

              <p className="font-semibold mt-3">Path C — Placement Pipeline Agreement</p>
              <p>
                TRAN commits to sending top GRC graduates to Bridge57 for first-round DPO interviews or the certification pathway. Bridge57 offers preferential pricing — or full sponsorship at your discretion — for these graduates. We track placement outcomes jointly and publish them in an annual joint impact report. This path is story-driven and best suited for external positioning.
              </p>

              {/* ── VALUE ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Why This Is Worth Twenty Minutes of Your Time</p>

              <p>
                A decision on paths A through C eventually costs Bridge57 money, time, or commitment. In exchange, Bridge57 receives four concrete things that are otherwise expensive to acquire.
              </p>

              <p>
                <strong>A filtered, pre-vetted talent pipeline.</strong> Every UBI GRC finalist has been screened through four foundation stages, chosen GRC over two alternatives, been graded by practitioners, and produced written work Bridge57 can actually read before investing. Cold candidate sourcing is replaced with a warm, compliance-literate pipeline.
              </p>

              <p>
                <strong>A differentiated story for your corporate clients.</strong> Every Bridge57 client ultimately asks: &quot;where do we hire the DPOs you just certified?&quot; A Bridge57 × UBI pipeline is a concrete answer. Your sales conversation gains a closing line: &quot;we do not just certify, we source and certify through a programme of 5,000 vetted African youth.&quot; That is a commercial advantage, not a tagline.
              </p>

              <p>
                <strong>Social impact attribution without building a CSR programme.</strong> Partnership with a nonprofit cybersecurity internship for underserved African youth is a genuine story that carries weight in enterprise pitches and donor conversations alike. We have already built the programme; Bridge57 gets to co-own the impact.
              </p>

              <p>
                <strong>Certification volume without customer acquisition cost.</strong> If Bridge57 sponsors certification vouchers under Path A, every sponsored intern becomes a Bridge57-branded certified DPO. That is sustained visibility and enterprise-pricing leverage for roughly the cost of exam vouchers you might otherwise spend acquiring comparable candidates.
              </p>

              {/* ── RISK ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">On Risk</p>

              <p>
                Downside exposure for Bridge57 is limited. UBI is free to participants, so there is no participant-liability exposure inherited through the partnership. If the programme underperforms, Bridge57 can pause or end the arrangement at the next cycle. The only genuine reputational risk is a UBI graduate misrepresenting their credentials — which is precisely why the certification gateway in Path A is <em>protective</em> for Bridge57 rather than a concession.
              </p>

              {/* ── ASK ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What I Am Asking For</p>

              <p>
                A twenty-minute call at your convenience, during which I will walk you through the platform and the live GRC curriculum. If there is a fit, we can agree a pilot shape in the same conversation. If there is not, we part respectfully and I will not press further.
              </p>

              <p>
                I can also share the full 2026 programme proposal deck if helpful. A reply to this letter is all it takes.
              </p>

              {/* ── TIMING ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">A Note on Timing</p>

              <p>
                The UBI 2026 cohort opens in Q2. If Bridge57 is to be reflected in the materials, communications, and graduate-facing artefacts of that cohort, the practical decision window is three to four weeks. I flag this not as pressure, but to be honest about what &quot;yes&quot; looks like if we reach it.
              </p>

              <p>
                Thank you for considering this, and thank you for the work you are already doing for the space.
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
