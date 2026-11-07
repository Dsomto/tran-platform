"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Loader2,
  Megaphone,
  Palette,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  volunteerDepartments,
  type VolunteerDepartmentId,
} from "@/lib/volunteer-departments";

const departmentIcons = {
  "sponsorship-partnerships": BriefcaseBusiness,
  "mentorship-career-support": GraduationCap,
  "community-operations": UsersRound,
  "assessment-grading": BookOpenCheck,
  "curriculum-learning-design": Sparkles,
  "programme-operations": HeartHandshake,
  "design-creative": Palette,
  "communications-social-media": Megaphone,
  "technology-platform": Code2,
  "research-quality-impact": BarChart3,
} satisfies Record<VolunteerDepartmentId, typeof BriefcaseBusiness>;

const accentClasses = {
  blue: "border-blue/30 bg-blue-light/45 text-blue dark:bg-blue-light/55",
  emerald: "border-emerald/30 bg-emerald-light/45 text-emerald dark:bg-emerald-light/55",
  cyan: "border-cyan/30 bg-cyan-light/45 text-cyan-dark dark:bg-cyan-light/55",
  amber: "border-amber/30 bg-amber-light/50 text-amber-dark dark:bg-amber-light/55",
  violet: "border-violet/30 bg-violet-light/45 text-violet dark:bg-violet-light/55",
  rose: "border-rose/30 bg-rose-light/50 text-rose dark:bg-rose-light/55",
} as const;

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  timeZone: string;
  currentRole: string;
  organisation: string;
  ubiRelationship: string;
  primaryDepartment: string;
  secondaryDepartment: string;
  weeklyAvailability: string;
  linkedinUrl: string;
  portfolioUrl: string;
  experienceSummary: string;
  motivation: string;
  contributionPlan: string;
  relevantExample: string;
  referralSource: string;
  conflictDisclosure: string;
  website: string;
  commitmentAccepted: boolean;
  conductAccepted: boolean;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  timeZone: "WAT (UTC+1)",
  currentRole: "",
  organisation: "",
  ubiRelationship: "",
  primaryDepartment: "",
  secondaryDepartment: "",
  weeklyAvailability: "",
  linkedinUrl: "",
  portfolioUrl: "",
  experienceSummary: "",
  motivation: "",
  contributionPlan: "",
  relevantExample: "",
  referralSource: "",
  conflictDisclosure: "",
  website: "",
  commitmentAccepted: false,
  conductAccepted: false,
};

