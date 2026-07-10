"use client";

import { useState } from "react";

const SKILLS = [
  "Incident response",
  "Log & evidence analysis",
  "Threat hunting",
  "SIEM / detection engineering",
  "Vulnerability assessment",
  "Penetration testing",
  "GRC / compliance",
  "Security report writing",
  "MITRE ATT&CK mapping",
  "Scripting / automation",
];

const field =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue/40";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";
const help = "text-xs text-muted mb-2";

function Q({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {hint && <p className={help}>{hint}</p>}
      {children}
    </div>
  );
}

export function FeedbackForm({
  token,
  prefillName = "",
  prefillEmail = "",
  source,
}: {
  token?: string;
  prefillName?: string;
  prefillEmail?: string;
  source: "public" | "dashboard";
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  function toggleSkill(s: string) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      return v === null || v === "" ? null : Number(v);
    };
    const str = (k: string) => {
      const v = fd.get(k);
      return v === null || String(v).trim() === "" ? null : String(v).trim();
    };
    const payload = {
      token: token ?? null,
      source,
      name: str("name"),
      email: str("email"),
      employmentStatus: str("employmentStatus"),
      roleTitle: str("roleTitle"),
      employer: str("employer"),
      salaryBand: str("salaryBand"),
      timeToHire: str("timeToHire"),
      programmeHelped: str("programmeHelped"),
      npsScore: num("npsScore"),
      wouldRecommend: str("wouldRecommend"),
      confidenceBefore: num("confidenceBefore"),
      confidenceAfter: num("confidenceAfter"),
      mostHelpful: str("mostHelpful"),
      biggestChallenge: str("biggestChallenge"),
      howToImprove: str("howToImprove"),
      skillsGained: skills,
      testimonial: str("testimonial"),
      consentToShare: fd.get("consentToShare") === "on",
      feedbackProgrammeHead: str("feedbackProgrammeHead"),
      feedbackCoFounder: str("feedbackCoFounder"),
      feedbackProgrammeManager: str("feedbackProgrammeManager"),
      whereWorkGoal: str("whereWorkGoal"),
      supportNeeded: str("supportNeeded"),
      country: str("country"),
      gender: str("gender"),
      ageRange: str("ageRange"),
      employmentBefore: str("employmentBefore"),
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-3">
        <div className="text-4xl">🙏</div>
        <h2 className="text-xl font-bold text-foreground">Thank you</h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          Your feedback is recorded. It directly shapes how we run the next cohort and helps us
          make the case for more support. We are grateful you took the time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identity (only when we don't already know who this is) */}
      {!token && (
        <section className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Q label="Your name">
              <input name="name" required defaultValue={prefillName} className={field} placeholder="Full name" />
            </Q>
            <Q label="Email">
              <input name="email" type="email" required defaultValue={prefillEmail} className={field} placeholder="you@example.com" />
            </Q>
          </div>
        </section>
      )}

      {/* Career outcomes */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Where you are now</h3>
        <Q label="What best describes your current situation?">
          <select name="employmentStatus" className={field} defaultValue="">
            <option value="" disabled>Select one</option>
            <option value="employed_related">Employed in a cybersecurity / IT security role</option>
            <option value="employed_unrelated">Employed in another field</option>
            <option value="freelancing">Freelancing or consulting</option>
            <option value="internship">In an internship or apprenticeship</option>
            <option value="studying">Studying full-time</option>
            <option value="seeking">Still actively job-seeking</option>
            <option value="other">Other</option>
          </select>
        </Q>
        <div className="grid sm:grid-cols-2 gap-4">
          <Q label="Role / job title" hint="If you have one — leave blank if not.">
            <input name="roleTitle" className={field} placeholder="e.g. SOC Analyst" />
          </Q>
          <Q label="Employer / company" hint="Optional.">
            <input name="employer" className={field} placeholder="e.g. Sankofa Digital" />
          </Q>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Q label="How long after the programme did it take to land a role?">
            <select name="timeToHire" className={field} defaultValue="">
              <option value="" disabled>Select one</option>
              <option value="still_seeking">Still seeking</option>
              <option value="<1m">Under 1 month</option>
              <option value="1-3m">1 to 3 months</option>
              <option value="3-6m">3 to 6 months</option>
              <option value=">6m">Over 6 months</option>
            </select>
          </Q>
          <Q label="Monthly pay band" hint="Optional and private. Used only in aggregate.">
            <select name="salaryBand" className={field} defaultValue="">
              <option value="">Prefer not to say</option>
              <option value="<100k">Under ₦100k</option>
              <option value="100-300k">₦100k - ₦300k</option>
              <option value="300-600k">₦300k - ₦600k</option>
              <option value="600k-1m">₦600k - ₦1m</option>
              <option value=">1m">Over ₦1m</option>
            </select>
          </Q>
        </div>
        <Q label="Did this programme help you get there?">
          <div className="flex flex-wrap gap-3">
            {[["yes", "Yes, directly"], ["partly", "Partly"], ["no", "Not really"]].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="programmeHelped" value={v} className="accent-blue" />
                {l}
              </label>
            ))}
          </div>
        </Q>
      </section>

      {/* Programme impact */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-foreground">How the programme helped</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Q label="Confidence getting a security role — BEFORE" hint="1 = none, 5 = very confident">
            <select name="confidenceBefore" className={field} defaultValue="">
              <option value="" disabled>Select</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Q>
          <Q label="Confidence getting a security role — NOW" hint="1 = none, 5 = very confident">
            <select name="confidenceAfter" className={field} defaultValue="">
              <option value="" disabled>Select</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Q>
        </div>
        <Q label="Which skills did you gain or sharpen?" hint="Select all that apply.">
          <div className="grid sm:grid-cols-2 gap-2">
            {SKILLS.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer rounded-lg border border-border px-3 py-2 hover:bg-surface-hover">
                <input type="checkbox" checked={skills.includes(s)} onChange={() => toggleSkill(s)} className="accent-blue" />
                {s}
              </label>
            ))}
          </div>
        </Q>
        <Q label="What helped you the most?">
          <textarea name="mostHelpful" rows={3} className={field} placeholder="A stage, a task, the feedback, the community..." />
        </Q>
        <Q label="What was your biggest challenge?">
          <textarea name="biggestChallenge" rows={3} className={field} placeholder="Be honest — this is how we improve." />
        </Q>
        <Q label="How could we improve the programme?">
          <textarea name="howToImprove" rows={3} className={field} placeholder="Anything you would change or add." />
        </Q>
      </section>

      {/* Where you want to go — shapes the town hall sessions */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Where you want to go</h3>
        <Q label="Where would you like to work?" hint="The kind of role, company, or country you are aiming for.">
          <textarea name="whereWorkGoal" rows={3} className={field} placeholder="A SOC role, a consultancy, remote for a UK company..." />
        </Q>
        <Q label="What do you need from us to get there?" hint="We use these answers to shape the town hall sessions.">
          <textarea name="supportNeeded" rows={3} className={field} placeholder="Mentorship, CV review, interview practice, a specific skill..." />
        </Q>
      </section>

      {/* Feedback on the team */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-foreground">The team</h3>
        <p className="text-sm text-muted">
          Be candid. This is how the people running the programme get better, and it is read
          directly by them.
        </p>
        <Q label="The Head of Programme" hint="How has working with them been?">
          <textarea name="feedbackProgrammeHead" rows={3} className={field} placeholder="What worked, what did not." />
        </Q>
        <Q label="The Co-founder" hint="How has working with them been?">
          <textarea name="feedbackCoFounder" rows={3} className={field} placeholder="What worked, what did not." />
        </Q>
        <Q label="The Lead Programme Manager" hint="How has working with them been?">
          <textarea name="feedbackProgrammeManager" rows={3} className={field} placeholder="What worked, what did not." />
        </Q>
      </section>

      {/* Recommend + testimonial */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Would you recommend us?</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Q label="How likely are you to recommend this programme?" hint="0 = not at all, 10 = extremely likely">
            <select name="npsScore" className={field} defaultValue="">
              <option value="" disabled>Select</option>
              {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Q>
          <Q label="Would you recommend us to a friend?">
            <select name="wouldRecommend" className={field} defaultValue="">
              <option value="" disabled>Select</option>
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </Q>
        </div>
        <Q label="Leave a testimonial" hint="A sentence or two on your experience.">
          <textarea name="testimonial" rows={3} className={field} placeholder="Optional — but we would love to hear it." />
        </Q>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="consentToShare" className="accent-blue mt-0.5" />
          <span className="text-muted">You may quote my testimonial publicly (with my name and role).</span>
        </label>
      </section>

      {/* Demographics */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-foreground">A little about you</h3>
        <p className="text-xs text-muted">Optional. Helps us show who the programme reaches.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Q label="Country">
            <input name="country" className={field} placeholder="e.g. Nigeria" />
          </Q>
          <Q label="Gender">
            <select name="gender" className={field} defaultValue="">
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Q>
          <Q label="Age range">
            <select name="ageRange" className={field} defaultValue="">
              <option value="">Prefer not to say</option>
              <option value="under-18">Under 18</option>
              <option value="18-24">18 - 24</option>
              <option value="25-34">25 - 34</option>
              <option value="35-44">35 - 44</option>
              <option value="45+">45+</option>
            </select>
          </Q>
          <Q label="Before the programme, you were...">
            <select name="employmentBefore" className={field} defaultValue="">
              <option value="">Prefer not to say</option>
              <option value="student">A student</option>
              <option value="employed">Employed (other field)</option>
              <option value="unemployed">Unemployed</option>
              <option value="career-switch">Switching careers</option>
            </select>
          </Q>
        </div>
      </section>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto px-8 py-3 rounded-full bg-blue text-white font-semibold disabled:opacity-50 hover:bg-blue/90 transition"
      >
        {submitting ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}
