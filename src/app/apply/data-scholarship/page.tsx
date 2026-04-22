"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Loader2, CheckCircle2, Heart, Wifi } from "lucide-react";

const countries = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Cameroon", "Egypt",
  "Tanzania", "Uganda", "Rwanda", "Ethiopia", "Senegal", "Côte d'Ivoire",
  "Zambia", "Zimbabwe", "Sierra Leone", "Liberia", "Other",
];

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all";
const selectClass = `${inputClass} appearance-none cursor-pointer`;
const labelClass = "block text-[13px] font-medium text-foreground mb-2";

export default function DataScholarshipPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    internCode: "",
    currentStage: "",
    dataSituation: "",
    reason: "",
    referralSource: "",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/scholarship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background bg-scan py-16">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white border border-border rounded-2xl p-8 text-center shadow-sm">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Application received
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Thank you. Your data scholarship application has been logged. Our team
                reviews every application individually. If approved, you will receive
                a confirmation email and your weekly data credits will begin shortly after.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue text-white font-medium hover:opacity-90"
              >
                Back to homepage
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background bg-scan py-12">
        <div className="max-w-3xl mx-auto px-4">
          <header className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue/10 text-blue text-xs font-semibold mb-4">
              <Heart className="h-3.5 w-3.5" /> Participant Support
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Apply for a Data Scholarship
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              TRAN provides weekly mobile data credits to participants for whom
              connectivity is the primary barrier to completing the programme.
              Awards are based on need and ongoing engagement — we prioritise
              participants who are actively moving through the stages.
            </p>
          </header>

          <div className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="mb-6 p-4 bg-blue/5 border border-blue/20 rounded-lg text-sm text-foreground/80 flex gap-3">
              <Wifi className="h-5 w-5 text-blue shrink-0" />
              <div>
                <strong className="text-foreground">How this works:</strong> selected
                participants receive mobile data top-ups weekly for as long as they
                remain active in the programme. We verify ongoing engagement at the
                end of each stage.
              </div>
            </div>

            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Full name *</label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className={inputClass}
                  maxLength={120}
                />
              </div>

              <div>
                <label className={labelClass}>Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Phone (for mobile top-up) *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass}
                  placeholder="+234…"
                />
              </div>

              <div>
                <label className={labelClass}>Country *</label>
                <select
                  required
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select country…</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Intern code{" "}
                  <span className="text-muted-foreground font-normal">
                    (if already enrolled)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.internCode}
                  onChange={(e) => update("internCode", e.target.value.toUpperCase())}
                  className={inputClass}
                  placeholder="UBI-2026-0001"
                  pattern="^UBI-\\d{4}-\\d+$"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Where are you in the programme?{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.currentStage}
                  onChange={(e) => update("currentStage", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Stage 2, Not started yet, Finished Stage 4"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Describe your current data situation *</label>
                <textarea
                  required
                  minLength={20}
                  maxLength={3000}
                  rows={4}
                  value={form.dataSituation}
                  onChange={(e) => update("dataSituation", e.target.value)}
                  className={inputClass}
                  placeholder="How do you currently access the internet? What does it cost you per week/month? Do you share a device or connection?"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Why do you need this scholarship? *</label>
                <textarea
                  required
                  minLength={20}
                  maxLength={3000}
                  rows={5}
                  value={form.reason}
                  onChange={(e) => update("reason", e.target.value)}
                  className={inputClass}
                  placeholder="Tell us, in your own words, what a weekly data top-up would change for you in this programme."
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  How did you hear about this scholarship?{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.referralSource}
                  onChange={(e) => update("referralSource", e.target.value)}
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="md:col-span-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 pt-4 border-t border-border flex items-center justify-end gap-3">
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue text-white font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit application
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            All scholarships are reviewed manually. We will email you the outcome.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
