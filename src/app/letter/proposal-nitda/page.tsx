"use client";

import { LogoMark } from "@/components/logo";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
});

export default function ProposalNitdaPage() {
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
              <p className="font-semibold">Mr. Kashifu Inuwa Abdullahi, CCIE</p>
              <p>Director-General &amp; Chief Executive Officer</p>
              <p>National Information Technology Development Agency (NITDA)</p>
              <p><em>Nigeria&apos;s Chief Information Technology Officer</em></p>
              <p>Federal Ministry of Communications, Innovation &amp; Digital Economy</p>
              <p>Abuja, Nigeria</p>
            </div>

            {/* Salutation */}
            <p className="text-[13px] text-gray-800 mb-6">Dear Director-General,</p>

            {/* Subject */}
            <p className="text-[13px] font-bold text-gray-900 mb-6 underline underline-offset-4">
              FUNDING &amp; PARTNERSHIP REQUEST — THE ROOT ACCESS NETWORK (TRAN): A ONE-OF-A-KIND CHANCE TO TRANSFORM 8,000+ NIGERIAN YOUTHS THROUGH CYBERSECURITY
            </p>

            {/* Body */}
            <div className="text-[13px] text-gray-800 leading-[1.85] space-y-4">

              <p>
                I write directly, sir, to introduce <strong>The Root Access Network (TRAN)</strong> and to formally request the financial sponsorship, certification support and institutional backing of the National Information Technology Development Agency (NITDA) for what is genuinely <strong>a chance to transform the lives of 8,000+ Nigerian youths</strong> through practical, job-ready cybersecurity training in 2026 — free of charge.
              </p>

              <p>
                As Nigeria&apos;s <strong>Chief Information Technology Officer</strong>, you have already shown — through the <strong>3 Million Technical Talent (3MTT)</strong> programme and the <strong>NITDA-Cisco free cybersecurity training initiative</strong> — that the Federal Government understands the urgency of building a digitally skilled workforce. TRAN serves exactly that national priority, and partnership with NITDA would allow us to reach far more young Nigerians, faster, and with greater depth than either of us can achieve alone.
              </p>

              <p>
                Let me be direct, sir: <strong>we need money, we need sponsors, we need certifications, and we need partners willing to back this at scale.</strong> We currently hold <strong>₦2,000,000</strong> in committed funding — enough to keep the lights on, nowhere near enough to deliver at the scale Nigeria needs. We are also actively in conversations with the <strong>Nigeria Data Protection Commission (NDPC)</strong> on alignment with national data-protection capacity-building, and with the <strong>ISC2 Nigeria Chapter</strong> on certification and mentor support. We are building a coalition of partners around the 2026 cohort, and we would be deeply honoured to count NITDA as the lead institutional partner in that coalition.
              </p>

              <p>
                There is, quite simply, <strong>no other initiative like this in the country.</strong> A free, fully-remote, 10-stage, elimination-based cybersecurity programme that takes a young Nigerian from zero to job-ready and ushers them toward globally-recognised credentials does not exist anywhere else at this scale. TRAN is genuinely one of a kind — and with NITDA&apos;s backing, it can become the cybersecurity arm of Nigeria&apos;s national digital-skills agenda.
              </p>

              {/* ── THE PROBLEM ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">The Problem: A National Skills Emergency</p>

              <p>
                Nigeria does not have a resource problem — we have a <strong>skills problem</strong>. There are over 3.5 million unfilled cybersecurity positions globally, and Africa remains one of the most underrepresented regions. Our youth have the hunger and talent, but they lack access to structured, hands-on training that leads to employment.
              </p>

              <p>
                Cybercrime costs Africa over <strong>$4 billion annually</strong>. Nigeria, as the continent&apos;s largest digital economy, bears a disproportionate share of this burden. The same young people vulnerable to recruitment by cybercriminals could become the professionals who protect our national digital infrastructure — if given the right opportunity. TRAN is that opportunity.
              </p>

              {/* ── ABOUT TRAN ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">About The Root Access Network</p>

              <p>
                TRAN is a free, fully remote, 10-stage elimination-based cybersecurity internship programme. Participants specialise in one of three tracks:
              </p>

              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li><strong>SOC Analysis</strong> — Threat detection, SIEM operations, incident response</li>
                <li><strong>Ethical Hacking</strong> — Penetration testing, vulnerability assessment, offensive security</li>
                <li><strong>Governance, Risk &amp; Compliance (GRC)</strong> — ISO 27001, NIST, data privacy, compliance auditing</li>
              </ol>

              <p>
                The programme is competitive by design — participants must meet strict performance benchmarks at every stage or face elimination — producing professionals who are ready for day-one impact in Nigeria&apos;s cybersecurity workforce.
              </p>

              <p>
                But we do not stop at online training. We go into <strong>secondary schools</strong>, <strong>universities</strong>, and <strong>underserved communities</strong> — literally under bridges and at bus stops — to introduce cybersecurity as a career to young people who have never considered it. This grassroots approach complements NITDA&apos;s own nationwide digital literacy efforts.
              </p>

              <p>
                We also believe in lifting the entire ecosystem. We spotlight and collaborate with organisations like <strong>AltSchool Africa</strong> and <strong>SkillUp</strong> — because every initiative that makes Nigerian youths more employable strengthens the nation&apos;s digital economy.
              </p>

              {/* ── TRACK RECORD ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Our Track Record</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Trained <strong>over 1,000 Nigerian youths</strong> in cybersecurity in 2024</li>
                <li>Featured in <strong>BusinessDay Nigeria</strong> for our impact in youth cybersecurity development</li>
                <li>Currently holding <strong>₦2 million</strong> in committed funding — far short of what 8,000+ youths require</li>
                <li>In active conversations with the <strong>Nigeria Data Protection Commission (NDPC)</strong> and the <strong>ISC2 Nigeria Chapter</strong> on alignment with national data-protection capacity-building and global cybersecurity certifications</li>
                <li>Scaling to <strong>8,000+ youths</strong> in 2026 — our most ambitious cohort, designed to be Nigeria&apos;s largest single cybersecurity training intake</li>
              </ul>

              <p>
                We started with almost nothing. We did not wait for perfect conditions — we trained over 1,000 youths on a shoestring budget because the need was too urgent to wait. Now we are asking NITDA, openly, for the institutional support required to reach the scale Nigeria&apos;s cybersecurity workforce truly demands.
              </p>

              {/* ── ALIGNMENT WITH NITDA ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Alignment with NITDA&apos;s Strategic Priorities</p>

              <p>
                TRAN&apos;s work directly supports several of NITDA&apos;s ongoing initiatives:
              </p>

              <ul className="list-disc pl-6 space-y-3 my-4">
                <li>
                  <strong>3MTT Programme:</strong> TRAN can serve as a cybersecurity-focused implementation partner, providing specialised training that feeds into the 3MTT talent pipeline. Our elimination-based model ensures that only the most committed participants graduate — raising the quality bar for Nigeria&apos;s technical workforce.
                </li>
                <li>
                  <strong>NITDA-Cisco Cybersecurity Training:</strong> Our three-track specialisation model (SOC, Ethical Hacking, GRC) complements Cisco&apos;s foundational cybersecurity curriculum by providing deeper, role-specific, hands-on training that prepares participants for industry certifications and immediate employment.
                </li>
                <li>
                  <strong>National Digital Economy Policy:</strong> Every youth trained in cybersecurity is one less vulnerability in Nigeria&apos;s digital infrastructure and one more contributor to the digital economy. TRAN&apos;s under-the-bridge and school outreach programmes bring this mission to communities that government programmes sometimes struggle to reach.
                </li>
                <li>
                  <strong>Enugu &amp; State-level Initiatives:</strong> NITDA&apos;s recent training of 900 youths in Enugu demonstrates a commitment to state-level impact. TRAN&apos;s fully remote model can extend this reach to all 36 states simultaneously, at minimal marginal cost.
                </li>
              </ul>

              {/* ── BUDGET ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Funding Requirement: ₦15 Million for 8,000+ Youths</p>

              <p>
                We need <strong>₦15 million</strong> to deliver this programme at the scale Nigeria requires. Against our current <strong>₦2M</strong> in committed funds, that leaves a <strong>₦13M gap</strong>. Here is exactly where every naira goes:
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
                    <td className="py-2">Cybersecurity workshops at secondary schools and universities nationwide</td>
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

              {/* ── HOW NITDA CAN HELP ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We Are Asking NITDA For</p>

              <p>
                We are asking NITDA, openly and directly, for <strong>three things: money, official recognition, and certification leverage.</strong> Any combination would be transformative — but we are being clear about the scale of need.
              </p>

              <ol className="list-decimal pl-6 space-y-3 my-4">
                <li>
                  <strong>Direct grant or sponsorship:</strong> A federal grant or NITDA-led sponsorship covering all or part of the <strong>₦13M funding gap</strong>. Even ₦5M unlocks the certifications and laptops pillars; ₦13M closes the gap entirely and lets us deliver the full 8,000+ cohort with no compromise.
                </li>
                <li>
                  <strong>3MTT integration:</strong> Recognise TRAN as the cybersecurity training partner under 3MTT. Our 8,000+ trainees would count directly toward national 3MTT targets, and 3MTT&apos;s reach would amplify our applicant pipeline nationwide.
                </li>
                <li>
                  <strong>Corporate sponsor introductions:</strong> NITDA&apos;s relationships with Cisco, CompTIA, Microsoft, MTN, Globacom, banks and federal contractors are exactly the network we need. Two or three warm introductions could close the funding gap entirely.
                </li>
                <li>
                  <strong>Subsidised certification vouchers:</strong> Leverage NITDA&apos;s existing certification-body relationships to secure CompTIA Security+, CEH, ISO 27001, and ISC2 CC/SSCP exam vouchers for our top finalists at scale.
                </li>
                <li>
                  <strong>Official endorsement &amp; co-branding:</strong> A formal NITDA endorsement letter — co-branded materials, shared media, NITDA logo on certificates issued — unlocks credibility that no marketing budget can buy and accelerates every other partnership we are pursuing.
                </li>
                <li>
                  <strong>State-level coordination:</strong> Help us extend outreach into states where NITDA already has digital literacy infrastructure. Our fully-remote model means national scale at near-zero marginal cost.
                </li>
                <li>
                  <strong>Federal placement pathway:</strong> A commitment from NITDA, EFCC, NITDA-CERT, NIMC and other federal cyber-relevant bodies to interview TRAN finalists for entry-level cybersecurity roles.
                </li>
              </ol>

              <p>
                We started this initiative with ₦2 million and a conviction that Nigerian youths deserve a real path into the profession. We trained over 1,000 in our first year. With NITDA&apos;s sponsorship and recognition, sir, we can turn that into <strong>8,000+ trained, certified, employable Nigerian cybersecurity professionals in 2026 alone</strong> — and we can do it under the federal banner.
              </p>

              {/* ── WHAT WE OFFER ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">What We Offer in Return</p>

              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>NITDA branding across the TRAN platform, website, and all certificates issued</li>
                <li>Quarterly impact reports with verifiable data on youth trained, certifications earned, and employment outcomes</li>
                <li>A named scholarship track (e.g. &quot;The NITDA Cybersecurity Scholars&quot;)</li>
                <li>Pipeline of pre-vetted, job-ready cybersecurity professionals for government and private sector placement</li>
                <li>Joint media coverage and press releases highlighting the partnership</li>
                <li>Invitation for NITDA leadership to address participants at orientation and graduation events</li>
              </ul>

              {/* ── CLOSING ── */}
              <p className="font-bold text-gray-900 mt-6 mb-2">Next Steps</p>

              <p>
                I am formally requesting a 30-minute audience with you, sir, or your designated officer — at NITDA&apos;s offices in Abuja or virtually — to present this initiative in more detail and discuss a concrete sponsorship and recognition partnership for the 2026 cohort. I am ready to travel to Abuja at your earliest convenience.
              </p>

              <p>
                We are not too proud to start small. We started under bridges and at bus stops, and we will keep going regardless. But the truth is this: <strong>without serious institutional backing, 8,000+ Nigerian youths cannot be served at the depth this work demands.</strong> A one-of-a-kind initiative deserves a one-of-a-kind partner — and as Nigeria&apos;s Chief Information Technology Officer, sir, you are uniquely positioned to make that decision.
              </p>

              <p>
                Thank you for your time and consideration, Director-General. Whatever you decide, we are grateful for the work NITDA is already doing for Nigeria&apos;s digital future.
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
                  { val: "8,000+", label: "Target for 2026" },
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
                <p><strong>NITDA Alignment:</strong> Directly supports 3MTT targets, complements NITDA-Cisco cybersecurity training, extends reach to underserved communities across all 36 states.</p>
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
