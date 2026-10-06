import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, MousePointerClick } from "lucide-react";
import { Kicker, WordMask, Magnetic } from "@/components/Reveal";
import HeroBackground, { useMouseParallax } from "@/components/HeroBackground";
import ChatDesktop from "@/components/ChatDesktop";
import { StackPanel } from "@/components/StackSection";
import { scrollToId } from "@/lib/scroll";
import useIsMobile from "@/hooks/useIsMobile";
import { useContactModal } from "@/context/ContactModalContext";

export default function Hero(props) {
  const heroRef = useRef(null);
  const isMobile = useIsMobile();
  const { mx, my, onMouseMove, onMouseLeave } = useMouseParallax();
  const { openModal } = useContactModal();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 70]);

  // macOS window "close" (red button): the window stays in place and does a
  // quick, subtle shrink + fade — completed early in the scroll so it feels
  // snappy like clicking the close button.
  const closeScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.88]);
  const closeOpacity = useTransform(scrollYProgress, [0.02, 0.32], [1, 0]);

  const [demoActive, setDemoActive] = useState(false);

  return (
    <StackPanel {...props} innerClassName="">
      <section
        id="hero"
      ref={heroRef}
      data-testid="hero-section"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative min-h-[100svh] flex items-center pt-24 pb-10 overflow-hidden"
    >
      <HeroBackground mx={mx} my={my} />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-8 items-center">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Kicker>KNDP — Digital Studio</Kicker>
          </motion.div>
          <h1
            data-testid="hero-headline"
            className="mt-5 font-display font-bold tracking-tighter leading-[0.95] text-5xl sm:text-6xl lg:text-6xl"
          >
            <WordMask text="Χτίζουμε" delay={0.2} className="block" />
            <WordMask text="Ό,τι" accent={["Ό,τι"]} delay={0.4} className="block" />
            <WordMask text="Χρειάζεσαι." delay={0.6} className="block" />
          </h1>
          <motion.p
            data-testid="hero-subheading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-ink/60"
          >
            Από ιστοσελίδες και εφαρμογές έως έξυπνα εργαλεία και αυτοματισμούς,
            χτίζουμε τις ψηφιακές λύσεις που η επιχείρησή σου χρειάζεται για να αναπτυχθεί.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.05 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Magnetic strength={0.25}>
              <button
                onClick={openModal}
                data-testid="hero-cta-primary"
                className="btn-shine group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-baby-dark hover:text-ink"
              >
                Ζήτησε Δωρεάν Προσφορά
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
              </button>
            </Magnetic>
            <Magnetic strength={0.25}>
              <button
                onClick={() => scrollToId("#services")}
                data-testid="hero-cta-secondary"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 backdrop-blur px-7 py-3.5 text-sm font-bold text-ink transition-[transform,background-color,border-color] duration-300 hover:scale-105 hover:border-baby-dark hover:bg-baby-light"
              >
                Δες Τι Χτίζουμε
              </button>
            </Magnetic>
          </motion.div>
        </div>

        <div className="lg:col-span-5 relative top-[4px] md:-top-[4px] lg:-top-[12px]">
          <motion.div
            style={{
              scale: isMobile ? 1 : closeScale,
              opacity: isMobile ? 1 : closeOpacity,
              transformOrigin: "center center",
            }}
            className="w-full will-change-transform"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full flex justify-center"
            >
              <motion.div
                style={{ y: isMobile ? 0 : phoneY }}
                className={isMobile ? "w-full" : "will-change-transform w-full"}
              >
                <ChatDesktop onActiveChange={setDemoActive} />
              </motion.div>
            </motion.div>
            <AnimatePresence>
              {!demoActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: demoActive ? 0 : 1.25 }}
                  className={`pointer-events-none absolute -bottom-6 -left-4 md:-left-10 max-w-[230px] rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl px-5 py-4 ${isMobile ? "" : "animate-float-soft"}`}
                >
                  <p className="text-xs uppercase tracking-[0.18em] font-bold text-baby-dark flex items-center gap-1.5">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    Δοκίμασέ το τώρα
                  </p>
                  <p className="mt-1.5 font-display font-semibold tracking-tight leading-snug text-sm text-ink">
                    Γράψε την επιχείρησή σου και δες τι μπορούμε να χτίσουμε για σένα.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      </section>
    </StackPanel>
  );
}
