import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  Crosshair,
  FileCheck,
  TrendingUp,
  BookOpen,
  Users,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";

interface TrackData {
  name: string;
  tagline: string;
  color: string;
  colorHex: string;
  icon: LucideIcon;
  description: string;
  whyThisTrack: string;
  demand: string;
  heroImage: string;
  tools: string[];
  stages: { num: number; title: string; desc: string }[];
  roles: { title: string; desc: string }[];
  skills: string[];
}

const trackData: Record<string, TrackData> = {
  soc: {
    name: "SOC Analysis",
    tagline: "Be the first line of defense. Detect threats before they become breaches.",
    color: "cyan",
    colorHex: "#0891B2",
    icon: Eye,
    heroImage: "/images/tracks/soc-analyst.jpg",
    description:
      "Security Operations Center analysts are the watchful eyes of any organization. You'll learn to monitor networks in real-time, detect anomalies using SIEM platforms, investigate alerts, and coordinate incident response. This track prepares you for the 24/7 world of threat detection.",
    whyThisTrack:
      "SOC roles are the most common entry point into cybersecurity. Every company with a network needs someone watching it. The demand is massive, the career path is clear, and the skills you build here transfer to every other security domain. If you want to start working in cybersecurity fast, this is your track.",
    demand: "35% YoY growth in demand",
    tools: ["Splunk", "ELK Stack / Elastic SIEM", "YARA Rules", "MITRE ATT&CK Framework", "Wireshark", "CrowdStrike Falcon", "Suricata / Snort IDS", "TheHive"],
    stages: [
      { num: 5, title: "SOC Foundations", desc: "SIEM architecture, log ingestion pipelines, alert triage workflow. Build your first detection rule." },
      { num: 6, title: "Threat Detection Labs", desc: "Hands-on labs with real attack data. Analyze malware traffic, phishing campaigns, and lateral movement." },
      { num: 7, title: "Advanced Threat Hunting", desc: "Proactive hunting with custom queries. Threat intelligence integration, IOC correlation, and YARA authoring." },
      { num: 8, title: "SOC Team Operations", desc: "Run a simulated SOC. Shift handoffs, escalation protocols, runbooks, and cross-team coordination." },
      { num: 9, title: "Capstone: Live Incident", desc: "Respond to a multi-stage attack scenario judged by industry SOC managers. Present your findings." },
    ],
    roles: [
      { title: "SOC Analyst (Tier 1-3)", desc: "Monitor, triage, and escalate security alerts across enterprise networks" },
      { title: "Threat Intelligence Analyst", desc: "Research emerging threats, track adversary TTPs, and produce actionable intelligence" },
      { title: "Incident Responder", desc: "Lead investigations during active security incidents and coordinate containment" },
      { title: "Detection Engineer", desc: "Build and tune detection rules, reduce false positives, and automate alert workflows" },
    ],
    skills: ["Log analysis & correlation", "SIEM administration", "Alert triage & escalation", "Malware traffic analysis", "Threat intelligence feeds", "Incident documentation", "Forensic evidence preservation", "Communication under pressure"],
  },
  "ethical-hacking": {
    name: "Ethical Hacking",
    tagline: "Think like an attacker. Hack with permission. Break things to make them stronger.",
    color: "amber",
    colorHex: "#D97706",
    icon: Crosshair,
    heroImage: "/images/tracks/ethical-hacking.jpg",
    description:
      "Ethical hackers — also known as penetration testers — are hired to attack systems before real attackers do. You'll learn to enumerate targets, exploit vulnerabilities in web apps, networks, and APIs, escalate privileges, and write professional pentest reports. This track teaches you the offensive mindset.",
    whyThisTrack:
      "Ethical hacking is one of the most in-demand and exciting paths in cybersecurity. Companies need people who can find their weaknesses before criminals do. Bug bounty platforms alone pay out over $40M annually. If you love puzzles, reverse engineering, and the thrill of a shell, this is your track.",
    demand: "32% YoY growth in demand",
    tools: ["Burp Suite Pro", "Metasploit Framework", "Nmap / Masscan", "Kali Linux", "Gobuster / ffuf", "BloodHound", "Cobalt Strike", "Hashcat / John"],
    stages: [
      { num: 5, title: "Pentest Foundations", desc: "Reconnaissance, scanning, enumeration. Learn the pentest methodology and set up your attack lab." },
      { num: 6, title: "Web Application Hacking", desc: "Exploit OWASP Top 10 vulns in live lab environments. SQL injection, XSS, SSRF, auth bypass, and more." },
      { num: 7, title: "Network & Infrastructure", desc: "Internal network pentesting. Active Directory attacks, privilege escalation, pivoting, and lateral movement." },
      { num: 8, title: "Red Team Operations", desc: "Multi-stage attack simulations in team format. Social engineering, C2 frameworks, and evasion techniques." },
      { num: 9, title: "Capstone: Full Pentest", desc: "Complete a professional pentest engagement. Scope, test, document, and present to a panel of security leaders." },
    ],
    roles: [
      { title: "Penetration Tester", desc: "Assess security of web apps, networks, and infrastructure through authorized testing" },
      { title: "Red Team Operator", desc: "Simulate advanced persistent threats to test an organization's detection and response" },
      { title: "Security Researcher", desc: "Discover zero-day vulnerabilities and develop exploits for responsible disclosure" },
      { title: "Bug Bounty Hunter", desc: "Find and report vulnerabilities in public programs for rewards" },
    ],
    skills: ["Vulnerability assessment", "Exploit development", "Web application testing", "Network penetration testing", "Active Directory attacks", "Report writing", "Social engineering awareness", "Scripting (Python, Bash)"],
  },
  grc: {
    name: "GRC",
    tagline: "Build the policies that protect organizations. Where security meets strategy.",
    color: "emerald",
    colorHex: "#059669",
    icon: FileCheck,
    heroImage: "/images/tracks/grc.png",
    description:
      "Governance, Risk & Compliance professionals are the strategists of cybersecurity. You'll learn to assess organizational risk, build security policies, manage compliance programs (SOC 2, ISO 27001, NIST), conduct audits, and communicate security posture to executives and regulators.",
    whyThisTrack:
      "Every company that handles data needs GRC. With regulations multiplying globally (GDPR, CCPA, DORA, NIS2), the demand for compliance professionals is exploding. GRC roles often lead directly to CISO positions. If you want to shape security strategy rather than just execute it, this is your track.",
    demand: "28% YoY growth in demand",
    tools: ["ISO 27001", "NIST Cybersecurity Framework", "SOC 2 Type II", "Risk Registers", "ServiceNow GRC", "OneTrust", "Vanta", "Drata"],
    stages: [
      { num: 5, title: "GRC Foundations", desc: "Risk management frameworks, security governance structures, and regulatory landscape overview." },
      { num: 6, title: "Compliance Programs", desc: "Build a SOC 2 compliance program from scratch. Gap analysis, control mapping, evidence collection." },
      { num: 7, title: "Risk Assessment", desc: "Quantitative and qualitative risk assessments. Third-party risk management, vendor security reviews." },
      { num: 8, title: "Policy & Audit", desc: "Write security policies, conduct internal audits, and prepare for external audit readiness." },
      { num: 9, title: "Capstone: Full GRC Program", desc: "Design a complete GRC program for a fictional company. Present to a panel of CISOs and compliance leaders." },
    ],
    roles: [
      { title: "GRC Analyst", desc: "Map controls to frameworks, manage compliance evidence, and support audit readiness" },
      { title: "Compliance Manager", desc: "Own compliance programs end-to-end, coordinate with engineering and legal teams" },
      { title: "Risk Manager", desc: "Identify, assess, and mitigate organizational risks across technology and operations" },
      { title: "Security Program Manager", desc: "Drive security initiatives across the org, align security strategy with business goals" },
    ],
    skills: ["Risk assessment methodology", "Compliance framework mapping", "Policy development", "Internal audit procedures", "Vendor risk management", "Executive communication", "Control design & testing", "Regulatory interpretation"],
  },
};

