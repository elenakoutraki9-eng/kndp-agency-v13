import { useEffect } from "react";
import "@/App.css";
import Lenis from "lenis";
import { useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";
import ScrollProgress from "@/components/ScrollProgress";
import EditorialMarquee from "@/components/Marquee";
import ScrollReveal from "@/components/ScrollReveal";
import Hero from "@/sections/Hero";
import ProblemSolutionSection from "@/sections/ProblemSolutionSection";
import ServicesSection from "@/sections/ServicesSection";
import HowItWorksSection from "@/sections/HowItWorksSection";
import PortfolioSection from "@/sections/PortfolioSection";
import CompaniesSection from "@/sections/CompaniesSection";
import FaqSection from "@/sections/FaqSection";
import ContactSection from "@/sections/ContactSection";
import { setLenis, scrollToId } from "@/lib/scroll";
import useIsMobile from "@/hooks/useIsMobile";

export default function Landing() {
  const isMobile = useIsMobile();
  const location = useLocation();

  useEffect(() => {
    // If we arrived from another route asking to scroll to a section
    // (e.g. clicked "Επικοινωνία" on /video), scroll there once mounted.
    const target = location.state?.scrollTo || window.location.hash;
    if (!target) return;
    // Coming from another page via the transition curtain: jump instantly
    // while the curtain still covers the screen (no visible scrolling).
    const fromRoute = !!location.state?.scrollTo;
    const t = setTimeout(
      () => scrollToId(target, { immediate: fromRoute }),
      fromRoute ? 120 : 500
    );
    const t2 = fromRoute ? setTimeout(() => scrollToId(target, { immediate: true }), 330) : null;
    return () => {
      clearTimeout(t);
      if (t2) clearTimeout(t2);
    };
  }, [location.state]);

  useEffect(() => {
    // On mobile, use native (instant) scrolling — no smooth-scroll inertia.
    if (isMobile) {
      setLenis(null);
      return;
    }
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    setLenis(lenis);
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      setLenis(null);
      lenis.destroy();
    };
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-paper text-ink font-body antialiased">
      <Cursor />
      <ScrollProgress />
      <Navbar />
      <main>
        {/* Hero, partners marquee and Our Work share ONE continuous
            blue-tinted backdrop — the hero's bottom-left glow flows down
            into the portfolio so the two read as a single background. */}
        <div className="relative bg-paper">
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-baby/25 blur-2xl" />
            <div className="absolute top-[34%] -left-44 h-[40rem] w-[40rem] rounded-full bg-baby/20 blur-3xl" />
            <div className="absolute top-[58%] -left-56 h-[38rem] w-[38rem] rounded-full bg-baby/14 blur-3xl" />
            <div className="absolute top-[78%] -right-40 h-[26rem] w-[26rem] rounded-full bg-baby/10 blur-3xl" />
          </div>
          <div className="relative">
            <Hero />
            <EditorialMarquee />
            <PortfolioSection />
          </div>
        </div>

        <CompaniesSection />

        <ServicesSection />
        <ScrollReveal>
          <ProblemSolutionSection />
        </ScrollReveal>
        <HowItWorksSection />
        <ScrollReveal>
          <FaqSection />
        </ScrollReveal>
        <ScrollReveal>
          <ContactSection />
        </ScrollReveal>
      </main>
      <Footer />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
