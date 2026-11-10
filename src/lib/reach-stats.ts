import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export type CountryReach = { country: string; lat: number; lon: number; applied: number; interns: number };
export type ReachStats = { countries: CountryReach[]; applied: number; interns: number };

// Approximate centres for map pins. A country missing here still counts in the
// totals; it just gets no pin until it is added.
const CENTRES: Record<string, [lat: number, lon: number]> = {
  Nigeria: [9.1, 8.7],
  "South Africa": [-29, 24.7],
  India: [22.5, 79],
  Ghana: [7.9, -1],
  Pakistan: [30.4, 69.3],
  "United States": [39.5, -98.4],
  Kenya: [0.2, 37.9],
  "United Kingdom": [53, -1.8],
  Canada: [56.1, -106.3],
  Uganda: [1.4, 32.3],
  Egypt: [26.8, 30.8],
  Cameroon: [5.7, 12.4],
  "Saudi Arabia": [23.9, 45.1],
  Ethiopia: [9.1, 40.5],
  Malaysia: [4.2, 102],
  Turkey: [39, 35.2],
  Bangladesh: [23.7, 90.4],
  "United Arab Emirates": [23.4, 53.8],
  Tanzania: [-6.4, 34.9],
  Philippines: [12.9, 121.8],
  Morocco: [31.8, -7.1],
  Germany: [51.2, 10.5],
  Australia: [-25.3, 133.8],
  Indonesia: [-2.5, 118],
  Rwanda: [-1.9, 29.9],
  Argentina: [-38.4, -63.6],
  Singapore: [1.35, 103.8],
  Poland: [51.9, 19.1],
  Colombia: [4.6, -74.3],
  Spain: [40.5, -3.7],
  Portugal: [39.4, -8.2],
  Senegal: [14.5, -14.5],
  Brazil: [-14.2, -51.9],
  "Côte d'Ivoire": [7.5, -5.5],
  Ireland: [53.4, -8.2],
  Zimbabwe: [-19, 29.2],
  Zambia: [-13.1, 27.8],
  Botswana: [-22.3, 24.7],
  Lesotho: [-29.6, 28.2],
  France: [46.2, 2.2],
  Netherlands: [52.1, 5.3],
};

// Where the application form's country names differ from the map data's.
export const ATLAS_NAME: Record<string, string> = { "United States": "United States of America" };

const COUNTED =["pending", "approved", "rejected"];

// Same ledger and caching as landing-stats: live, refreshed every 30 minutes,
// and an empty map rather than a crash if the database is unreachable.
export const getReachStats = unstable_cache(
  async (): Promise<ReachStats> => {
    try {
      const [all, approved] = await Promise.all([
        prisma.publicApplication.groupBy({ by: ["country"], _count: { _all: true }, where: { status: { in: COUNTED } } }),
        prisma.publicApplication.groupBy({ by: ["country"], _count: { _all: true }, where: { status: "approved" } }),
      ]);
      const interns = new Map(approved.map((r) => [r.country, r._count._all]));
      const countries = all
        .filter((r) => CENTRES[r.country])
        .map((r) => {
          const [lat, lon] = CENTRES[r.country];
          return { country: r.country, lat, lon, applied: r._count._all, interns: interns.get(r.country) ?? 0 };
        })
        .sort((a, b) => b.applied - a.applied);
      return {
        countries,
        applied: all.reduce((n, r) => n + r._count._all, 0),
        interns: approved.reduce((n, r) => n + r._count._all, 0),
      };
    } catch {
      return { countries: [], applied: 0, interns: 0 };
    }
  },
  ["reach-stats-v1"],
  { revalidate: 1800 }
);