const colorClasses: Record<string, { bg: string; text: string; border: string; badge: string; badgeText: string; accent: string }> = {
  cyan: { bg: "bg-cyan", text: "text-cyan", border: "border-cyan/20", badge: "bg-cyan-light", badgeText: "text-cyan-dark", accent: "bg-cyan/[0.07]" },
  amber: { bg: "bg-amber", text: "text-amber", border: "border-amber/20", badge: "bg-amber-light", badgeText: "text-amber-dark", accent: "bg-amber/[0.07]" },
  emerald: { bg: "bg-emerald", text: "text-emerald", border: "border-emerald/20", badge: "bg-emerald-light", badgeText: "text-emerald-dark", accent: "bg-emerald/[0.07]" },
};

export async function generateStaticParams() {
  return [{ slug: "soc" }, { slug: "ethical-hacking" }, { slug: "grc" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const track = trackData[slug];
  if (!track) return { title: "Track Not Found" };
  return {
    title: `${track.name} Track — UBI`,
    description: track.tagline,
  };
}

export default async function TrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = trackData[slug];
  if (!track) notFound();

  const c = colorClasses[track.color];
  const Icon = track.icon;

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative bg-background bg-scan overflow-hidden py-20 sm:py-28">
          <div className="crosshair top-[15%] right-[12%] hidden lg:block" aria-hidden="true" />
          <div className="crosshair bottom-[20%] left-[8%] hidden lg:block" aria-hidden="true" />
          <div className={`orb orb-${track.color} w-[350px] h-[350px] top-[5%] right-[0%] hidden lg:block`} aria-hidden="true" />
          <div className="orb orb-blue w-[200px] h-[200px] bottom-[10%] left-[5%] hidden lg:block" style={{ animationDelay: "-7s" }} aria-hidden="true" />
          <div className="ring-dashed w-[120px] h-[120px] bottom-[15%] right-[15%] ring-spin hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <Link href="/#tracks" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to all tracks
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${c.accent} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-7 h-7 ${c.text}`} />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                      {track.name}
                    </h1>
                  </div>
                </div>
                <p className={`text-base sm:text-lg font-medium ${c.text} mb-4`}>{track.tagline}</p>
                <p className="text-base text-muted leading-relaxed">{track.description}</p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <div className={`glass-card rounded-xl px-5 py-3 flex items-center gap-3 border-l-4 ${c.border}`}>
                    <TrendingUp className={`w-5 h-5 ${c.text}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{track.demand}</p>
                    </div>
                  </div>
                  <div className={`glass-card rounded-xl px-5 py-3 flex items-center gap-3 border-l-4 ${c.border}`}>
                    <Users className={`w-5 h-5 ${c.text}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">1,000+ members</p>
                    </div>
                  </div>
                  <div className={`glass-card rounded-xl px-5 py-3 flex items-center gap-3 border-l-4 ${c.border}`}>
                    <Briefcase className={`w-5 h-5 ${c.text}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{track.roles.length} career paths</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero image */}
              <div className="hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden glass-card h-[350px]">
                  <Image
                    src={track.heroImage}
                    alt={`${track.name} professionals at work`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 500px, 0px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why this track */}
        <section className="relative bg-background bg-scan overflow-hidden py-20 sm:py-24 border-t border-border/40">
          <div className="hex-grid" aria-hidden="true" />
          <div className="crosshair top-[15%] right-[10%] hidden lg:block" aria-hidden="true" />
          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className={`text-xs font-medium ${c.text} uppercase tracking-[0.15em] mb-3`}>Why this track</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
                  Why choose {track.name}?
                </h2>
                <p className="text-base text-muted leading-relaxed">{track.whyThisTrack}</p>

                <div className="mt-8">
                  <Link
                    href="/apply"
                    className={`group inline-flex items-center gap-2 text-sm font-semibold text-white ${c.bg} px-7 py-3.5 rounded-full hover:opacity-90 transition-all hover:shadow-lg`}
                  >
                    Apply for {track.name}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 ${c.text}`} />
                  Tools & Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {track.tools.map((tool) => (
                    <span key={tool} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${c.badge} ${c.badgeText}`}>
                      {tool}
                    </span>
                  ))}
                </div>

                <h3 className="text-sm font-semibold text-foreground mt-8 mb-4 flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${c.text}`} />
                  Skills You&apos;ll Build
                </h3>
                <ul className="space-y-2">
                  {track.skills.map((skill) => (
                    <li key={skill} className="flex items-start gap-2.5 text-sm text-muted">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.bg} mt-1.5 shrink-0`} />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum stages 5–9 */}
        <section className="relative bg-background bg-scan overflow-hidden py-20 sm:py-24 border-t border-border/40">
          <div className="crosshair bottom-[20%] left-[8%] hidden lg:block" aria-hidden="true" />
          <div className={`orb orb-${track.color} w-[250px] h-[250px] top-[10%] right-[5%] hidden lg:block`} aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />
          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <p className={`text-xs font-medium ${c.text} uppercase tracking-[0.15em] mb-3`}>Curriculum</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
              Stages 5 – 9: Your {track.name} journey
            </h2>
            <p className="text-base text-muted leading-relaxed max-w-2xl mb-12">
              Five intensive stages from foundations to a capstone judged by industry professionals.
            </p>

            <div className="space-y-0">
              {track.stages.map((stage, i) => (
                <div key={stage.num} className="flex gap-5 group">
                  <div className="relative flex flex-col items-center shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${c.accent} ${c.text}`}>
                      {stage.num}
                    </div>
                    {i < track.stages.length - 1 && (
                      <div className={`w-px flex-1 mt-2 ${c.bg} opacity-20`} />
                    )}
                  </div>
                  <div className="pb-10 pt-2">
                    <h3 className="text-base font-semibold text-foreground">{stage.title}</h3>
                    <p className="text-sm text-muted mt-1 leading-relaxed max-w-lg">{stage.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Career opportunities */}
        <section className="relative bg-background bg-scan overflow-hidden py-20 sm:py-24 border-t border-border/40">
          <div className="crosshair top-[12%] right-[10%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-blue w-[250px] h-[250px] bottom-[5%] left-[0%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />
          <div className="relative z-[1] max-w-6xl mx-auto px-5 sm:px-8">
            <p className={`text-xs font-medium ${c.text} uppercase tracking-[0.15em] mb-3`}>Career outcomes</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
              Where {track.name} takes you
            </h2>
            <p className="text-base text-muted leading-relaxed max-w-2xl mb-12">
              This track opens doors to some of the most in-demand roles in cybersecurity. Here are the career paths you can pursue.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              {track.roles.map((role) => (
                <div key={role.title} className={`glass-card rounded-2xl p-6 border-l-4 ${c.border}`}>
                  <h3 className="text-base font-semibold text-foreground mb-1">{role.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative bg-background bg-scan overflow-hidden py-20 sm:py-24 border-t border-border/40">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[100px] pointer-events-none`} style={{ backgroundColor: `${track.colorHex}08` }} aria-hidden="true" />
          <div className="crosshair top-[20%] left-[10%] hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />
          <div className="relative z-[1] max-w-2xl mx-auto px-5 sm:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
              Ready to start your {track.name} career?
            </h2>
            <p className="text-base text-muted leading-relaxed mb-8">
              Cohort 1 applications are open. Join the {track.name} track and start building real-world skills from day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/apply"
                className={`group inline-flex items-center justify-center gap-2 text-sm font-semibold text-white ${c.bg} px-8 py-3.5 rounded-full hover:opacity-90 transition-all hover:shadow-lg`}
              >
                Apply for {track.name}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/#tracks"
                className="inline-flex items-center justify-center text-sm font-medium text-foreground border border-border px-8 py-3.5 rounded-full hover:bg-surface-hover transition-colors"
              >
                Compare all tracks
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
