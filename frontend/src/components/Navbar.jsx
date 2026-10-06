import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";
import { scrollToId } from "@/lib/scroll";
import { useTransitionNavigate } from "@/components/PageTransition";

// Sections of the home page, shown as a submenu under "Αρχική".
const homeSections = [
  { id: "#portfolio", label: "Έργα", testid: "nav-link-portfolio" },
  { id: "#services", label: "Υπηρεσίες", testid: "nav-link-services" },
  { id: "#contact", label: "Επικοινωνία", testid: "nav-link-contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#hero");
  const [homeMenu, setHomeMenu] = useState(false);
  const navigate = useTransitionNavigate();
  const location = useLocation();
  const onHome = location.pathname === "/";
  const onVideo = location.pathname === "/video";

  useEffect(() => {
    if (!onHome) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        }),
      { rootMargin: "-35% 0px -55% 0px" }
    );
    ["#hero", ...homeSections.map((s) => s.id)].forEach((id) => {
      const el = document.querySelector(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onHome]);

  // Scroll to a section on the home page (navigating home first if needed).
  const goSection = (id) => {
    setOpen(false);
    setHomeMenu(false);
    if (!onHome) {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    setActive(id);
    scrollToId(id);
  };

  const goVideo = () => {
    setOpen(false);
    setHomeMenu(false);
    if (onVideo) return;
    navigate("/video");
  };

  return (
    <header
      data-testid="site-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/40"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 h-20 flex items-center justify-between">
        <button
          onClick={() => goSection("#hero")}
          data-testid="nav-logo"
          className="font-display font-bold text-2xl tracking-tighter flex items-center gap-1"
        >
          KNDP
          <span data-scroll-waypoint="logo-start" className="h-2.5 w-2.5 rounded-full bg-baby translate-y-1" />
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {/* Αρχική — main option with a submenu of home sections */}
          <div
            className="relative"
            onMouseEnter={() => setHomeMenu(true)}
            onMouseLeave={() => setHomeMenu(false)}
          >
            <button
              onClick={() => goSection("#hero")}
              data-testid="nav-link-home"
              className={`nav-underline relative inline-flex items-center gap-1 text-sm font-semibold transition-colors duration-300 hover:text-ink ${
                onHome ? "text-ink" : "text-ink/50"
              }`}
            >
              Αρχική
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-300 ${homeMenu ? "rotate-180" : ""}`}
              />
              {onHome && (
                <motion.span
                  layoutId="nav-dot"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-baby"
                />
              )}
            </button>

            <AnimatePresence>
              {homeMenu && (
                <motion.div
                  data-testid="nav-home-submenu"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 top-full -translate-x-1/2 pt-4"
                >
                  <div className="min-w-[200px] rounded-2xl border border-ink/5 bg-white/95 backdrop-blur-md p-2 shadow-xl shadow-ink/5">
                    <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/35">
                      Ενότητες
                    </p>
                    {homeSections.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => goSection(s.id)}
                        data-testid={s.testid}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-baby-light ${
                          onHome && active === s.id ? "text-baby-dark" : "text-ink/70 hover:text-ink"
                        }`}
                      >
                        {s.label}
                        {onHome && active === s.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-baby" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Βίντεο — second main option */}
          <button
            onClick={goVideo}
            data-testid="nav-link-video"
            className={`nav-underline relative text-sm font-semibold transition-colors duration-300 hover:text-ink ${
              onVideo ? "text-ink" : "text-ink/50"
            }`}
          >
            Βίντεο
            {onVideo && (
              <motion.span
                layoutId="nav-dot"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-baby"
              />
            )}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => goSection("#contact")}
            data-testid="nav-cta-button"
            className="btn-shine hidden md:inline-flex items-center gap-1.5 rounded-full bg-baby px-5 py-2.5 text-sm font-bold text-ink transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-baby-dark"
          >
            Ζήτησε Δωρεάν Προσφορά
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            data-testid="mobile-menu-button"
            onClick={() => setOpen(!open)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white"
            aria-label="Εναλλαγή μενού"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            data-testid="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden absolute left-0 right-0 top-full bg-white/95 backdrop-blur-md border-b border-ink/5 shadow-xl"
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {/* Αρχική + its sections */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <button
                  onClick={() => goSection("#hero")}
                  data-testid="mobile-nav-link-home"
                  className={`block py-3 font-display text-2xl font-medium tracking-tight text-left w-full ${
                    onHome ? "text-baby-dark" : "text-ink"
                  }`}
                >
                  Αρχική
                </button>
                <div className="ml-1 mb-2 flex flex-col border-l border-ink/10 pl-4">
                  {homeSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => goSection(s.id)}
                      data-testid={`mobile-${s.testid}`}
                      className={`py-2 text-left text-base font-semibold ${
                        onHome && active === s.id ? "text-baby-dark" : "text-ink/60"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Βίντεο */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 }}
              >
                <button
                  onClick={goVideo}
                  data-testid="mobile-nav-link-video"
                  className={`block py-3 font-display text-2xl font-medium tracking-tight text-left w-full ${
                    onVideo ? "text-baby-dark" : "text-ink"
                  }`}
                >
                  Βίντεο
                </button>
              </motion.div>

              <button
                onClick={() => goSection("#contact")}
                data-testid="mobile-nav-cta-button"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-baby px-6 py-3.5 font-bold text-ink"
              >
                Ζήτησε Δωρεάν Προσφορά
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
