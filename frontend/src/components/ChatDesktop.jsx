import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Sparkles,
  Loader2,
  Globe,
  AppWindow,
  Smartphone,
  Wrench,
  Zap,
  Code2,
  Boxes,
  MessagesSquare,
} from "lucide-react";
import { useContactModal } from "@/context/ContactModalContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_META = {
  "Ιστοσελίδες": { icon: Globe },
  "Web Apps": { icon: AppWindow },
  "Mobile Apps": { icon: Smartphone },
  "Έξυπνα Εργαλεία": { icon: Sparkles },
  "Web Tools": { icon: Wrench },
  "Automations": { icon: Zap },
  "Προγράμματα": { icon: Code2 },
};

export default function ChatDesktop({ onActiveChange }) {
  const { openModal } = useContactModal();
  const [business, setBusiness] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [ideas, setIdeas] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [error, setError] = useState("");

  // Let the parent (Hero) know when the demo is active so it can hide overlays.
  useEffect(() => {
    if (onActiveChange) onActiveChange(status !== "idle");
  }, [status, onActiveChange]);

  const generate = async (value) => {
    const q = (value ?? business).trim();
    if (!q || status === "loading") return;
    setStatus("loading");
    setError("");
    setIdeas([]);
    setSubmitted(q);
    try {
      const { data } = await axios.post(`${API}/generate-ideas`, { business: q });
      setIdeas(data.ideas || []);
      setTotal(data.total || (data.ideas ? data.ideas.length : 0));
      setHasMore(Boolean(data.has_more));
      setStatus("done");
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          "Κάτι πήγε στραβά. Δοκίμασε ξανά σε λίγο."
      );
      setStatus("error");
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    generate();
  };

  return (
    <div data-testid="hero-desktop" className="relative w-full max-w-[560px] mx-auto">
      <div className="rounded-2xl bg-white shadow-2xl shadow-ink/20 border border-ink/10 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ink/5 bg-mist/70">
          <div data-scroll-waypoint="hero" className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-white border border-ink/10 px-4 py-1.5 text-[11px] font-medium text-ink/50 max-w-[220px] w-full justify-center">
              <Lock className="h-3 w-3 text-ink/35" />
              kndp.studio
            </div>
          </div>
          <div className="w-[52px]" />
        </div>

        {/* App content */}
        <div className="flex flex-col">
          {/* App header */}
          <div className="flex items-center gap-2.5 px-6 pt-4 pb-4 border-b border-ink/5">
            <span className="h-8 w-8 rounded-full bg-baby flex items-center justify-center font-display font-bold text-xs text-ink">
              K
            </span>
            <div>
              <p className="text-xs font-bold text-ink leading-tight">KNDP Studio</p>
            </div>
          </div>

          <div className="p-5">
            {/* Input row */}
            <form onSubmit={onSubmit} className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-ink/50 uppercase tracking-[0.15em]">
                Τι επιχείρηση έχεις;
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  data-testid="hero-idea-input"
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  maxLength={120}
                  placeholder="π.χ. Καφετέρια, Δικηγορικό γραφείο..."
                  className="flex-1 rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm font-semibold text-ink placeholder:font-medium placeholder:text-ink/35 outline-none focus:border-baby-dark focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  data-testid="hero-idea-submit"
                  disabled={!business.trim() || status === "loading"}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-xs font-extrabold text-white transition-[transform,background-color] duration-300 hover:bg-baby-dark hover:text-ink disabled:opacity-40 disabled:pointer-events-none"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Ετοιμάζουμε...
                    </>
                  ) : (
                    <>
                      Δες τι χτίζουμε
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Results area */}
            <div
              data-testid="hero-ideas-results"
              data-lenis-prevent
              className="mt-4 min-h-[210px] max-h-[300px] overflow-y-auto overscroll-auto md:overscroll-contain pr-1"
            >
              <AnimatePresence mode="wait">
                {status === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-[210px] text-center gap-2"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-mist border border-ink/5 text-baby-dark">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-semibold text-ink/60 max-w-[240px] leading-snug">
                      Δες <span className="text-baby-dark">αμέσως</span> ιδέες — χωρίς να στείλεις τίποτα.
                    </p>
                  </motion.div>
                )}

                {status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-mist/70 border border-ink/5 p-2.5 flex items-center gap-3 animate-pulse"
                      >
                        <span className="h-8 w-8 shrink-0 rounded-lg bg-ink/10" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2 w-3/4 rounded bg-ink/10" />
                          <div className="h-2 w-1/2 rounded bg-ink/5" />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {status === "error" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-[210px] text-center gap-3 px-4"
                  >
                    <p className="text-xs font-medium text-ink/60 max-w-[240px] leading-snug">
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={() => generate(submitted)}
                      className="inline-flex items-center gap-2 rounded-full bg-baby px-4 py-2 text-xs font-extrabold text-ink"
                    >
                      Δοκίμασε ξανά
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}

                {status === "done" && (
                  <motion.div
                    key="done"
                    data-testid="hero-demo-results-screen"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="text-[11px] font-bold text-ink/50 mb-2.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-baby-dark" />
                      {total} ιδέες για: <span className="text-ink">{submitted}</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ideas.map((idea, i) => {
                        const Meta = CATEGORY_META[idea.category] || { icon: Boxes };
                        const Icon = Meta.icon;
                        return (
                          <motion.div
                            key={`${idea.title}-${i}`}
                            data-testid={`hero-idea-card-${i}`}
                            initial={{ opacity: 0, scale: 0.9, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: Math.min(i * 0.045, 0.5),
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="rounded-xl bg-mist/60 border border-ink/5 p-2.5 flex items-start gap-2.5"
                          >
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-baby text-ink">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-ink leading-snug">
                                {idea.title}
                              </p>
                              <p className="text-[10px] font-semibold text-baby-dark leading-tight mt-0.5">
                                {idea.category}
                              </p>
                              {idea.description && (
                                <p className="text-[10px] text-ink/50 leading-snug mt-1">
                                  {idea.description}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* More ideas → talk to us */}
                    <motion.button
                      type="button"
                      data-testid="hero-ideas-more-cta"
                      onClick={() => openModal()}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold transition-colors ${
                        hasMore
                          ? "bg-ink text-white hover:bg-baby-dark hover:text-ink"
                          : "bg-baby-light text-ink border border-baby/40 hover:bg-baby"
                      }`}
                    >
                      <MessagesSquare className="h-3.5 w-3.5" />
                      {hasMore
                        ? "Έχουμε κι άλλες ιδέες για σένα — μίλα μαζί μας"
                        : "Πάρε το πλήρες πλάνο — μίλα μαζί μας"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
