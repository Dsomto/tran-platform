"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ArrowRight } from "lucide-react";
import { ApplicationClosed } from "./application-closed";
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

type WindowState = {
  isAcceptingApplications: boolean;
  reason: "open" | "not_yet_open" | "manually_closed" | "closed_past_deadline";
  opensAt: string | null;
  closesAt: string | null;
  note: string | null;
  secondsUntilOpen: number | null;
};

function ApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");

  // Window state: null while loading — we render a lightweight loading view so
  // the form doesn't flash before we know whether to show the countdown.
  const [windowState, setWindowState] = useState<WindowState | null>(null);

  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 60 });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/applications")
      .then((r) => r.json())
      .then((d: WindowState) => {
        if (!cancelled) setWindowState(d);
      })
      .catch(() => {
        // Fail open — show the form rather than block the funnel if the
        // status endpoint is down.
        if (!cancelled) {
          setWindowState({
            isAcceptingApplications: true,
            reason: "open",
            opensAt: null,
            closesAt: null,
            note: null,
            secondsUntilOpen: null,
          });
        }
      });
    return () => {
      cancelled = true;
    };
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
      setIsSubmitted(true);
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
            <div data-aos="fade-up" data-aos-delay="400" className="flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-foreground border border-border px-7 py-3.5 rounded-full hover:bg-surface-hover transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        </main>


        <Footer />
      </>
    );
  }

  // ── Closed / scheduled states — short-circuit before rendering the form ──
  if (windowState && !windowState.isAcceptingApplications) {
    return (
      <>
        <Navbar />
        <main id="main-content">
          <ApplicationClosed
            reason={windowState.reason as "not_yet_open" | "manually_closed" | "closed_past_deadline"}
            opensAt={windowState.opensAt}
            note={windowState.note}
          />
        </main>
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
