"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  FileCheck2,
  GraduationCap,
  Handshake,
  Loader2,
  Megaphone,
  Palette,
  Search,
  ShieldCheck,
  Target,
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
  "curriculum-learning-design": Target,
  "programme-operations": FileCheck2,
  "design-creative": Palette,
  "communications-social-media": Megaphone,
  "technology-platform": Code2,
  "research-quality-impact": BarChart3,
} satisfies Record<VolunteerDepartmentId, typeof BriefcaseBusiness>;

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
  const [directoryDepartment, setDirectoryDepartment] = useState<VolunteerDepartmentId>(
    volunteerDepartments[0].id
  );

  const selectedDepartment = useMemo(
    () => volunteerDepartments.find((department) => department.id === form.primaryDepartment),
    [form.primaryDepartment]
  );
  const activeDepartment = useMemo(
    () =>
      volunteerDepartments.find((department) => department.id === directoryDepartment) ??
      volunteerDepartments[0],
    [directoryDepartment]
  );
  const ActiveDepartmentIcon = departmentIcons[activeDepartment.id];

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
      <section className="relative min-h-[690px] overflow-hidden pt-16 flex items-end bg-[#071626]">
        <Image
          src="/images/programs/school-tour.jpg"
          alt="Ubuntu Bridge Initiative volunteers and students at a community programme"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[58%_center] md:object-center"
        />
        <div className="absolute inset-0 bg-[#071626]/80 md:bg-[#071626]/72" />
        <div className="absolute inset-y-0 left-0 w-1.5 bg-cyan-400" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pb-12 md:pb-14 pt-32">
          <div className="max-w-[760px] text-white">
            <div className="mb-6 inline-flex items-center gap-3 border border-white/25 bg-[#071626]/55 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur-sm">
              <span className="h-2 w-2 bg-cyan-300" />
              Applications open · Cohort 2
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.02] tracking-normal max-w-3xl">
              Build the bridge with us.
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-xl leading-8 text-slate-100">
              Cohort 2 will be built by people who care enough to take ownership. Bring your judgement,
              craft, experience, and time to the team behind the programme.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#departments"
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-cyan-300 px-5 py-3 text-sm font-bold text-[#071626] transition hover:bg-cyan-200"
              >
                Explore the teams <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#application"
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/45 bg-[#071626]/45 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                Start an application
              </a>
            </div>
          </div>

          <div className="mt-12 grid max-w-3xl grid-cols-3 border-y border-white/25 text-white">
            {[
              ["10", "specialist teams"],
              ["Remote", "serve from anywhere"],
              ["Real work", "visible ownership"],
            ].map(([value, label], index) => (
              <div key={value} className={`py-4 ${index ? "border-l border-white/25 pl-4 sm:pl-6" : "pr-4 sm:pr-6"}`}>
                <p className="text-sm sm:text-base font-bold">{value}</p>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface" aria-label="Volunteer expectations">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 px-5 sm:px-8">
          {[
            ["Choose your lane", "Find the department where your evidence and experience are strongest.", Search],
            ["Make a real commitment", "Most teams require 3-10 focused hours each week.", Clock3],
            ["Own an outcome", "You will have responsibilities, deadlines, and people depending on your work.", ShieldCheck],
          ].map(([title, detail, Icon], index) => (
            <div
              key={String(title)}
              className={`flex gap-4 py-6 md:py-8 ${index ? "border-t md:border-t-0 md:border-l border-border md:pl-8" : "md:pr-8"} ${index === 1 ? "md:pr-8" : ""}`}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-light text-blue">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{String(title)}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{String(detail)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="departments" className="scroll-mt-20 py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[0.78fr_1.22fr] gap-8 lg:gap-16 items-end mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue mb-3">
                Find your place
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-normal text-foreground">
                Ten teams. One shared mission.
              </h2>
            </div>
            <p className="text-base leading-7 text-muted max-w-2xl">
              Pick the team where you can produce strong, dependable work. Select a department to see
              exactly what it owns, who fits, and the time it requires.
            </p>
          </div>

          <div className="mb-4 lg:hidden">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted" htmlFor="department-explorer">
              Select a department
            </label>
            <select
              id="department-explorer"
              value={directoryDepartment}
              onChange={(event) => setDirectoryDepartment(event.target.value as VolunteerDepartmentId)}
              className="h-12 w-full rounded-md border border-border bg-surface px-3.5 text-sm font-semibold text-foreground outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
            >
              {volunteerDepartments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface lg:grid lg:grid-cols-[0.72fr_1.28fr]">
            <div className="hidden border-r border-border lg:block">
              {volunteerDepartments.map((department, index) => {
                const Icon = departmentIcons[department.id];
                const active = department.id === directoryDepartment;
                return (
                  <button
                    key={department.id}
                    type="button"
                    onClick={() => setDirectoryDepartment(department.id)}
                    className={`flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition last:border-b-0 ${
                      active ? "bg-blue text-white" : "bg-surface text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${active ? "text-blue-100" : "text-muted"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-blue"}`} />
                    <span className="text-sm font-semibold">{department.shortName}</span>
                    <ArrowRight className={`ml-auto h-3.5 w-3.5 ${active ? "opacity-100" : "opacity-0"}`} />
                  </button>
                );
              })}
            </div>

            <article className="relative min-h-[520px] overflow-hidden bg-[#0b2036] p-6 text-white sm:p-9 lg:p-12">
              <div className="absolute right-0 top-0 h-full w-1 bg-cyan-300" />
              <div className="flex items-start justify-between gap-5">
                <div className="grid h-12 w-12 place-items-center rounded-md border border-cyan-200/40 bg-cyan-200/10 text-cyan-200">
                  <ActiveDepartmentIcon className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">Time commitment</p>
                  <p className="mt-1 text-sm font-semibold text-white">{activeDepartment.commitment}</p>
                </div>
              </div>

              <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200">Department brief</p>
              <h3 className="mt-3 max-w-xl text-2xl font-bold leading-tight sm:text-3xl">{activeDepartment.name}</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">{activeDepartment.summary}</p>

              <div className="mt-8 border-t border-white/15 pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">What this team owns</p>
                <ul className="mt-4 space-y-3">
                  {activeDepartment.responsibilities.map((responsibility) => (
                    <li key={responsibility} className="flex gap-3 text-sm leading-6 text-slate-100">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                      {responsibility}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 border-l-2 border-cyan-300 pl-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-200">Strong fit</p>
                <p className="mt-1 text-sm leading-6 text-slate-200">{activeDepartment.idealFor}</p>
              </div>

              <button
                type="button"
                onClick={() => chooseDepartment(activeDepartment.id)}
                className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-cyan-300 px-4 py-2.5 text-sm font-bold text-[#071626] transition hover:bg-cyan-200"
              >
                Apply to this team <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">How selection works</p>
              <h2 className="mt-3 text-3xl font-bold text-foreground">A clear route into the team.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                ["01", "Apply", "Tell us where you fit and show evidence of work you can own.", FileCheck2],
                ["02", "Conversation", "Shortlisted applicants meet the relevant team lead for a focused conversation.", UsersRound],
                ["03", "Placement", "Selected volunteers receive a defined role, onboarding, and clear responsibilities.", Target],
              ].map(([number, title, description, Icon]) => (
                <div key={String(number)} className="border-t-2 border-blue pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue">{String(number)}</span>
                    <Icon className="h-4 w-4 text-muted" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-foreground">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{String(description)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="application" className="scroll-mt-16 bg-[#eef3f7] py-20 dark:bg-background md:py-24">
        <div ref={formRef} className="max-w-6xl mx-auto px-5 sm:px-8 scroll-mt-24">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-6 lg:gap-8 items-start">
            <div className="rounded-lg bg-[#0b2036] p-6 text-white sm:p-8 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200 mb-3">
                Volunteer application
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-normal text-white">
                Show us where you can make a difference.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-200">
                We value evidence, clarity, and reliability. A thoughtful answer is more useful than a
                long one. Tell us what you have done and what you are ready to own.
              </p>
              <div className="mt-8 space-y-4 border-t border-white/15 pt-6 text-sm text-slate-100">
                {[
                  "Choose one primary department",
                  "Show relevant work or a concrete example",
                  "Commit to a realistic weekly schedule",
                  "Expect onboarding and team accountability",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-cyan-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-l-2 border-cyan-300 pl-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-200">Good to know</p>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  These are unpaid service roles. Commitments vary by department and will be agreed before placement.
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="border border-emerald/30 bg-emerald-light/35 rounded-lg p-8 sm:p-10">
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
              <form onSubmit={submit} className="border border-border bg-surface rounded-lg p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 space-y-9">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                  <span className="text-blue">01 About you</span>
                  <span>02 Department</span>
                  <span>03 Evidence</span>
                  <span>04 Confirm</span>
                </div>
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
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-border [&_input]:bg-surface [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:text-sm [&_input]:text-foreground [&_input]:outline-none [&_input]:transition [&_input]:focus:border-blue [&_input]:focus:ring-2 [&_input]:focus:ring-blue/15 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-border [&_select]:bg-surface [&_select]:px-3.5 [&_select]:py-2.5 [&_select]:text-sm [&_select]:text-foreground [&_select]:outline-none [&_select]:transition [&_select]:focus:border-blue [&_select]:focus:ring-2 [&_select]:focus:ring-blue/15 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-surface [&_textarea]:px-3.5 [&_textarea]:py-2.5 [&_textarea]:text-sm [&_textarea]:leading-6 [&_textarea]:text-foreground [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:focus:border-blue [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-blue/15">
        {children}
      </div>
    </label>
  );
}
