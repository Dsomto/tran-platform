"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ArrowRight } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

const ageRanges = ["16 – 19", "20 – 24", "25 – 30", "31 – 35", "36+"];

const countries = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Cameroon", "Egypt",
  "Tanzania", "Uganda", "Rwanda", "Ethiopia", "Senegal", "Côte d'Ivoire",
  "United Kingdom", "United States", "Canada", "India", "Other",
];

const statusOptions = [
  "University student",
  "Recent graduate",
  "NYSC member",
  "Employed (full-time)",
  "Employed (part-time)",
  "Freelancer / Self-employed",
  "Unemployed / Job seeking",
  "Other",
];

const trackOptions = [
  { value: "SOC Analysis", emoji: "🛡️", desc: "Threat detection, SIEM, incident response" },
  { value: "Ethical Hacking", emoji: "🎯", desc: "Penetration testing, offensive security" },
  { value: "GRC", emoji: "📋", desc: "Governance, risk & compliance" },
  { value: "Not sure yet", emoji: "🤔", desc: "I'll decide later" },
];

const inputClass = "w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all";
const selectClass = `${inputClass} appearance-none cursor-pointer`;
const labelClass = "block text-[13px] font-medium text-foreground mb-2";

export default function ApplyPageWrapper() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <main className="min-h-screen bg-background bg-scan flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    }>
      <ApplyPage />
    </Suspense>
  );
}

