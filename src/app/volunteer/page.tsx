import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { SiteBackground } from "@/components/landing/site-background";
import { VolunteerPage } from "./volunteer-page";

export const metadata: Metadata = {
  title: "Volunteer for Cohort 2",
  description:
    "Join the team building Ubuntu Bridge Initiative Cohort 2 across partnerships, mentoring, community, grading, curriculum, design, communications, technology, and impact.",
  alternates: { canonical: "/volunteer" },
};

export default function VolunteerRoute() {
  return (
    <div className="landing-page site min-h-screen bg-background text-foreground">
      <SiteBackground />
      <ScrollReveal />
      <Navbar />
      <main>
        <VolunteerPage />
      </main>
      <Footer />
    </div>
  );
}
