import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { Gallery } from "@/components/landing/gallery";
import { Stages } from "@/components/landing/stages";
import { Tracks } from "@/components/landing/tracks";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { StatsDashboard } from "@/components/landing/stats-dashboard";
import { InternWall } from "@/components/landing/intern-wall";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { SiteBackground } from "@/components/landing/site-background";
import { getLandingStats } from "@/lib/landing-stats";

export default async function Home() {
  const stats = await getLandingStats();

  return (
    <div className="landing-page site">
      <a
        href="#hero-heading"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-signal focus:text-background focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <SiteBackground />
      <ScrollReveal />
      <Navbar />
      <main id="main-content">
        <Hero stats={stats} />
        <About />
        <StatsDashboard />
        <InternWall />
        <Stages />
        <Tracks />
        <Gallery />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
