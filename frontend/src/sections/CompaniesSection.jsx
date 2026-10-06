import { useRef, useState, useLayoutEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { WordMask, Reveal } from "@/components/Reveal";
import useIsMobile from "@/hooks/useIsMobile";

// Placeholder companies — swap names / add real logos later.
const companies = [
  { name: "Aroma Café", mono: "A", line: "Καφετέρια & brunch spot", tag: "Website · Online παραγγελίες" },
  { name: "FitZone Gym", mono: "FZ", line: "Δίκτυο γυμναστηρίων", tag: "Mobile app κρατήσεων" },
  { name: "Bella Casa", mono: "BC", line: "Έπιπλα & décor", tag: "E-shop" },
  { name: "TechNova", mono: "TN", line: "IT services", tag: "Custom dashboard" },
  { name: "Green Leaf", mono: "GL", line: "Delicatessen", tag: "Automation τιμολόγησης" },
  { name: "Marina Estates", mono: "ME", line: "Μεσιτικό γραφείο", tag: "Πλατφόρμα αγγελιών" },
  { name: "Sunset Travel", mono: "ST", line: "Ταξιδιωτικό γραφείο", tag: "Booking platform" },
  { name: "Kappa Dental", mono: "KD", line: "Οδοντιατρική κλινική", tag: "Website & ραντεβού" },
];

function CompanyCard({ c, i }) {
  return (
    <div
      data-testid={`company-card-${i}`}
      className="group relative flex w-[290px] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-white/[0.05] p-6 md:w-[320px] md:p-7"
    >
      {/* Logo monogram */}
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-baby to-baby-dark font-display text-lg font-bold text-white shadow-lg shadow-baby/40">
        {c.mono}
      </div>

      <h3 className="mt-5 font-display text-lg font-medium tracking-tight text-white md:text-xl">
        {c.name}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/50">{c.line}</p>

      <div className="mt-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-baby">
        <span className="h-1.5 w-1.5 rounded-full bg-baby" />
        {c.tag}
      </div>

      {/* Hover ring — removed */}
    </div>
  );
}

function SectionHeader() {
  return (
    <Reveal>
      <h2
        data-testid="companies-headline"
        className="font-display font-bold tracking-tighter text-4xl md:text-6xl text-white leading-[0.95]"
      >
        <WordMask text="Εταιρείες που" className="block" />
        <WordMask
          text="μας εμπιστεύτηκαν."
          accent={["μας", "εμπιστεύτηκαν."]}
          delay={0.2}
          className="block"
        />
      </h2>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/50 md:text-base">
        Επιχειρήσεις κάθε μεγέθους που εμπιστεύτηκαν την KNDP για τα ψηφιακά τους projects.
      </p>
    </Reveal>
  );
}

export default function CompaniesSection() {
  const isMobile = useIsMobile();
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [distance, setDistance] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  useLayoutEffect(() => {
    if (isMobile) return;
    const measure = () => {
      if (!trackRef.current) return;
      const d = trackRef.current.scrollWidth - window.innerWidth;
      setDistance(Math.max(0, d));
    };
    measure();
    const t = setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [isMobile]);

  // MOBILE
  if (isMobile) {
    return (
      <section
        id="companies"
        data-testid="companies-section"
        className="relative bg-ink py-16 overflow-hidden grain"
      >
        {/* Smooth top & bottom transitions */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-10 h-12 bg-gradient-to-b from-paper via-paper/50 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-12 bg-gradient-to-t from-paper via-paper/50 to-transparent" />

        {/* Decorative glow blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-baby/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-baby/8 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6">
          <SectionHeader />
        </div>
        <div className="relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {companies.map((c, i) => (
            <CompanyCard key={c.name} c={c} i={i} />
          ))}
        </div>
      </section>
    );
  }

  // DESKTOP: pinned horizontal track
  return (
    <section
      id="companies"
      data-testid="companies-section"
      ref={sectionRef}
      className="relative bg-ink grain"
      style={{ height: `calc(100vh + ${distance}px)` }}
    >
      {/* Smooth top & bottom transitions — fades in/out of adjacent white sections */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 h-16 bg-gradient-to-b from-paper via-paper/50 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-16 bg-gradient-to-t from-paper via-paper/50 to-transparent" />

      {/* Decorative glow blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-baby/8 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-0 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-baby/6 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-baby/5 blur-3xl" />

      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-7xl px-6 md:px-10 pt-16 md:pt-20">
          <SectionHeader />
        </div>

        <div className="relative mt-10 md:mt-14">
          <motion.div
            ref={trackRef}
            style={{ x }}
            data-testid="companies-track"
            className="flex w-max gap-5 px-6 md:px-10"
          >
            {companies.map((c, i) => (
              <CompanyCard key={c.name} c={c} i={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
