"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Code2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Loader2,
  Megaphone,
  Palette,
  Plus,
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
  const [activeId, setActiveId] = useState<VolunteerDepartmentId>(volunteerDepartments[0].id);
  const activeDepartment =
    volunteerDepartments.find((department) => department.id === activeId) ?? volunteerDepartments[0];
  const ActiveIcon = departmentIcons[activeDepartment.id];

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
      <section className="overflow-hidden">
        <div className="max-w-[80rem] mx-auto grid items-center gap-10 px-5 pt-28 pb-12 sm:px-8 lg:grid-cols-2 lg:pt-32">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-foreground-muted">
              <span className="h-2 w-2 rounded-full bg-signal" aria-hidden="true" />
              Volunteer · Cohort 2
            </p>
            <h1 className="mt-6 text-[clamp(2.6rem,5.5vw,5.25rem)] font-semibold leading-[1] tracking-[-0.045em]">
              <span className="line-mask"><span>Help us build</span></span>
              <span className="line-mask">
                <span style={{ animationDelay: ".08s" }}>
                  <span className="rounded-2xl bg-signal px-3 text-ink">something</span>
                </span>
              </span>
              <span className="line-mask">
                <span style={{ animationDelay: ".16s" }}>
                  people <span className="serif font-normal text-sky">remember.</span>
                </span>
              </span>
            </h1>
            <p className="rise rise-2 mt-6 max-w-sm text-lg text-foreground-muted">
              Give a few hours a week. Help new talent break into cybersecurity.
            </p>
            <div className="rise rise-3 mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#departments"
                className="group inline-flex h-14 items-center gap-2 rounded-full bg-foreground px-8 text-[15px] font-semibold text-background transition-colors hover:bg-signal hover:text-ink"
              >
                Find your team
                <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </a>
              <a
                href="#application"
                className="inline-flex h-14 items-center rounded-full border border-border px-7 text-[15px] text-foreground transition-colors hover:bg-surface"
              >
                Apply
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 grid-rows-[repeat(3,8rem)] gap-3 sm:grid-rows-[repeat(3,9.5rem)]">
            <div className="pop group row-span-2 relative overflow-hidden rounded-t-[10rem] rounded-b-3xl">
              <Image
                src="/images/programs/mentorship.jpg"
                alt="Ubuntu Bridge Initiative community members collaborating"
                fill
                priority
                sizes="(min-width: 1024px) 320px, 50vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <div className="pop pop-2 flex flex-col items-center justify-center rounded-3xl bg-signal text-ink">
              <span className="text-4xl font-semibold tracking-tight sm:text-5xl">{volunteerDepartments.length}</span>
              <span className="text-sm">teams need you</span>
            </div>
            <div className="pop pop-3 group relative overflow-hidden rounded-3xl">
              <Image
                src="/images/programs/school-tour.jpg"
                alt="Cybersecurity Educational School Tour in secondary schools"
                fill
                sizes="240px"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <div className="pop pop-2 flex flex-col items-center justify-center rounded-3xl bg-blue text-white">
              <span className="text-4xl font-semibold tracking-tight sm:text-5xl">3–10</span>
              <span className="text-sm text-white/80">hours a week</span>
            </div>
            <div className="pop pop-3 group relative overflow-hidden rounded-3xl">
              <Image
                src="/images/programs/workshops.jpg"
                alt="Community Cybersafe Workshops — hands-on training"
                fill
                sizes="240px"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        <div className="border-y border-border/70 py-4 overflow-hidden" aria-hidden="true">
          <div className="film flex w-max gap-8 whitespace-nowrap text-lg font-medium text-muted" style={{ animationDuration: "40s" }}>
            {[0, 1].flatMap((k) =>
              Array.from({ length: 3 }).flatMap((_, r) =>
                ["Remote", "A few hours a week", "Real impact", "Grow your network"].map((w, i) => (
                  <span key={`${k}-${r}-${i}`} className="inline-flex items-center gap-8">
                    {w} <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                  </span>
                ))
              )
            )}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20" aria-labelledby="process-heading">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
          <h2 id="process-heading" data-reveal className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]">
            Four <span className="serif font-normal text-sky">simple steps.</span>
          </h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {[
              ["Pick a team", "Choose where you can help most."],
              ["Apply", "Fill in the short form below."],
              ["Have a chat", "If shortlisted, we talk with you."],
              ["Start", "Get set up and start helping."],
            ].map(([title, body], index) => (
              <li
                key={title}
                data-reveal
                style={{ "--d": index } as React.CSSProperties}
                className="flex min-h-48 flex-col justify-between rounded-3xl border border-border bg-surface/70 p-7 backdrop-blur"
              >
                <span className="text-5xl font-semibold leading-none tracking-[-0.06em] text-lime">{index + 1}</span>
                <span>
                  <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-1 text-muted">{body}</p>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="departments" className="scroll-mt-16 py-16 sm:py-20" aria-labelledby="departments-heading">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
          <h2 id="departments-heading" data-reveal className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]">
            10 teams. <span className="serif font-normal text-sky">Find yours.</span>
          </h2>

          <div data-reveal className="mt-10 grid gap-6 lg:grid-cols-12">
            <div
              role="tablist"
              aria-label="Volunteer departments"
              aria-orientation="vertical"
              className="lg:col-span-5 -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 snap-x lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
            >
              {volunteerDepartments.map((department) => {
                const Icon = departmentIcons[department.id];
                const active = department.id === activeDepartment.id;
                return (
                  <button
                    key={department.id}
                    type="button"
                    role="tab"
                    id={`dept-tab-${department.id}`}
                    aria-selected={active}
                    aria-controls="dept-panel"
                    onClick={() => setActiveId(department.id)}
                    className={`group flex shrink-0 snap-start items-center gap-3.5 rounded-full py-2 pl-2 pr-5 text-left transition-all cursor-pointer lg:w-full ${
                      active ? "bg-signal text-ink" : "bg-surface text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                        active ? "bg-background text-lime" : "bg-background text-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="whitespace-nowrap text-sm font-semibold lg:whitespace-normal">
                      <span className="lg:hidden">{department.shortName}</span>
                      <span className="hidden lg:inline">{department.name}</span>
                    </span>
                    <ArrowRight
                      className={`ml-auto hidden h-4 w-4 shrink-0 transition-all lg:block ${
                        active ? "" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div
              id="dept-panel"
              role="tabpanel"
              aria-labelledby={`dept-tab-${activeDepartment.id}`}
              className="lg:col-span-7"
            >
              <div
                key={activeDepartment.id}
                className="pop lg:sticky lg:top-24 rounded-3xl bg-blue p-8 text-white sm:p-10"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15">
                  <ActiveIcon className="h-7 w-7" />
                </span>
                <h3 className="mt-8 text-[clamp(2rem,3.5vw,3.25rem)] font-semibold leading-[1] tracking-[-0.04em]">
                  {activeDepartment.name}
                </h3>
                <p className="mt-5 max-w-lg text-lg text-white/80">{activeDepartment.summary}</p>
                <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm">
                  <Clock3 className="h-4 w-4" />
                  {activeDepartment.commitment}
                </p>
                <div className="mt-10">
                  <button
                    type="button"
                    onClick={() => chooseDepartment(activeDepartment.id)}
                    className="group inline-flex h-14 items-center gap-2 rounded-full bg-signal px-8 text-[15px] font-semibold text-ink transition-colors hover:bg-white cursor-pointer"
                  >
                    Join {activeDepartment.shortName}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="application" className="scroll-mt-16 py-16 sm:py-20">
        <div ref={formRef} className="max-w-[80rem] mx-auto px-5 sm:px-8 scroll-mt-24">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <aside className="lg:col-span-4 lg:sticky lg:top-24 relative overflow-hidden rounded-3xl border border-border bg-surface/70 p-8 backdrop-blur sm:p-9">
              <div className="relative">
                                <h2 className="text-4xl font-semibold tracking-[-0.045em] leading-[1]">
                  Join the <span className="serif font-normal text-sky">team.</span>
                </h2>
                <p className="mt-4 text-muted">
                  Short, honest answers are best.
                </p>
                <ul className="mt-6 space-y-3 border-t border-border pt-6 text-[15px]" role="list">
                  {[
                    "Pick one main team",
                    "Share an example of your work",
                    "Be honest about your time",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-lime" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {selectedDepartment && (
                  <div className="mt-6 rounded-2xl bg-signal p-5 text-ink">
                    <p className="eyebrow text-muted">Applying for</p>
                    <p className="mt-1.5 font-semibold">{selectedDepartment.name}</p>
                    <p className="mt-1 text-xs text-muted">{selectedDepartment.commitment}</p>
                  </div>
                )}
              </div>
            </aside>

            {submitted ? (
              <div className="pop lg:col-span-8 rounded-3xl bg-blue p-8 text-white sm:p-12">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-signal text-ink">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h3 className="mt-8 text-4xl font-semibold tracking-[-0.04em]">
                  You&apos;re in the queue!
                </h3>
                <p className="mt-4 text-lg text-white/80 max-w-xl">
                  Thank you. Check your email for a confirmation. We&apos;ll be in touch if you&apos;re shortlisted.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-8 text-sm font-semibold text-lime hover:text-white cursor-pointer"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="lg:col-span-8 relative space-y-5">
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
                    <div className="rounded-2xl border border-blue/25 bg-blue/5 p-4 text-sm">
                      <p className="font-semibold text-foreground">{selectedDepartment.name}</p>
                      <p className="mt-1 leading-6 text-muted">{selectedDepartment.summary}</p>
                      <p className="mt-2 text-xs font-medium text-lime">Expected rhythm: {selectedDepartment.commitment}</p>
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

                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-foreground-muted cursor-pointer has-[:checked]:border-blue/40 has-[:checked]:bg-blue/5">
                    <input
                      type="checkbox"
                      required
                      checked={form.commitmentAccepted}
                      onChange={(e) => update("commitmentAccepted", e.target.checked)}
                      className="mt-1 h-4 w-4 accent-blue"
                    />
                    <span>I understand this is an unpaid volunteer role and I can meet the commitment I selected.</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-foreground-muted cursor-pointer has-[:checked]:border-blue/40 has-[:checked]:bg-blue/5">
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
                  <div role="alert" className="rounded-2xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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

      <section className="py-16 sm:py-20">
        <div className="max-w-[80rem] mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <h2 className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em] leading-[0.95] text-foreground">
              Quick <span className="serif font-normal text-sky">answers.</span>
            </h2>
          </div>
          <div className="lg:col-span-8 space-y-3">
            {[
              ["Is it paid?", "No. It\u2019s an unpaid volunteer role."],
              ["Do I need to be a security expert?", "Only for grading, curriculum and tech mentoring. Other teams need other skills."],
              ["Can Cohort 1 interns apply?", "Yes. Show us what you can do now."],
              ["Can I pick more than one team?", "Pick one main team. You can add a second choice."],
              ["What happens after I apply?", "You get an email. If shortlisted, we invite you to a short chat."],
            ].map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-border bg-surface/60 transition-colors open:border-signal/40 open:bg-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 text-lg font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                  {question}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-hover text-foreground transition group-open:rotate-45 group-open:bg-signal group-open:text-ink">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="px-6 pb-6 max-w-2xl text-muted">{answer}</p>
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
    <fieldset className="space-y-5 rounded-3xl border border-border bg-surface/70 p-6 backdrop-blur sm:p-8">
      <legend className="float-left mb-6 flex w-full items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-signal text-sm font-semibold text-ink">
          {number}
        </span>
        {title}
      </legend>
      <div className="clear-both space-y-5">{children}</div>
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
      <div className="[&_input]:w-full [&_input]:rounded-2xl [&_input]:border [&_input]:border-border [&_input]:bg-background [&_input]:px-3.5 [&_input]:py-3.5 [&_input]:text-sm [&_input]:text-foreground [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-muted/70 [&_input]:hover:border-foreground/25 [&_input]:focus:border-blue [&_input]:focus:bg-surface [&_input]:focus:ring-4 [&_input]:focus:ring-blue/15 [&_select]:w-full [&_select]:rounded-2xl [&_select]:border [&_select]:border-border [&_select]:bg-background [&_select]:px-3.5 [&_select]:py-3.5 [&_select]:text-sm [&_select]:text-foreground [&_select]:outline-none [&_select]:transition [&_select]:placeholder:text-muted/70 [&_select]:hover:border-foreground/25 [&_select]:focus:border-blue [&_select]:focus:bg-surface [&_select]:focus:ring-4 [&_select]:focus:ring-blue/15 [&_textarea]:w-full [&_textarea]:rounded-2xl [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:px-3.5 [&_textarea]:py-3.5 [&_textarea]:text-sm [&_textarea]:text-foreground [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:placeholder:text-muted/70 [&_textarea]:hover:border-foreground/25 [&_textarea]:focus:border-blue [&_textarea]:focus:bg-surface [&_textarea]:focus:ring-4 [&_textarea]:focus:ring-blue/15 [&_textarea]:resize-y [&_textarea]:leading-6">
        {children}
      </div>
    </label>
  );
}
