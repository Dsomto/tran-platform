import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { TalentHero } from "./talent-hero";
import { TalentGallery } from "./talent-gallery";
import { HiringProcess } from "./hiring-process";
import { TalentCTA } from "./talent-cta";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hire From UBI — Vetted Cybersecurity Talent",
  description:
    "Recruit battle-tested cybersecurity professionals directly from our talent pool. SOC analysts, penetration testers, and GRC specialists who survived 10 stages of elimination.",
};

export default function HirePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <TalentHero />
        <TalentGallery />
        <HiringProcess />
        <TalentCTA />
      </main>
      <Footer />
    </>
  );
}
