import { useEffect, useRef } from "react";
import "@/App.css";
import Lenis from "lenis";
import { Toaster } from "sonner";
import {
  Play,
  ArrowUpRight,
  Smartphone,
  MonitorPlay,
  Megaphone,
  Share2,
  Shapes,
  Film,
  PenTool,
  Palette,
  Send,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";
import ScrollProgress from "@/components/ScrollProgress";
import { WordMask, Reveal, Kicker, Magnetic } from "@/components/Reveal";
import { setLenis } from "@/lib/scroll";
import { useTransitionNavigate } from "@/components/PageTransition";
import useIsMobile from "@/hooks/useIsMobile";

/* Reliable public sample clips used purely as placeholders. Swap these
   `src` values with the studio's real promo videos later. */
const V = {
  hero: "/videos/hero.mp4",
  app: "/videos/app.mp4",
  launch: "/videos/launch.mp4",
  feature: "/videos/feature.mp4",
  motion: "/videos/motion.mp4",
};

const POSTER = {
  hero: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=70&auto=format&fit=crop",
  editing: "https://images.unsplash.com/photo-1528109966604-5a6a4a964e8d?w=1000&q=70&auto=format&fit=crop",
  shoot: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1000&q=70&auto=format&fit=crop",
  abstract1: "https://images.unsplash.com/photo-1732032506091-6fd57cc3113e?w=1000&q=70&auto=format&fit=crop",
  abstract2: "https://images.unsplash.com/photo-1676238560626-45d35b63b38f?w=1000&q=70&auto=format&fit=crop",
};

/* Small autoplay-muted-loop video helper with graceful poster fallback. */
function LoopVideo({ src, poster, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tryPlay = () => el.play().catch(() => {});
    tryPlay();
  }, []);
  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
    />
  );
}

