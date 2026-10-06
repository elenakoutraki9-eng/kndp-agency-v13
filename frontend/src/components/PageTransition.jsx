import { createContext, useCallback, useContext, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

/*
  Branded route transition.
  go(to, options) → a baby-blue curtain slides up over the page with the
  white KNDP logo; once fully covered we jump scroll to the top instantly
  (no visible scroll-up), swap the route, then the curtain slides away
  upward revealing the new page.
*/

const TransitionCtx = createContext(null);

const EASE = [0.76, 0, 0.24, 1];
const COVER = 0.6;
const REVEAL = 0.65;
const HOLD_MS = 420;

const instantTop = () => {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  html.style.scrollBehavior = prev;
};

export function PageTransitionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState("idle"); // idle | cover | reveal
  const pending = useRef(null);
  const busy = useRef(false);

  const go = useCallback(
    (to, options) => {
      if (busy.current) return;
      // Same page and nothing to do → ignore.
      if (to === location.pathname && !options?.state) return;
      busy.current = true;
      pending.current = { to, options };
      setPhase("cover");
    },
    [location.pathname]
  );

  const onCovered = () => {
    const { to, options } = pending.current || {};
    instantTop();
    navigate(to, options);
    // Make sure the new page starts at the very top, even after it mounts.
    requestAnimationFrame(() => {
      if (!options?.state?.scrollTo) instantTop();
    });
    setTimeout(() => setPhase("reveal"), HOLD_MS);
  };

  const onRevealed = () => {
    setPhase("idle");
    busy.current = false;
    pending.current = null;
  };

  const panel = {
    idle: { y: "100%", transition: { duration: 0 } },
    cover: { y: "0%", transition: { duration: COVER, ease: EASE } },
    reveal: { y: "-100%", transition: { duration: REVEAL, ease: EASE } },
  };
  const backPanel = {
    idle: { y: "100%", transition: { duration: 0 } },
    cover: { y: "0%", transition: { duration: COVER, ease: EASE } },
    reveal: { y: "-100%", transition: { duration: REVEAL, ease: EASE, delay: 0.08 } },
  };
  const logo = {
    idle: { y: "110%", opacity: 0, transition: { duration: 0 } },
    cover: { y: "0%", opacity: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: COVER * 0.55 } },
    reveal: { y: "-60%", opacity: 0, transition: { duration: 0.35, ease: EASE } },
  };
  const dot = {
    idle: { scale: 0, transition: { duration: 0 } },
    cover: { scale: [0, 1.5, 1], transition: { duration: 0.5, delay: COVER * 0.55 + 0.3 } },
    reveal: { scale: 0, transition: { duration: 0.25 } },
  };
  const bar = {
    idle: { scaleX: 0, transition: { duration: 0 } },
    cover: { scaleX: 1, transition: { duration: COVER * 0.5 + HOLD_MS / 1000, ease: "easeInOut", delay: COVER * 0.5 } },
    reveal: { opacity: 0, transition: { duration: 0.2 } },
  };

  const active = phase !== "idle";

  return (
    <TransitionCtx.Provider value={{ go, transitioning: active }}>
      {children}
      <div
        aria-hidden={!active}
        data-testid="page-transition"
        data-phase={phase}
        className={`fixed inset-0 z-[200] overflow-hidden ${active ? "pointer-events-auto" : "pointer-events-none invisible"}`}
      >
        {/* trailing lighter layer for depth */}
        <motion.div
          variants={backPanel}
          initial="idle"
          animate={phase}
          className="absolute inset-0 bg-baby"
        />
        {/* main curtain */}
        <motion.div
          variants={panel}
          initial="idle"
          animate={phase}
          onAnimationComplete={(def) => {
            if (def === "cover") onCovered();
            else if (def === "reveal") onRevealed();
          }}
          className="absolute inset-0 bg-baby-dark flex items-center justify-center"
          data-testid="page-transition-curtain"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="overflow-hidden py-2">
              <motion.div
                variants={logo}
                initial="idle"
                animate={phase}
                data-testid="page-transition-logo"
                className="font-display font-bold text-white tracking-tighter text-6xl md:text-8xl flex items-end gap-2"
              >
                KNDP
                <motion.span
                  variants={dot}
                  initial="idle"
                  animate={phase}
                  className="mb-3 md:mb-4 h-4 w-4 md:h-5 md:w-5 rounded-full bg-white"
                />
              </motion.div>
            </div>
            <div className="h-[2px] w-32 md:w-40 bg-white/25 overflow-hidden rounded-full">
              <motion.div
                variants={bar}
                initial="idle"
                animate={phase}
                className="h-full w-full bg-white origin-left"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </TransitionCtx.Provider>
  );
}

// Returns a navigate-like function that plays the branded transition.
export function useTransitionNavigate() {
  const ctx = useContext(TransitionCtx);
  const navigate = useNavigate();
  return ctx ? ctx.go : navigate;
}