function ApplyPage() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState("");

  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 60 });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email") as string).trim();
    const confirmEmail = (fd.get("confirmEmail") as string).trim();

    if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
      setError("Email addresses do not match.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      fullName: fd.get("fullName") as string,
      email,
      country: fd.get("country") as string,
      ageRange: fd.get("ageRange") as string,
      gender: fd.get("gender") as string,
      currentStatus: fd.get("currentStatus") as string,
      experience: fd.get("experience") as string,
      trackInterest: fd.get("trackInterest") as string,
      dedication: fd.get("dedication") as string,
      goals: fd.get("goals") as string,
      referralSource: fd.get("referralSource") as string,
      ref: refCode || undefined,
    };

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
        return;
      }

      setSubmittedName(payload.fullName.split(" ")[0]);
      setMyReferralCode(data.referralCode || "");
      setIsSubmitted(true);
      setShowShare(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────
  if (isSubmitted) {
    return (
      <>
        <Navbar />
        <main className="relative min-h-screen flex items-center bg-background bg-scan overflow-hidden">
          <div className="orb orb-blue w-[350px] h-[350px] top-[10%] right-[15%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-cyan w-[200px] h-[200px] bottom-[20%] left-[10%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
          <div className="crosshair top-[20%] left-[12%] hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-xl mx-auto px-5 sm:px-8 py-32 w-full text-center">
            <div data-aos="fade-up">
              <span className="text-6xl block mb-6">🎉</span>
            </div>
            <h1 data-aos="fade-up" data-aos-delay="100" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              You&apos;re in, {submittedName}!
            </h1>
            <p data-aos="fade-up" data-aos-delay="200" className="text-base text-muted leading-relaxed mb-4">
              Your application to <strong className="text-foreground">UBI</strong> has been received successfully.
            </p>
            <div data-aos="fade-up" data-aos-delay="300" className="glass-card rounded-2xl p-6 text-left mb-4">
              <p className="text-sm text-muted leading-relaxed">
                <span className="text-lg mr-2" aria-hidden="true">📬</span>
                We&apos;ve sent a confirmation to your email. Our team will review your application carefully. If you pass the screening stage, we&apos;ll send you an email with your next steps — <strong className="text-foreground">keep an eye on your inbox</strong>.
              </p>
            </div>
            {myReferralCode && (
              <div data-aos="fade-up" data-aos-delay="350" className="glass-card rounded-2xl p-5 text-center mb-8 border border-blue/10">
                <p className="text-sm text-muted leading-relaxed mb-2">
                  <strong className="text-foreground">Share your referral link</strong> to get a headstart.
                  The more people who apply through you, the bigger your advantage in the early stages.
                </p>
                <p className="text-xs font-mono text-blue bg-blue/5 px-3 py-1.5 rounded-lg inline-block">
                  {myReferralCode}
                </p>
              </div>
            )}
            <div data-aos="fade-up" data-aos-delay="400" className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setShowShare(true)}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue px-7 py-3.5 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20 cursor-pointer"
              >
                Share with a friend
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </button>
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-foreground border border-border px-7 py-3.5 rounded-full hover:bg-surface-hover transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        </main>

        {/* ── Share popup ── */}
        {showShare && (() => {
          const referralLink = myReferralCode
            ? `https://ubinitiative.org/apply?ref=${myReferralCode}`
            : "https://ubinitiative.org/apply";
          const shareText = `I just applied to UBI — a free 10-week cybersecurity internship by Ubuntu Bridge Initiative. SOC, Ethical Hacking, or GRC tracks. Apply with my link for a headstart!`;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowShare(false)}>
              <div className="glass-card-elevated rounded-2xl p-8 max-w-sm w-full text-center animate-in" onClick={(e) => e.stopPropagation()}>
                <span className="text-5xl block mb-4">🚀</span>
                <h2 className="text-xl font-bold text-foreground mb-2">Share your referral link</h2>
                <p className="text-sm text-foreground/70 leading-relaxed mb-2">
                  The more people who apply with your link, the bigger your <strong className="text-blue">headstart</strong> in the programme.
                </p>
                <p className="text-xs text-foreground/50 mb-6">
                  Referrals give you priority and bonus points in early stages.
                </p>

                {/* Referral code display */}
                {myReferralCode && (
                  <div className="bg-blue/5 border border-blue/20 rounded-xl px-4 py-3 mb-5">
                    <p className="text-[11px] text-foreground/50 uppercase tracking-wider font-medium mb-1">Your referral code</p>
                    <p className="text-lg font-bold text-blue tracking-wider">{myReferralCode}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Copy link */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-blue/20 bg-blue/[0.03] hover:bg-blue/[0.08] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center shrink-0">
                      {copied ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{copied ? "Copied!" : "Copy referral link"}</p>
                      <p className="text-[11px] text-foreground/50 truncate max-w-[200px]">{referralLink.replace("https://", "")}</p>
                    </div>
                  </button>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} 🛡️\n\n${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors text-left"
                  >
                    <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                      <p className="text-[11px] text-foreground/50">Send to a friend or group</p>
                    </div>
                  </a>

                  {/* Twitter / X */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} 🛡️🔥\n\n${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left"
                  >
                    <span className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Twitter / X</p>
                      <p className="text-[11px] text-foreground/50">Post about it</p>
                    </div>
                  </a>

                  {/* SMS / iMessage */}
                  <a
                    href={`sms:?body=${encodeURIComponent(`Hey! ${shareText}\n\n${referralLink}`)}`}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors text-left"
                  >
                    <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Messages</p>
                      <p className="text-[11px] text-foreground/50">Send via SMS or iMessage</p>
                    </div>
                  </a>
                </div>

                <button
                  onClick={() => setShowShare(false)}
                  className="mt-5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                >
                  Maybe later
                </button>
              </div>
            </div>
          );
        })()}

        <Footer />
      </>
    );
  }

  // ── Application form ────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="relative min-h-[45svh] flex items-center bg-background bg-scan overflow-hidden">
          <div className="crosshair top-[20%] right-[15%] hidden lg:block" aria-hidden="true" />
          <div className="crosshair bottom-[25%] left-[10%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-blue w-[350px] h-[350px] top-[5%] right-[10%] hidden lg:block" aria-hidden="true" />
          <div className="orb orb-cyan w-[180px] h-[180px] bottom-[15%] left-[5%] hidden lg:block" style={{ animationDelay: "-5s" }} aria-hidden="true" />
          <div className="absolute bottom-[20%] right-[8%] w-3 h-3 bg-blue/15 rounded-full pulse-glow hidden lg:block" aria-hidden="true" />
          <div className="ring-dashed w-[120px] h-[120px] top-[60%] left-[8%] ring-spin hidden lg:block" aria-hidden="true" />
          <div className="hex-grid" aria-hidden="true" />

          <div className="relative z-[1] max-w-3xl mx-auto px-5 sm:px-8 pt-28 pb-10 w-full text-center">
            <div data-aos="fade-up">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-blue tracking-[0.15em] uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" aria-hidden="true" />
                Cohort 1 — Applications Open
              </span>
            </div>
            <h1 data-aos="fade-up" data-aos-delay="100" className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-foreground">
              Apply to <span className="text-blue">UBI</span>
            </h1>
            <p data-aos="fade-up" data-aos-delay="200" className="mt-5 text-base sm:text-lg text-muted leading-relaxed max-w-xl mx-auto">
              No account needed. Fill in the form below and we&apos;ll take it from there.
              It takes less than 5 minutes.
            </p>
          </div>
        </section>

        {/* Form section */}
        <section className="relative py-16 sm:py-20 bg-background bg-scan overflow-hidden">
          <div className="hex-grid" aria-hidden="true" />
          <div className="orb orb-amber w-[200px] h-[200px] top-[10%] left-[0%] hidden lg:block" style={{ animationDelay: "-8s" }} aria-hidden="true" />
          <div className="orb orb-emerald w-[160px] h-[160px] bottom-[5%] right-[0%] hidden lg:block" style={{ animationDelay: "-3s" }} aria-hidden="true" />

          <div className="relative z-[1] max-w-2xl mx-auto px-5 sm:px-8">
            <form onSubmit={handleSubmit} data-aos="fade-up" className="glass-card-elevated rounded-2xl p-8 sm:p-10">

              {/* ── Section 1: About You ── */}
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
                  <span aria-hidden="true">👤</span> About you
                </h2>
                <p className="text-[12px] text-muted mb-6">Basic information to identify your application.</p>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>Full name <span className="text-red-400">*</span></label>
                    <input type="text" id="fullName" name="fullName" required placeholder="e.g. Amina Bello" className={inputClass} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="email" className={labelClass}>Email address <span className="text-red-400">*</span></label>
                      <input type="email" id="email" name="email" required placeholder="you@example.com" className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="confirmEmail" className={labelClass}>Confirm email <span className="text-red-400">*</span></label>
                      <input type="email" id="confirmEmail" name="confirmEmail" required placeholder="Re-enter your email" className={inputClass} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    <div>
                      <label htmlFor="country" className={labelClass}>Country <span className="text-red-400">*</span></label>
                      <select id="country" name="country" required defaultValue="" className={selectClass}>
                        <option value="" disabled>Select</option>
                        {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ageRange" className={labelClass}>Age range <span className="text-red-400">*</span></label>
                      <select id="ageRange" name="ageRange" required defaultValue="" className={selectClass}>
                        <option value="" disabled>Select</option>
                        {ageRanges.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="gender" className={labelClass}>Gender <span className="text-muted text-[11px]">(optional)</span></label>
                      <select id="gender" name="gender" defaultValue="" className={selectClass}>
                        <option value="">Prefer not to say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="currentStatus" className={labelClass}>Current status <span className="text-red-400">*</span></label>
                    <select id="currentStatus" name="currentStatus" required defaultValue="" className={selectClass}>
                      <option value="" disabled>What are you doing right now?</option>
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Experience & Track ── */}
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
                  <span aria-hidden="true">🛡️</span> Experience &amp; track
                </h2>
                <p className="text-[12px] text-muted mb-6">Help us understand where you are and where you want to go.</p>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="experience" className={labelClass}>
                      Describe your cybersecurity experience <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="experience"
                      name="experience"
                      required
                      rows={3}
                      placeholder="Any courses, certifications, CTFs, labs, or self-study? It's okay if you're a complete beginner — just say so."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Which track interests you most? <span className="text-red-400">*</span></label>
                    <div className="grid sm:grid-cols-2 gap-3 mt-1">
                      {trackOptions.map((t) => (
                        <label
                          key={t.value}
                          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedTrack === t.value
                              ? "border-blue bg-blue/[0.04] ring-2 ring-blue/20"
                              : "border-border hover:border-blue/30 bg-background"
                          }`}
                        >
                          <input
                            type="radio"
                            name="trackInterest"
                            value={t.value}
                            required
                            className="mt-0.5 accent-blue"
                            onChange={() => setSelectedTrack(t.value)}
                          />
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              <span className="mr-1.5" aria-hidden="true">{t.emoji}</span>
                              {t.value}
                            </span>
                            <p className="text-[11px] text-muted mt-0.5">{t.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Commitment ── */}
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
                  <span aria-hidden="true">🔥</span> Commitment
                </h2>
                <p className="text-[12px] text-muted mb-6">We need to know you&apos;re serious.</p>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="dedication" className={labelClass}>
                      UBI is intensive and runs for 10 weeks. Will you dedicate your time? <span className="text-red-400">*</span>
                    </label>
                    <select id="dedication" name="dedication" required defaultValue="" className={selectClass}>
                      <option value="" disabled>Select your answer</option>
                      <option value="Yes — I'm fully committed and ready to put in the work">Yes — I&apos;m fully committed and ready to put in the work</option>
                      <option value="I'll try my best, but I have other commitments">I&apos;ll try my best, but I have other commitments</option>
                      <option value="I'm not sure yet">I&apos;m not sure yet</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="goals" className={labelClass}>
                      What do you want to get out of this programme? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="goals"
                      name="goals"
                      required
                      rows={4}
                      placeholder="Tell us what you're hoping to learn, achieve, or build through UBI..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 4: One more thing ── */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
                  <span aria-hidden="true">📎</span> One more thing
                </h2>
                <p className="text-[12px] text-muted mb-6">Optional — but helps us understand our reach.</p>

                <div>
                  <label htmlFor="referralSource" className={labelClass}>How did you hear about UBI?</label>
                  <select id="referralSource" name="referralSource" defaultValue="" className={selectClass}>
                    <option value="">Select (optional)</option>
                    <option value="Twitter / X">Twitter / X</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp group">WhatsApp group</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Friend or colleague">Friend or colleague</option>
                    <option value="University / school">University / school</option>
                    <option value="Google search">Google search</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue px-8 py-4 rounded-full hover:bg-blue-dark transition-all hover:shadow-lg hover:shadow-blue/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit application
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-muted text-center mt-4 leading-relaxed">
                By submitting, you agree to receive emails from UBI regarding your application status.
              </p>
            </form>

            {/* Info cards below form */}
            <div className="grid sm:grid-cols-3 gap-4 mt-8" data-aos="fade-up" data-aos-delay="100">
              {[
                { emoji: "✅", title: "100% Free", desc: "No fees, no hidden costs" },
                { emoji: "🌍", title: "Fully Remote", desc: "Join from anywhere" },
                { emoji: "⚡", title: "10 Weeks", desc: "Intensive, hands-on" },
              ].map((card) => (
                <div key={card.title} className="glass-card rounded-xl p-5 text-center">
                  <span className="text-2xl block mb-2" aria-hidden="true">{card.emoji}</span>
                  <p className="text-sm font-semibold text-foreground">{card.title}</p>
                  <p className="text-[12px] text-muted mt-1">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
