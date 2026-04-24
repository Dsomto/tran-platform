import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { About } from "@/components/landing/about";
import { Why } from "@/components/landing/why";
import { Stages } from "@/components/landing/stages";
import { Tracks } from "@/components/landing/tracks";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { ScrollIndicator } from "@/components/landing/scroll-indicator";

export default function Home() {
  return (
    <>
      <a
        href="#hero-heading"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Navbar />
      <ScrollIndicator />
      <main id="main-content">
        <Hero />
        <Marquee />
        <About />
        <Why />
        <Stages />
        <Tracks />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
