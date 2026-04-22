"use client";

import { LogoMark } from "@/components/logo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
});

export default function ProposalPage() {
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
              <p className="font-semibold">Mr. Michael Collins Ajereh (Don Jazzy)</p>
              <p>Via email: donbabaj@gmail.com</p>
            </div>

            {/* Salutation */}
            <p className="text-[13px] text-gray-800 mb-6">Dear Don Jazzy,</p>

            {/* Subject */}
            <p className="text-[13px] font-bold text-gray-900 mb-6 underline underline-offset-4">
              PARTNERSHIP PROPOSAL — THE ROOT ACCESS NETWORK (TRAN): TRAINING 5,000 NIGERIAN YOUTHS IN CYBERSECURITY
            </p>

            {/* Body */}
            <div className="text-[13px] text-gray-800 leading-[1.85] space-y-4">

              <p>
                I write to humbly introduce <strong>The Root Access Network (TRAN)</strong> — a free, fully remote cybersecurity training programme on a mission to equip <strong>5,000 Nigerian and African youths</strong> with practical, job-ready cybersecurity skills in 2025. We are reaching out because we believe in the power of community, and any level of support — no matter how small — would mean the world to us and the young people we serve.
              </p>

              {/* ── THE PROBLEM ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">The Problem: A Skills Crisis, Not a Resource Crisis</p>

              <p>
                Nigeria does not have a resource problem — we have a <strong>skills problem</strong>. There are over 3.5 million unfilled cybersecurity positions globally, and Africa is one of the most underrepresented regions. Our youth have the hunger and the talent, but they lack access to structured, hands-on training that makes them employable.
              </p>

              <p>
                Meanwhile, cybercrime costs Africa over <strong>$4 billion annually</strong>. The irony is that the same young people vulnerable to recruitment by cybercriminals could become the professionals who protect our digital infrastructure — if given the right opportunity. TRAN is that opportunity.
              </p>

              {/* ── ABOUT TRAN ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">About The Root Access Network</p>

              <p>
                TRAN is a 10-stage, elimination-based cybersecurity internship programme that takes participants from foundational concepts to advanced specialisation in one of three tracks:
              </p>

              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li><strong>SOC Analysis</strong> — Security operations, threat detection, SIEM, incident response</li>
                <li><strong>Ethical Hacking</strong> — Penetration testing, vulnerability assessment, offensive security</li>
                <li><strong>Governance, Risk &amp; Compliance (GRC)</strong> — ISO 27001, NIST, data privacy, compliance auditing</li>
              </ol>

              <p>
                The programme is competitive by design. Participants must meet strict performance benchmarks at every stage or face elimination, ensuring that only the most committed and skilled individuals emerge as finalists. This model mirrors real industry pressure and produces professionals who are ready for day-one impact.
              </p>

              <p>
                We also believe in lifting the entire ecosystem. We spotlight and partner with organisations like <strong>AltSchool Africa</strong> — which is transforming how young Africans access world-class tech education — and <strong>SkillUp</strong>, which equips thousands with practical, in-demand skills. We see this as a collective effort: every initiative that makes Nigerian youths more employable is a win for all of us.
              </p>

              {/* ── TRACK RECORD ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Our Track Record</p>

              <p>
                In 2024, we successfully trained <strong>over 1,000 Nigerian youths</strong> through TRAN. Our work was recognised and <strong>featured in BusinessDay</strong>, one of Nigeria&apos;s leading business publications, for our impact in youth cybersecurity development.
              </p>

              <p>
                Building on this proven model, we are now scaling to reach <strong>5,000 youths</strong> in 2025 — our most ambitious cohort yet.
              </p>

              {/* ── CURRENT FUNDING ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Current Funding &amp; The Gap</p>

              <p>
                We currently have <strong>₦2 million</strong> in funding, which covers basic programme operations — platform hosting, mentorship coordination, and initial outreach. However, reaching 5,000 youths with the depth and quality we are committed to requires significantly more.
              </p>

              {/* ── WHERE FUNDS GO ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Where Your Support Goes</p>

              <p>
                Every naira goes directly into building capacity and changing lives. Here is exactly how additional funding will be deployed:
              </p>

              <table className="w-full my-4 border-collapse text-[12px]">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 font-bold text-gray-900">Item</th>
                    <th className="text-left py-2 font-bold text-gray-900">Details</th>
                    <th className="text-right py-2 font-bold text-gray-900">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Professional Certifications</td>
                    <td className="py-2">CompTIA Security+, CEH, ISO 27001 Lead Auditor exam vouchers for top performers</td>
                    <td className="py-2 text-right whitespace-nowrap">₦4.5M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Laptops &amp; Hardware</td>
                    <td className="py-2">Devices for finalists and outstanding performers who lack personal equipment</td>
                    <td className="py-2 text-right whitespace-nowrap">₦4M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">School Outreach Programme</td>
                    <td className="py-2">Visiting secondary schools and universities to run cybersecurity awareness workshops and recruit talent</td>
                    <td className="py-2 text-right whitespace-nowrap">₦2M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Under-the-Bridge Initiative</td>
                    <td className="py-2">Taking cybersecurity education to underserved communities — street-level workshops for out-of-school youth, bus stops, and community centres</td>
                    <td className="py-2 text-right whitespace-nowrap">₦1.5M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Lab Infrastructure</td>
                    <td className="py-2">Cloud-based hacking labs, SIEM environments, and practice platforms for all 5,000 participants</td>
                    <td className="py-2 text-right whitespace-nowrap">₦1.5M</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 font-semibold">Mentorship &amp; Staffing</td>
                    <td className="py-2">Compensation for industry mentors, graders, and programme coordinators</td>
                    <td className="py-2 text-right whitespace-nowrap">₦1.5M</td>
                  </tr>
                  <tr className="border-t-2 border-gray-300">
                    <td className="py-2 font-bold text-gray-900" colSpan={2}>Total Estimated Need</td>
                    <td className="py-2 text-right font-bold text-gray-900 whitespace-nowrap">₦15M</td>
                  </tr>
                </tbody>
              </table>

              {/* ── THE VISION ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">The Vision: Cybersecurity as a Household Word</p>

              <p>
                Our goal is not just to train 5,000 people. It is to make cybersecurity a <strong>household conversation</strong> in Nigeria. We want every young Nigerian to know that there is a career path in protecting digital infrastructure — and that it is accessible to them regardless of their background.
              </p>

              <p>
                This is why we go beyond the online programme:
              </p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>
                  <strong>School outreach:</strong> We visit secondary schools and universities across Lagos, Abuja, and other states to introduce students to cybersecurity as a career. We run hands-on workshops where students experience what ethical hacking and security operations look like in practice.
                </li>
                <li>
                  <strong>Under-the-bridge education:</strong> We take cybersecurity education to the streets — literally. Our volunteers run workshops in underserved communities, bus stops, and community centres for out-of-school youth. If a young person has never touched a laptop, we start there. We believe in building bridges to opportunity for everyone.
                </li>
                <li>
                  <strong>Professional certifications:</strong> For participants who make it through the programme, we pay for globally recognised certification exams. A CompTIA Security+ or CEH certification can transform a young Nigerian&apos;s career overnight. We ensure that talent does not go uncertified because of money.
                </li>
                <li>
                  <strong>Laptops and equipment:</strong> Many of our most talented participants do not own a personal computer. We provide laptops to finalists and standout performers so that hardware is never the barrier between a young person and their career in cybersecurity.
                </li>
              </ul>

              {/* ── WHY DON JAZZY ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Why Your Support Matters</p>

              <p>
                You have built a career on discovering and amplifying Nigerian talent. From Mavin Records to your investments in technology, you have consistently shown that you believe in the potential of young Nigerians. This is the same belief that drives TRAN.
              </p>

              <p>
                Your support — whether through funding, amplification, or endorsement — would bring cybersecurity awareness to millions of young Nigerians who have never considered it as a career path. When someone with your influence says <em>&quot;cybersecurity matters&quot;</em>, young people listen.
              </p>

              <p>
                We are not asking you to fund everything. We started with almost nothing — ₦2 million and a conviction that Nigerian youths deserve better. We trained over 1,000 in our first year. We are asking for anything you are willing to give, no matter how small. ₦50,000 pays for a certification voucher. ₦500,000 equips a young person with a laptop. Every contribution, at every size, brings us closer to a Nigeria where our youth are building defences instead of being recruited to break them.
              </p>

              {/* ── WHAT WE OFFER ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We Offer in Return</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Prominent branding across the TRAN platform, website, and all certificates issued to participants</li>
                <li>Co-branded social media campaigns reaching our community of thousands</li>
                <li>A named cohort or scholarship track in your honour (e.g. &quot;The Don Jazzy Cybersecurity Scholars&quot;)</li>
                <li>Quarterly impact reports showing exactly how your support translated into trained professionals</li>
                <li>Speaking or attendance opportunities at our orientation and graduation events</li>
                <li>First access to our talent pool for any cybersecurity hiring needs across your portfolio companies</li>
              </ul>

              {/* ── CLOSING ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Next Steps</p>

              <p>
                I would be deeply grateful for the opportunity to present this initiative to you in more detail — either virtually or in person in Lagos. A 20-minute conversation is all I ask.
              </p>

              <p>
                We are not too proud to start small — we literally started under bridges. And we will keep going regardless. But with your support, no matter the size, we can go further and faster. Together, we can turn Nigeria&apos;s cybersecurity skills gap into a pipeline of world-class professionals.
              </p>

              <p>
                Thank you for your time and consideration, sir. Whatever you decide, we are grateful you read this far.
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

            {/* Appendix section */}
            <div className="mt-16 pt-8 border-t-2 border-gray-300">
              <p className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-4" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                Appendix — Programme Impact Summary
              </p>

              <div className="grid grid-cols-4 gap-4 my-6">
                {[
                  { val: "1,000+", label: "Youths trained in 2024" },
                  { val: "5,000", label: "Target for 2025" },
                  { val: "₦2M", label: "Current funding" },
                  { val: "3", label: "Specialisation tracks" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{stat.val}</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-gray-600 leading-relaxed space-y-2">
                <p><strong>Media Coverage:</strong> Featured in BusinessDay Nigeria for youth cybersecurity training impact.</p>
                <p><strong>Website:</strong> therootaccessnetwork.com</p>
                <p><strong>Programme Format:</strong> 10 stages, elimination-based, fully remote, 100% free for participants.</p>
                <p><strong>Alumni Outcomes:</strong> Stage 5+ alumni gain access to job-readiness programmes, workshops, and industry connections. Finalists receive mentorship, hardware, and priority hiring placement.</p>
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