export function VolunteerPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDepartment = useMemo(
    () => volunteerDepartments.find((department) => department.id === form.primaryDepartment),
    [form.primaryDepartment]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseDepartment(id: VolunteerDepartmentId) {
    update("primaryDepartment", id);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "We could not submit your application. Please try again.");
        return;
      }
      setSubmitted(true);
      setForm(initialForm);
      requestAnimationFrame(() =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
    } catch {
      setError("The connection dropped before we could save your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="relative min-h-[76vh] overflow-hidden pt-16 flex items-end shadow-[inset_0_-1px_0_rgba(255,255,255,.18)]">
        <Image
          src="/images/programs/mentorship.jpg"
          alt="Ubuntu Bridge Initiative community members collaborating"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_72%] sm:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,18,33,.94)_0%,rgba(7,18,33,.74)_50%,rgba(7,18,33,.28)_100%)]" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pb-14 md:pb-16 pt-28">
          <div className="max-w-3xl text-white">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_10px_30px_rgba(0,0,0,.12)] backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]" />
              Cohort 2 volunteer team
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.04] tracking-normal max-w-3xl">
              Help us build the programme people remember.
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-8 text-slate-200">
              UBI Cohort 2 needs people who will own real work: finding partners, mentoring talent,
              running the community, grading fairly, building curriculum, designing, communicating,
              improving the platform, and measuring impact.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#departments"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_14px_34px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Find your department <ArrowDown className="h-4 w-4" />
              </a>
              <a
                href="#application"
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_12px_30px_rgba(0,0,0,.16)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                Apply to volunteer <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-b border-border bg-surface/90 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_18px_50px_rgba(15,23,42,.06)] backdrop-blur-xl" aria-label="Volunteer expectations">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 px-5 sm:px-8">
          {[
            ["Remote", "Serve from anywhere", UsersRound],
            ["3-10 hrs", "Depends on your team", Clock3],
            ["Accountable", "Own work and deadlines", ShieldCheck],
            ["Unpaid", "Service, not employment", HeartHandshake],
          ].map(([title, detail, Icon], index) => (
            <div
              key={String(title)}
              className={`py-5 ${index % 2 ? "pl-5 border-l border-border" : "pr-5"} ${
                index > 1 ? "border-t lg:border-t-0" : ""
              } lg:border-l lg:first:border-l-0 lg:px-6 lg:first:pl-0`}
            >
              <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg border border-blue/15 bg-blue-light/65 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_8px_20px_rgba(37,99,235,.1)]">
                <Icon className="h-4 w-4 text-blue" />
              </div>
              <p className="text-sm font-semibold text-foreground">{String(title)}</p>
              <p className="text-xs text-muted mt-0.5">{String(detail)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="departments" className="bg-scan scroll-mt-20 py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue mb-3">
                Where you can serve
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-normal text-foreground">
                Ten departments. Clear ownership.
              </h2>
            </div>
            <p className="text-base leading-7 text-muted max-w-2xl">
              Choose the team where you can produce the strongest work, not the title that sounds most
              impressive. Some roles are busiest before the cohort opens; others become intense during
              active stages. Every department works from written responsibilities and visible deadlines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {volunteerDepartments.map((department, index) => {
              const Icon = departmentIcons[department.id];
              return (
                <article
                  key={department.id}
                  className="group relative overflow-hidden rounded-lg border border-border/80 bg-surface/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_14px_38px_rgba(15,23,42,.07)] backdrop-blur-xl transition duration-300 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80 hover:-translate-y-1 hover:border-blue/35 hover:bg-surface hover:shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_22px_56px_rgba(37,99,235,.12)] dark:before:bg-white/15 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_10px_24px_rgba(15,23,42,.08)] ${accentClasses[department.accent]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold text-muted mb-1">
                            {String(index + 1).padStart(2, "0")}
                          </p>
                          <h3 className="text-lg font-semibold text-foreground tracking-normal">
                            {department.name}
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-full border border-border/80 bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted shadow-[inset_0_1px_0_rgba(255,255,255,.7)] backdrop-blur">
                          {department.commitment}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted">{department.summary}</p>
                      <ul className="mt-4 space-y-2">
                        {department.responsibilities.map((responsibility) => (
                          <li key={responsibility} className="flex gap-2 text-xs leading-5 text-foreground-muted">
                            <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald" />
                            {responsibility}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">
                        <strong className="font-semibold text-foreground">Strong fit:</strong> {department.idealFor}
                      </p>
                      <button
                        type="button"
                        onClick={() => chooseDepartment(department.id)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-blue/15 bg-blue-light/45 px-3.5 py-2 text-sm font-semibold text-blue shadow-[inset_0_1px_0_rgba(255,255,255,.75)] transition hover:border-blue/30 hover:bg-blue-light cursor-pointer"
                      >
                        Choose this team <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="application" className="scroll-mt-16 border-y border-border bg-surface/75 py-20 backdrop-blur md:py-24">
        <div ref={formRef} className="max-w-6xl mx-auto px-5 sm:px-8 scroll-mt-24">
          <div className="grid lg:grid-cols-[0.68fr_1.32fr] gap-10 lg:gap-14 items-start">
            <div className="rounded-lg border border-border/80 bg-background/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_18px_48px_rgba(15,23,42,.07)] backdrop-blur-xl lg:sticky lg:top-24 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue mb-3">
                Volunteer application
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-normal text-foreground">
                Tell us what you can own.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted">
                We value evidence, clarity, and reliability. A thoughtful application is more useful than
                a long one. Shortlisted volunteers will be invited to a team conversation before placement.
              </p>
              <div className="mt-7 space-y-3 text-sm text-foreground-muted">
                {[
                  "Choose one primary department",
                  "Show relevant work or a concrete example",
                  "Commit to a realistic weekly schedule",
                  "Expect onboarding and team accountability",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {submitted ? (
              <div className="rounded-lg border border-emerald/30 bg-emerald-light/35 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_20px_55px_rgba(5,150,105,.12)] backdrop-blur-xl sm:p-10">
                <CheckCircle2 className="h-10 w-10 text-emerald mb-5" />
                <h3 className="text-2xl font-bold text-foreground">Your application is with us.</h3>
                <p className="mt-4 text-sm leading-7 text-muted max-w-xl">
                  Thank you for offering your time to Cohort 2. We have sent a confirmation to your email.
                  The team will review your evidence, department fit, and availability before contacting
                  shortlisted volunteers.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-7 text-sm font-semibold text-blue hover:text-blue-dark"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="relative space-y-8 overflow-hidden rounded-lg border border-border/80 bg-background/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_24px_70px_rgba(15,23,42,.1)] backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white dark:before:bg-white/15 sm:p-8">
                <FormSection number="01" title="About you">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full name" required>
                      <input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" />
                    </Field>
                    <Field label="Email address" required>
                      <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
                    </Field>
                    <Field label="Phone number" required>
                      <input required value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" placeholder="Include country code" />
                    </Field>
                    <Field label="Country" required>
                      <input required value={form.country} onChange={(e) => update("country", e.target.value)} autoComplete="country-name" />
                    </Field>
                    <Field label="City">
                      <input value={form.city} onChange={(e) => update("city", e.target.value)} autoComplete="address-level2" />
                    </Field>
                    <Field label="Time zone" required>
                      <input required value={form.timeZone} onChange={(e) => update("timeZone", e.target.value)} placeholder="e.g. WAT (UTC+1)" />
                    </Field>
                    <Field label="Current role or field" required>
                      <input required value={form.currentRole} onChange={(e) => update("currentRole", e.target.value)} placeholder="e.g. SOC analyst, product designer, student" />
                    </Field>
                    <Field label="Organisation or school">
                      <input value={form.organisation} onChange={(e) => update("organisation", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Your relationship with UBI" required>
                    <select required value={form.ubiRelationship} onChange={(e) => update("ubiRelationship", e.target.value)}>
                      <option value="">Select one</option>
                      <option value="COHORT_1_PARTICIPANT">Cohort 1 participant</option>
                      <option value="PAST_VOLUNTEER">Past UBI volunteer or contributor</option>
                      <option value="MENTOR_OR_GRADER">Past mentor or grader</option>
                      <option value="PARTNER_OR_SPONSOR">Partner or sponsor representative</option>
                      <option value="NEW_TO_UBI">New to UBI</option>
                    </select>
                  </Field>
                </FormSection>

                <FormSection number="02" title="Where you want to serve">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Primary department" required hint="This is the team we will assess you for first.">
                      <select required value={form.primaryDepartment} onChange={(e) => update("primaryDepartment", e.target.value)}>
                        <option value="">Select a department</option>
                        {volunteerDepartments.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Secondary department" hint="Optional. Choose only if you are genuinely suited to both.">
                      <select value={form.secondaryDepartment} onChange={(e) => update("secondaryDepartment", e.target.value)}>
                        <option value="">No secondary choice</option>
                        {volunteerDepartments
                          .filter((department) => department.id !== form.primaryDepartment)
                          .map((department) => (
                            <option key={department.id} value={department.id}>{department.name}</option>
                          ))}
                      </select>
                    </Field>
                  </div>
                  {selectedDepartment && (
                    <div className="rounded-lg border border-blue/25 bg-blue-light/30 p-4 text-sm">
                      <p className="font-semibold text-foreground">{selectedDepartment.name}</p>
                      <p className="mt-1 leading-6 text-muted">{selectedDepartment.summary}</p>
                      <p className="mt-2 text-xs font-medium text-blue">Expected rhythm: {selectedDepartment.commitment}</p>
                    </div>
                  )}
                  <Field label="Weekly availability" required>
                    <select required value={form.weeklyAvailability} onChange={(e) => update("weeklyAvailability", e.target.value)}>
                      <option value="">Select a realistic commitment</option>
                      <option value="3-5_HOURS">3-5 hours per week</option>
                      <option value="6-8_HOURS">6-8 hours per week</option>
                      <option value="9-12_HOURS">9-12 hours per week</option>
                      <option value="12_PLUS_HOURS">More than 12 hours per week</option>
                    </select>
                  </Field>
                </FormSection>

                <FormSection number="03" title="Evidence and contribution">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="LinkedIn profile">
                      <input type="url" value={form.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
                    </Field>
                    <Field label="Portfolio, GitHub, or work sample">
                      <input type="url" value={form.portfolioUrl} onChange={(e) => update("portfolioUrl", e.target.value)} placeholder="https://..." />
                    </Field>
                  </div>
                  <Field label="Relevant experience and skills" required hint="What have you done that prepares you for this department?">
                    <textarea required rows={5} maxLength={1800} value={form.experienceSummary} onChange={(e) => update("experienceSummary", e.target.value)} />
                  </Field>
                  <Field label="Why do you want to volunteer for Cohort 2?" required>
                    <textarea required rows={4} maxLength={1400} value={form.motivation} onChange={(e) => update("motivation", e.target.value)} />
                  </Field>
                  <Field label="What would you take ownership of in your first four weeks?" required hint="Be concrete: name an output, process, or problem you would own.">
                    <textarea required rows={4} maxLength={1400} value={form.contributionPlan} onChange={(e) => update("contributionPlan", e.target.value)} />
                  </Field>
                  <Field label="Give one example of reliable work you have delivered" required hint="Explain the situation, your responsibility, and the result. Links can go above.">
                    <textarea required rows={4} maxLength={1400} value={form.relevantExample} onChange={(e) => update("relevantExample", e.target.value)} />
                  </Field>
                </FormSection>

                <FormSection number="04" title="Final details">
                  <Field label="How did you hear about this volunteer call?">
                    <input value={form.referralSource} onChange={(e) => update("referralSource", e.target.value)} />
                  </Field>
                  <Field label="Conflict of interest or access needs" hint="Optional. Share any relationship, limitation, or accommodation we should consider.">
                    <textarea rows={3} maxLength={1000} value={form.conflictDisclosure} onChange={(e) => update("conflictDisclosure", e.target.value)} />
                  </Field>

                  <div className="absolute left-[-9999px]" aria-hidden="true">
                    <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} /></label>
                  </div>

                  <label className="flex items-start gap-3 text-sm leading-6 text-foreground-muted cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={form.commitmentAccepted}
                      onChange={(e) => update("commitmentAccepted", e.target.checked)}
                      className="mt-1 h-4 w-4 accent-blue"
                    />
                    <span>I understand this is an unpaid volunteer role and I can meet the commitment I selected.</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm leading-6 text-foreground-muted cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={form.conductAccepted}
                      onChange={(e) => update("conductAccepted", e.target.checked)}
                      className="mt-1 h-4 w-4 accent-blue"
                    />
                    <span>I agree to protect participant information, follow the UBI code of conduct, declare conflicts, and accept quality review.</span>
                  </label>
                </FormSection>

                {error && (
                  <div role="alert" className="rounded-lg border border-danger/25 bg-danger/5 p-4 text-sm text-danger">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_14px_32px_rgba(37,99,235,.24)] transition hover:-translate-y-0.5 hover:bg-blue-dark hover:shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_18px_38px_rgba(37,99,235,.3)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
                  {submitting ? "Submitting application" : "Submit volunteer application"}
                </button>
                <p className="text-center text-xs leading-5 text-muted">
                  We use this information only to review, place, and communicate with Cohort 2 volunteers.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue mb-3">Before you apply</p>
            <h2 className="text-3xl font-bold tracking-normal text-foreground">A few honest answers.</h2>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {[
              ["Is volunteering paid?", "No. These are unpaid service roles. We define responsibilities and time expectations clearly so nobody is surprised or quietly overloaded."],
              ["Do I need to be a cybersecurity expert?", "Only some departments require deep security experience. Grading, curriculum, and technical mentoring do. Design, operations, communications, partnerships, technology, and impact roles are assessed against their own professional requirements."],
              ["Can Cohort 1 participants apply?", "Yes. Cohort 1 participants understand the experience unusually well, but prior participation does not guarantee placement. Show the team what you can contribute now."],
              ["Can I choose more than one department?", "Choose one primary department and, if it is genuinely realistic, one secondary option. We place people based on evidence, availability, team needs, and conflicts of interest."],
              ["What happens after I apply?", "You will receive an email confirmation. The programme team will review applications, invite shortlisted people to a brief team conversation, and confirm responsibilities during onboarding."],
            ].map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-semibold text-foreground">
                  {question}
                  <span className="text-xl font-normal text-blue transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-5 flex items-center gap-3 text-lg font-semibold text-foreground">
        <span className="font-mono text-xs text-blue">{number}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
      </span>
      {hint && <span className="mb-2 block text-xs leading-5 text-muted">{hint}</span>}
      <div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-border [&_input]:bg-surface/90 [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:text-sm [&_input]:text-foreground [&_input]:shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_6px_18px_rgba(15,23,42,.04)] [&_input]:outline-none [&_input]:transition [&_input]:focus:border-blue [&_input]:focus:ring-2 [&_input]:focus:ring-blue/15 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-border [&_select]:bg-surface/90 [&_select]:px-3.5 [&_select]:py-2.5 [&_select]:text-sm [&_select]:text-foreground [&_select]:shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_6px_18px_rgba(15,23,42,.04)] [&_select]:outline-none [&_select]:transition [&_select]:focus:border-blue [&_select]:focus:ring-2 [&_select]:focus:ring-blue/15 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-surface/90 [&_textarea]:px-3.5 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:leading-6 [&_textarea]:text-foreground [&_textarea]:shadow-[inset_0_1px_0_rgba(255,255,255,.75),0_6px_18px_rgba(15,23,42,.04)] [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:focus:border-blue [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-blue/15">
        {children}
      </div>
    </label>
  );
}
