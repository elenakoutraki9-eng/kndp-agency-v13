import { useRef, Fragment } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { WordMask, Reveal, Kicker, Magnetic } from "@/components/Reveal";
import { StackPanel } from "@/components/StackSection";
import { scrollToId } from "@/lib/scroll";
import useIsMobile from "@/hooks/useIsMobile";

const projects = [
  {
    title: "Booking System για Εστιατόριο",
    desc: "Online κρατήσεις, διαχείριση τραπεζιών και αυτόματες υπενθυμίσεις για ένα πολυσύχναστο bistro — μηδέν χαμένες κρατήσεις.",
    tag: "Web App",
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "E-commerce App",
    desc: "Ένα γρήγορο online store με καλάθι, ολοκλήρωση παραγγελίας και συγχρονισμό αποθέματος για μια αναπτυσσόμενη επιχείρηση λιανικής.",
    tag: "E-commerce",
    img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Προσαρμοσμένο Dashboard Επιχείρησης",
    desc: "Πωλήσεις, λειτουργίες και αναφορές σε πραγματικό χρόνο, όλα μαζί σε ένα καθαρό εσωτερικό εργαλείο.",
    tag: "Internal Tool",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Mobile App για Τοπικό Γυμναστήριο",
    desc: "Κρατήσεις μαθημάτων, συνδρομές και παρακολούθηση προπόνησης στην τσέπη των μελών.",
    tag: "Mobile App",
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Σουίτα Αυτοματισμού Εργασιών",
    desc: "Τιμολόγηση, παρακολούθηση πελατών και καταχώρηση δεδομένων αυτοματοποιημένα σε όλο το back office.",
    tag: "Automation",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Πλατφόρμα Αγγελιών Ακινήτων",
    desc: "Αγγελίες με δυνατότητα αναζήτησης, ενσωματωμένες εικονικές περιηγήσεις και εργαλεία για μεσίτες, για ένα τοπικό γραφείο.",
    tag: "Web Platform",
    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
  },
];

