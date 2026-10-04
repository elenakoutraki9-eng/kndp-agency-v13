import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import useIsMobile from "@/hooks/useIsMobile";

const EASE = [0.22, 1, 0.36, 1];

export const MaskLine = ({ children, delay = 0, className = "" }) => {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block will-change-transform"
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
};

export const WordMask = ({ text, accent = [], delay = 0, stagger = 0.07, className = "" }) => {
  const words = text.split(" ");
  const dur = 0.75;
  const stag = stagger;
  const baseDelay = delay;
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="inline-block overflow-hidden align-bottom pt-[0.22em] -mt-[0.22em] pb-[0.3em] -mb-[0.3em] px-[0.12em] -mx-[0.12em]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.span
            className={`inline-block will-change-transform ${
              accent.includes(w) ? "text-baby-dark italic" : ""
            }`}
            variants={{
              hidden: { y: "115%", rotate: 3 },
              show: {
                y: 0,
                rotate: 0,
                transition: { duration: dur, delay: baseDelay + i * stag, ease: EASE },
              },
            }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </motion.span>
      ))}
    </span>
  );
};

export const Reveal = ({ children, delay = 0, y = 28, x = 0, scale = 1, className = "", margin = "-80px", duration }) => {
  const isMobile = useIsMobile();
  // On mobile, trigger as soon as any part of the element enters the viewport
  // (near-zero threshold, no negative margin delaying it) and appear faster once triggered.
  const effectiveMargin = isMobile ? "0px" : margin;
  const effectiveDelay = isMobile ? Math.min(delay, 0.1) : delay;
  const effectiveDuration = duration ?? (isMobile ? 0.4 : 0.8);
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: effectiveMargin, amount: 0 }}
      transition={{ duration: effectiveDuration, delay: effectiveDelay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

export const ParallaxY = ({ children, distance = 40, className = "" }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yRange = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <motion.div ref={ref} style={{ y: yRange }} className={className}>
      {children}
    </motion.div>
  );
};

export const Counter = ({ to, suffix = "", className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, to, mv]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
};

export const Magnetic = ({ children, strength = 0.3, className = "" }) => {
  const isMobile = useIsMobile();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 16, mass: 0.2 });
  const sy = useSpring(y, { stiffness: 200, damping: 16, mass: 0.2 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  // No cursor on touch devices — render static wrapper to avoid pointer transforms.
  if (isMobile) {
    return <div className={`inline-block ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const Kicker = ({ children, className = "", light = false, waypoint }) => (
  <span
    className={`inline-flex items-center gap-2 text-xs md:text-sm uppercase tracking-[0.25em] font-semibold ${
      light ? "text-white/60" : "text-ink/60"
    } ${className}`}
  >
    <motion.span
      data-scroll-waypoint={waypoint || undefined}
      className="h-2 w-2 rounded-full bg-baby"
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    />
    {children}
  </span>
);
