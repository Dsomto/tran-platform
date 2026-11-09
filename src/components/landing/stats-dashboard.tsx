import { getLandingStats } from "@/lib/landing-stats";
import { CountUp } from "./count-up";

export async function StatsDashboard() {
  const { applicants, selectedInterns, activeInterns } = await getLandingStats();

  const stats = [
    { value: applicants, label: "applied" },
    { value: selectedInterns, label: "got in" },
    { value: activeInterns, label: "still going" },
  ];

  return (
    <section aria-labelledby="numbers-heading" className="py-16 sm:py-20">
      <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
        <h2 id="numbers-heading" data-reveal className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]">
          Cohort 1 <span className="serif font-normal text-sky">so far.</span>
        </h2>
        <dl className="mt-10 grid overflow-hidden rounded-3xl border border-border bg-surface/70 backdrop-blur sm:grid-cols-3">
          {stats.map((st, i) => (
            <div
              key={st.label}
              data-reveal
              style={{ "--d": i } as React.CSSProperties}
              className={`flex flex-col-reverse px-8 py-8 ${i ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}
            >
              <dt className="mt-1 text-muted">{st.label}</dt>
              <dd className={`text-5xl font-semibold tracking-[-0.04em] sm:text-6xl ${i === 2 ? "text-lime" : ""}`}>
                <CountUp value={st.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