function StackCard({ p, i, total, progress, isMobile }) {
  // recede so the stack still reads as having depth, not a fade-away.
  const targetScale = 1 - (total - 1 - i) * 0.015;
  // Recede finishes within this card's own slot, so it's already settled by
  // the time the next card arrives and stacks on top of it.
  const rawScale = useTransform(progress, [i / total, (i + 1) / total], [1, targetScale]);
  // Spring-smooth the scale so it physically eases rather than tracking
  // scroll 1:1 — removes the mechanical jerk between cards.
  const scale = useSpring(rawScale, { stiffness: 120, damping: 28, restDelta: 0.0005 });
  const imageRight = i % 2 === 1;
  // Small, consistent step per card so each new one slides up and stacks on
  // top of the previous, leaving a thin visible sliver of it at the top —
  // like a physical deck of cards, hinting there's more behind.
  const top = isMobile ? 88 + i * 16 : 96 + i * 26;

  // No margin on the sticky wrapper. Spacing between cards is provided by
  // SEPARATE spacer siblings in the container (see below). A trailing margin
  // would make the card unstick EARLY (the margin reserves space at the bottom
  // of its containing block), so the previous card would leave before the next
  // one arrived — the cards would never truly stack. With no margin, every card
  // stays stuck until the container's real end, so they accumulate into a deck
  // and release together.
  return (
    <div className="sticky" style={{ top: `${top}px` }}>
      <motion.article
        data-testid={`case-study-${i}`}
        style={{ scale }}
        className="group origin-top mx-auto w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 items-center gap-4 md:gap-6 rounded-2xl border border-white/10 bg-ink text-white p-3 md:p-4 shadow-2xl shadow-ink/30"
      >
        {/* Image / mockup */}
        <div
          className={`relative overflow-hidden rounded-xl bg-white/5 ${
            imageRight ? "md:order-2" : "md:order-1"
          }`}
        >
          <div className="aspect-[16/11] w-full">
            <img
              src={p.img}
              alt={p.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
        </div>

        {/* Details */}
        <div className={`px-1 md:px-3 ${imageRight ? "md:order-1" : "md:order-2"}`}>
          <span className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-baby">
            {p.tag}
          </span>
          <h3 className="mt-3 font-display text-xl md:text-2xl font-medium tracking-tight leading-tight text-white">
            {p.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{p.desc}</p>
          <button
            type="button"
            onClick={() => scrollToId("#contact")}
            data-testid={`case-study-cta-${i}`}
            className="group/btn mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white"
          >
            Θέλω κάτι παρόμοιο
            <ArrowUpRight className="h-4 w-4 text-baby transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </button>
        </div>
      </motion.article>
    </div>
  );
}

function StackProgress({ progress, total }) {
  const label = useTransform(progress, (v) => {
    const idx = Math.min(total - 1, Math.floor(v * total));
    return `${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  });
  const fillHeight = useTransform(progress, (v) => `${Math.min(100, Math.max(0, v * 100))}%`);
  const fillWidth = fillHeight;
  const opacity = useTransform(progress, [0, 0.03, 0.94, 1], [0, 1, 1, 0]);

  return (
    <>
      <motion.div
        data-testid="portfolio-progress-mobile"
        style={{ opacity }}
        className="pointer-events-none fixed left-0 right-0 top-16 z-30 h-[3px] bg-ink/10 lg:hidden"
      >
        <motion.div style={{ width: fillWidth }} className="h-full bg-baby-dark" />
      </motion.div>

      <motion.div
        data-testid="portfolio-progress-desktop"
        style={{ opacity }}
        className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
      >
        <motion.span className="font-display text-[11px] font-bold tracking-widest text-ink/40">
          {label}
        </motion.span>
        <div className="relative h-52 w-[3px] overflow-hidden rounded-full bg-ink/10">
          <motion.div
            style={{ height: fillHeight }}
            className="absolute left-0 top-0 w-full rounded-full bg-baby-dark"
          />
        </div>
      </motion.div>
    </>
  );
}

export default function PortfolioSection(props) {
  const isMobile = useIsMobile();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  // Bigger gap = more scroll required per card reveal = slower, more deliberate pacing.
  const gapVh = isMobile ? 32 : 80;
  // Longer final hold before the whole deck releases.
  const finalHoldVh = isMobile ? 32 : 52;

  return (
    <StackPanel {...props} innerClassName="">
      <section id="portfolio" data-testid="portfolio-section" className="pt-12 md:pt-16">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Reveal>
            <Kicker waypoint="portfolio">Έργα</Kicker>
            <h2
              data-testid="portfolio-headline"
              className="mt-3 font-display font-medium tracking-tight text-3xl md:text-5xl"
            >
              <WordMask text="Η δουλειά μας" className="block" />
              <WordMask
                text="μιλάει από μόνη της."
                accent={["μιλάει", "από", "μόνη", "της."]}
                delay={0.2}
                className="block"
              />
            </h2>
            <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-ink/60">
              Επιλεγμένα case studies — από booking systems και e-shops μέχρι
              custom dashboards και automations. Κάνε scroll: κάθε κάρτα
              φεύγει για να αποκαλύψει την επόμενη.
            </p>
          </Reveal>

          {/* Sticky stacking case study cards. The cards carry NO margin;
              the reveal pacing comes from spacer siblings placed BETWEEN them.
              This lets every card stay stuck until the container's real end, so
              they accumulate into a deck (each new one covers the previous,
              leaving a thin sliver peek) and then release TOGETHER — instead of
              each card peeling off before the next arrives. */}
          <div ref={containerRef} className="relative mt-10 md:mt-14">
            <StackProgress progress={scrollYProgress} total={projects.length} />
            {projects.map((p, i) => (
              <Fragment key={p.title}>
                <StackCard
                  p={p}
                  i={i}
                  total={projects.length}
                  progress={scrollYProgress}
                  isMobile={isMobile}
                />
                {i < projects.length - 1 && (
                  <div aria-hidden style={{ height: `${gapVh}vh` }} />
                )}
              </Fragment>
            ))}
            <div aria-hidden style={{ height: `${finalHoldVh}vh` }} />
          </div>

          <Reveal className="mt-10 md:mt-14">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-ink text-white px-8 md:px-14 py-10 md:py-12 grain text-center">
              <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-baby/20 blur-3xl" />
              <p className="relative font-display text-xl md:text-3xl font-medium tracking-tight max-w-2xl mx-auto">
                Θες κάτι παρόμοιο για την επιχείρησή σου; Ας το φτιάξουμε μαζί.
              </p>
              <Magnetic strength={0.25} className="relative">
                <button
                  onClick={() => scrollToId("#contact")}
                  data-testid="portfolio-cta-button"
                  className="btn-shine group mt-7 inline-flex items-center gap-2 rounded-full bg-baby px-8 py-3.5 text-sm font-bold text-ink transition-transform duration-300 hover:scale-105"
                >
                  Ζήτησε Δωρεάν Προσφορά
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                </button>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </StackPanel>
  );
}
