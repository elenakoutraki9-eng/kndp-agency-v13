import { ArrowUpRight, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Magnetic } from "@/components/Reveal";
import { scrollToId } from "@/lib/scroll";
import { useTransitionNavigate } from "@/components/PageTransition";

const nav = [
  { id: "#hero", label: "Αρχική", slug: "home" },
  { id: "#services", label: "Υπηρεσίες", slug: "services" },
  { id: "#portfolio", label: "Έργα", slug: "portfolio" },
  { route: "/video", label: "Βίντεο", slug: "video" },
  { id: "#contact", label: "Επικοινωνία", slug: "contact" },
];

export default function Footer() {
  const navigate = useTransitionNavigate();
  const location = useLocation();
  const onHome = location.pathname === "/";

  const goSection = (id) => {
    if (!onHome) {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    scrollToId(id);
  };

  return (
    <footer data-testid="site-footer" className="relative bg-ink text-white overflow-hidden grain">
      <div className="mx-auto max-w-7xl px-6 md:px-10 pt-24 md:pt-32 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-20">
          <div className="md:col-span-6">
            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-white/50 mb-6">
              Έχεις κάτι να χτίσεις;
            </p>
            <Magnetic strength={0.15}>
              <button
                onClick={() => goSection("#contact")}
                data-testid="footer-cta-link"
                className="group inline-flex items-center gap-3 font-display text-4xl md:text-5xl font-medium tracking-tighter"
              >
                Ας μιλήσουμε
                <span className="inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-baby text-ink transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="h-6 w-6" />
                </span>
              </button>
            </Magnetic>
            <a
              href="mailto:hello@kndp.studio"
              data-testid="footer-email-link"
              className="mt-8 block text-white/60 hover:text-baby transition-colors duration-300 text-lg"
            >
              hello@kndp.studio
            </a>
          </div>
          <div className="md:col-span-3 md:col-start-8">
            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-white/50 mb-6">Μενού</p>
            <ul className="space-y-3">
              {nav.map((n) => (
                <li key={n.slug}>
                  {n.route ? (
                    <button
                      onClick={() => navigate(n.route)}
                      data-testid={`footer-link-${n.slug}`}
                      className="text-white/70 hover:text-baby transition-colors duration-300"
                    >
                      {n.label}
                    </button>
                  ) : (
                    <button
                      onClick={() => goSection(n.id)}
                      data-testid={`footer-link-${n.slug}`}
                      className="text-white/70 hover:text-baby transition-colors duration-300"
                    >
                      {n.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2 md:col-start-11">
            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-white/50 mb-6">Στούντιο</p>
            <p className="text-white/70 text-sm leading-relaxed">
              Websites, apps, έξυπνα εργαλεία και αυτοματισμοί — φτιαγμένα για επιχειρήσεις κάθε μεγέθους.
            </p>
          </div>
        </div>

        <div
          data-testid="footer-giant-wordmark"
          className="select-none font-display font-bold tracking-tighter leading-[0.8] text-[24vw] md:text-[18vw] text-white/[0.07] text-center -mb-6 md:-mb-10"
        >
          KNDP
        </div>

        <div className="relative border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <span>© {new Date().getFullYear()} KNDP. Με επιφύλαξη παντός δικαιώματος.</span>
          <div className="flex items-center gap-4">
            <span data-testid="footer-made-with-love" className="inline-flex items-center gap-1.5">
              Φτιαγμένο με <Heart className="h-3 w-3 fill-baby text-baby" /> από την KNDP
            </span>
            <Link
              to="/admin"
              data-testid="footer-admin-link"
              className="text-white/25 hover:text-baby transition-colors duration-300"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