/* One showcase item: a looping muted clip inside a device frame. */
function ShowcaseCard({ item, index }) {
  return (
    <div data-testid={`video-showcase-${index}`} className="group">
      {item.kind === "phone" ? (
        <div className="mx-auto w-full max-w-[220px] rounded-[2rem] border-[7px] border-ink bg-ink shadow-xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
          <div className="relative aspect-[9/16]">
            <LoopVideo
              src={item.src}
              poster={item.poster}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-ink/10 bg-white shadow-lg overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
          <div className="flex items-center gap-1.5 border-b border-ink/5 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-ink/15" />
            <span className="h-2 w-2 rounded-full bg-ink/15" />
            <span className="h-2 w-2 rounded-full bg-ink/15" />
          </div>
          <div className="relative aspect-video bg-ink">
            <LoopVideo
              src={item.src}
              poster={item.poster}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-display font-bold tracking-tight">{item.label}</span>
        <span className="rounded-full bg-baby-light px-3 py-1 text-xs font-semibold text-baby-dark">
          {item.tag}
        </span>
      </div>
    </div>
  );
}

/* Plain section wrapper (kept for a stable API; heavy scroll-linked
   scale/opacity transitions were removed for smoother scrolling). */
function ScrollSection({ children, className = "", id }) {
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
}

const services = [
  {
    icon: Smartphone,
    title: "Promo Βίντεο Εφαρμογών",
    desc: "Σύντομα, δυναμικά βίντεο που δείχνουν την εφαρμογή σου σε δράση — onboarding, βασικές οθόνες και το «γιατί» σε λίγα δευτερόλεπτα.",
    for: "Για app launches & App Store listings",
  },
  {
    icon: MonitorPlay,
    title: "Βίντεο Λανσαρίσματος Ιστοσελίδων",
    desc: "Teasers και hero βίντεο που παρουσιάζουν το νέο site ή redesign σου με καθαρή, κινηματογραφική αίσθηση.",
    for: "Για νέα sites & rebrands",
  },
  {
    icon: Megaphone,
    title: "Βίντεο Παρουσίασης Features",
    desc: "Κάθε νέο feature αξίζει τη δική του στιγμή. Καθαρά explainer clips που δείχνουν τι άλλαξε και γιατί μετράει.",
    for: "Για product updates & announcements",
  },
  {
    icon: Share2,
    title: "Social & Ad Cuts",
    desc: "Κάθετες και τετράγωνες εκδοχές βελτιστοποιημένες για Instagram, TikTok και ads — έτοιμες να σταματήσουν το scroll.",
    for: "Για καμπάνιες & social feeds",
  },
  {
    icon: Shapes,
    title: "Motion Graphics & Logo Animation",
    desc: "Ζωντανεύουμε το λογότυπο και την ταυτότητά σου με κίνηση — intros, outros και animated γραφικά που ξεχωρίζουν.",
    for: "Για brand & presentations",
  },
];

const showcase = [
  { kind: "browser", label: "Launch Teaser", tag: "Ιστοσελίδα", src: V.launch, poster: POSTER.editing },
  { kind: "phone", label: "App Onboarding", tag: "Εφαρμογή", src: V.app, poster: POSTER.abstract1 },
  { kind: "browser", label: "Feature Drop", tag: "Update", src: V.feature, poster: POSTER.shoot },
  { kind: "phone", label: "Social Cut", tag: "Social", src: V.motion, poster: POSTER.abstract2 },
];

const steps = [
  { icon: PenTool, n: "01", title: "Concept & Σενάριο", desc: "Ξεκινάμε από το μήνυμα: τι θέλεις να μείνει στο μυαλό του θεατή. Στήνουμε ιδέα, σενάριο και storyboard." },
  { icon: Film, n: "02", title: "Παραγωγή", desc: "Γυρίσματα, screen recordings ή πλήρως σχεδιασμένες σκηνές — ό,τι ταιριάζει στο προϊόν και στο budget σου." },
  { icon: Palette, n: "03", title: "Editing & Motion", desc: "Μοντάζ, χρωματική επεξεργασία, κίνηση, ήχος και υπότιτλοι — όλα δεμένα σε ένα καθαρό, γρήγορο αποτέλεσμα." },
  { icon: Send, n: "04", title: "Παράδοση", desc: "Παραδίδουμε σε όλες τις αναλογίες που χρειάζεσαι (16:9, 9:16, 1:1), έτοιμα για web, App Store και social." },
];

export default function VideoPage() {
  const isMobile = useIsMobile();
  const navigate = useTransitionNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
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

  const goContact = () => navigate("/", { state: { scrollTo: "#contact" } });

  return (
    <div className="min-h-screen bg-paper text-ink font-body antialiased" data-testid="video-page">
      <Cursor />
      <ScrollProgress />
      <Navbar />

      <main>
        {/* ===================== HERO ===================== */}
        <section className="relative overflow-hidden pt-32 md:pt-40 pb-20 md:pb-28">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-baby/25 blur-3xl" />
            <div className="absolute top-[40%] -left-40 h-[36rem] w-[36rem] rounded-full bg-baby/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <Kicker>KNDP — Video &amp; Motion</Kicker>
              <h1 className="mt-6 font-display font-bold tracking-tighter leading-[0.95] text-5xl md:text-6xl lg:text-7xl">
                <WordMask text="Δίνουμε κίνηση" accent={["κίνηση"]} />
                <br />
                <WordMask text="στις ιδέες σου" delay={0.15} />
              </h1>
              <Reveal delay={0.3}>
                <p className="mt-7 max-w-xl text-lg md:text-xl text-ink/60 leading-relaxed">
                  Προωθητικά βίντεο για εφαρμογές, ιστοσελίδες και νέα features —
                  φτιαγμένα για να τραβούν το βλέμμα, να εξηγούν καθαρά και να
                  μετατρέπουν τον θεατή σε πελάτη.
                </p>
              </Reveal>
              <Reveal delay={0.42}>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Magnetic strength={0.2}>
                    <button
                      onClick={goContact}
                      data-testid="video-hero-cta"
                      className="btn-shine inline-flex items-center gap-2 rounded-full bg-baby px-7 py-3.5 text-base font-bold text-ink transition-[transform,background-color] duration-300 hover:scale-105 hover:bg-baby-dark"
                    >
                      Ζήτησε Δωρεάν Προσφορά
                      <ArrowUpRight className="h-5 w-5" />
                    </button>
                  </Magnetic>
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink/50">
                    {["Promo", "Launch", "Social", "Motion"].map((t) => (
                      <span key={t} className="rounded-full border border-ink/10 bg-white px-3 py-1.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Showcase browser frame + overlapping phone */}
            <div className="lg:col-span-6">
              <Reveal delay={0.2} y={40}>
                <div className="relative">
                  <div className="relative rounded-2xl border border-ink/10 bg-white shadow-2xl shadow-baby/20 overflow-hidden">
                    <div className="flex items-center gap-1.5 border-b border-ink/5 px-4 py-3">
                      <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                      <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                      <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                      <span className="ml-3 truncate rounded-md bg-mist px-3 py-1 text-xs text-ink/40">
                        kndp.studio/showreel
                      </span>
                    </div>
                    <div className="relative aspect-video bg-ink">
                      <LoopVideo
                        src={V.hero}
                        poster={POSTER.hero}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="absolute -top-5 -right-4 rounded-full bg-white shadow-xl border border-ink/5 px-4 py-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-baby text-ink">
                      <Play className="h-3.5 w-3.5 fill-ink" />
                    </span>
                    <span className="text-xs font-bold">Showreel</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===================== SERVICES ===================== */}
        <ScrollSection className="relative py-16 md:py-24 bg-mist">
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="max-w-2xl">
              <Kicker>Τι φτιάχνουμε</Kicker>
              <h2 className="mt-5 font-display font-bold tracking-tighter leading-[1.02] text-4xl md:text-5xl">
                <WordMask text="Βίντεο για κάθε στιγμή" accent={["στιγμή"]} />
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-5 text-lg text-ink/60">
                  Από το πρώτο teaser μέχρι το καθημερινό social content — καλύπτουμε
                  όλο τον κύκλο ζωής ενός προϊόντος με κίνηση.
                </p>
              </Reveal>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Reveal key={s.title} delay={i * 0.06}>
                    <div
                      data-testid={`video-service-card-${i}`}
                      className="group h-full rounded-2xl border border-ink/8 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-baby/15"
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-baby-light text-baby-dark transition-colors duration-300 group-hover:bg-baby group-hover:text-ink">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="mt-5 font-display text-xl font-bold tracking-tight">{s.title}</h3>
                      <p className="mt-2.5 text-ink/60 leading-relaxed">{s.desc}</p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-baby-dark">
                        {s.for}
                      </p>
                    </div>
                  </Reveal>
                );
              })}

              {/* CTA tile */}
              <Reveal delay={services.length * 0.06}>
                <button
                  onClick={goContact}
                  data-testid="video-service-cta-tile"
                  className="group h-full w-full text-left rounded-2xl bg-ink p-7 text-white transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-baby text-ink">
                    <ArrowUpRight className="h-6 w-6 transition-transform duration-300 group-hover:rotate-45" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold tracking-tight">
                    Κάτι άλλο στο μυαλό σου;
                  </h3>
                  <p className="mt-2.5 text-white/60 leading-relaxed">
                    Πες μας την ιδέα σου και τη φέρνουμε σε κίνηση. Δωρεάν πρώτη κουβέντα.
                  </p>
                </button>
              </Reveal>
            </div>
          </div>
        </ScrollSection>

        {/* ===================== SHOWCASE GALLERY ===================== */}
        <ScrollSection className="relative py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-xl">
                <Kicker>Δείγματα κίνησης</Kicker>
                <h2 className="mt-5 font-display font-bold tracking-tighter leading-[1.02] text-4xl md:text-5xl">
                  <WordMask text="Μια γεύση από το στούντιο" accent={["στούντιο"]} />
                </h2>
              </div>
              <Reveal delay={0.1}>
                <p className="max-w-sm text-sm text-ink/50">
                  Ενδεικτικά δείγματα κίνησης. Τα πραγματικά projects του στούντιο
                  προστίθενται σύντομα.
                </p>
              </Reveal>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {showcase.map((item, i) => (
                <Reveal key={item.label} delay={i * 0.08}>
                  <ShowcaseCard item={item} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </ScrollSection>

        {/* ===================== PROCESS ===================== */}
        <ScrollSection className="relative py-20 md:py-28 bg-ink text-white overflow-hidden grain">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-baby/15 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 md:px-10">
            <div className="max-w-2xl">
              <Kicker light>Η διαδικασία</Kicker>
              <h2 className="mt-5 font-display font-bold tracking-tighter leading-[1.02] text-4xl md:text-5xl">
                <WordMask text="Από την ιδέα στην οθόνη" accent={["οθόνη"]} />
              </h2>
              <Reveal delay={0.12}>
                <p className="mt-5 text-lg text-white/60">
                  Καθαρά βήματα, σταθερή επικοινωνία και παράδοση μέσα στον χρόνο
                  που συμφωνήσαμε.
                </p>
              </Reveal>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((st, i) => {
                const Icon = st.icon;
                return (
                  <Reveal key={st.n} delay={i * 0.08}>
                    <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-7 h-full">
                      <span className="font-display text-sm font-bold text-baby">{st.n}</span>
                      <span className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-baby/15 text-baby">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 font-display text-lg font-bold tracking-tight">{st.title}</h3>
                      <p className="mt-2 text-sm text-white/55 leading-relaxed">{st.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </ScrollSection>

        {/* ===================== CTA BAND ===================== */}
        <ScrollSection dim={false} className="relative py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-10">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl bg-baby-light border border-baby/30 p-10 md:p-16 text-center">
                <div className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full bg-baby/30 blur-3xl" aria-hidden="true" />
                <h2 className="relative font-display font-bold tracking-tighter leading-[1.02] text-4xl md:text-5xl">
                  <WordMask text="Έτοιμος να δώσεις κίνηση στο brand σου;" accent={["κίνηση"]} />
                </h2>
                <p className="relative mt-5 mx-auto max-w-xl text-lg text-ink/60">
                  Στείλε μας δυο λόγια για το προϊόν σου και ετοιμάζουμε μια δωρεάν
                  πρόταση για το βίντεό σου.
                </p>
                <div className="relative mt-9 flex flex-wrap justify-center gap-4">
                  <Magnetic strength={0.2}>
                    <button
                      onClick={goContact}
                      data-testid="video-bottom-cta"
                      className="btn-shine inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-base font-bold text-white transition-transform duration-300 hover:scale-105"
                    >
                      Ζήτησε Δωρεάν Προσφορά
                      <ArrowUpRight className="h-5 w-5" />
                    </button>
                  </Magnetic>
                </div>
                <div className="relative mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink/50">
                  {["Δωρεάν πρώτη κουβέντα", "Απάντηση εντός 2 ωρών", "Όλες οι αναλογίες"].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-baby-dark" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </ScrollSection>
      </main>

      <Footer />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
