import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export type LandingStats = {
  applicants: number;
  selectedInterns: number;
  activeInterns: number;
  tracks: number;
};

const TRACKS = 3;

// Default any individual count to 0 if it throws — the public landing must
// never crash on a DB hiccup, and one failing count shouldn't zero the rest.
const safe = (p: Promise<number>): Promise<number> => p.catch(() => 0);

// Live, but cached for ~30 minutes so an unauthenticated public page doesn't
// hit the database on every request.
export const getLandingStats = unstable_cache(
  async (): Promise<LandingStats> => {
    const [applicants, selectedInterns, activeInterns] = await Promise.all([
      safe(prisma.publicApplication.count({
        where: { status: { in: ["pending", "approved", "rejected"] } },
      })),
      // PublicApplication is the durable cohort ledger. Intern rows can be
      // archived or removed after elimination and must not define intake size.
      safe(prisma.publicApplication.count({ where: { status: "approved" } })),
      safe(prisma.intern.count({
        where: {
          isActive: true,
          user: { email: { not: { endsWith: "@netforge.invalid" } } },
        },
      })),
    ]);

    return { applicants, selectedInterns, activeInterns, tracks: TRACKS };
  },
  ["landing-stats-v3"],
  { revalidate: 1800 }
);
