import { ATLAS_NAME, getReachStats } from "@/lib/reach-stats";
import { ReachGlobe } from "./reach-globe";

export async function Reach() {
  const stats = await getReachStats();
  if (!stats.countries.length) return null;

  return (
    <section aria-labelledby="reach-heading" className="py-16 sm:py-20">
      <div className="max-w-[80rem] mx-auto px-5 sm:px-8">
        <h2
          id="reach-heading"
          data-reveal
          className="text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold tracking-[-0.045em]"
        >
          Lives we&apos;ve <span className="serif font-normal text-sky">touched.</span>
        </h2>
        <ReachGlobe stats={stats} atlasNames={ATLAS_NAME} />
      </div>
    </section>
  );
}
