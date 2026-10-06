import { ArrowUpRight } from "lucide-react";
import { Kicker, Magnetic, Reveal } from "@/components/Reveal";
import { scrollToId } from "@/lib/scroll";


const categories = [
  {
    slug: "customers",
    name: "Για τους Πελάτες σου",
    services: [
      {
        n: "01",
        title: "Websites",
        text: "Ένας γρήγορος, καλοσχεδιασμένος ιστότοπος που μετατρέπει επισκέπτες σε πελάτες.",
        who: "Για επιχειρήσεις που θέλουν περισσότερους πελάτες",
      },
      {
        n: "03",
        title: "Mobile Apps",
        text: "Κρατήσεις, παραγγελίες και λογαριασμός με λίγα πατήματα — ένας λόγος να επιστρέφουν.",
        who: "Για επιχειρήσεις που χτίζουν πίστη πελατών",
      },
      {
        n: "04",
        title: "Web Apps",
        text: "Οι πελάτες κρατούν, πληρώνουν και διαχειρίζονται τα πάντα μόνοι τους — λιγότερος χρόνος στο τηλέφωνο.",
        who: "Για επιχειρήσεις που πνίγονται στις συνεχείς επικοινωνίες",
      },
      {
        n: "09",
        title: "eShop",
        text: "Ένα ολοκληρωμένο online κατάστημα — προϊόντα, καλάθι και ασφαλείς πληρωμές, έτοιμα να πουλήσουν 24/7.",
        who: "Για επιχειρήσεις που θέλουν να πουλάνε online",
      },
    ],
  },
  {
    slug: "team",
    name: "Για την Ομάδα σου",
    services: [
      {
        n: "02",
        title: "Web Tools",
        text: "Όλα τα νούμερα που μετράνε σε ένα μέρος — τέλος στα ατέλειωτα spreadsheets.",
        who: "Για ομάδες που κουράστηκαν από τη χειρωνακτική δουλειά",
      },
      {
        n: "06",
        title: "Έξυπνα Εργαλεία",
        text: "Ένα εργαλείο φτιαγμένο για τον τρόπο που δουλεύεις — η αγγαρεία εξαφανίζεται.",
        who: "Για ομάδες που έχουν πνιγεί σε επαναλαμβανόμενες εργασίες",
      },
    ],
  },
  {
    slug: "operations",
    name: "Για τη Λειτουργία σου",
    services: [
      {
        n: "05",
        title: "Προγράμματα",
        text: "Απόθεμα, πρόγραμμα και αναφορές πάντα σωστά και ενημερωμένα, αυτόματα.",
        who: "Για λειτουργίες που δεν έχουν περιθώριο για λάθη",
      },
      {
        n: "07",
        title: "Automations",
        text: "Συνδέουμε τα συστήματά σου ώστε τα δεδομένα να μετακινούνται μόνα τους, σωστά κάθε φορά.",
        who: "Για επιχειρήσεις που είναι έτοιμες να σταματήσουν την αγγαρεία",
      },
      {
        n: "08",
        title: "Έξυπνες Ψηφιακές Λύσεις",
        text: "Έχεις πρόβλημα εκτός κατηγορίας; Πες μας το και θα σχεδιάσουμε τη λύση.",
        who: "Για όποιον έχει ένα πρόβλημα που αξίζει να λυθεί",
      },
    ],
  },
];

export default function ServicesSection() {
  return (
    <section id="services" data-testid="services-section" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Reveal y={24}>
            <Kicker waypoint="services">Υπηρεσίες</Kicker>
            <h2
              data-testid="services-headline"
              className="mt-3 font-display text-3xl md:text-5xl font-medium tracking-tight max-w-3xl"
            >
              <span className="block">Αν υπάρχει σε μια οθόνη,</span>
              <span className="block">
                μπορούμε να το <span className="text-baby-dark italic">χτίσουμε.</span>
              </span>
            </h2>
          </Reveal>

          <div className="mt-5 space-y-6" data-testid="services-categories">
            {categories.map((cat) => (
              <div key={cat.slug} data-testid={`services-category-${cat.slug}`}>
                <Reveal y={16} duration={0.4}>
                  <p className="text-sm font-display font-semibold text-baby-dark tracking-tight">
                    {cat.name}
                  </p>
                </Reveal>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {cat.services.map((s, i) => (
                    <Reveal key={s.n} delay={0.05 * i} margin="200px" duration={0.35}>
                      <div
                        data-testid={`service-card-${s.n}`}
                        className="group h-full flex flex-col rounded-2xl border border-ink/8 bg-white p-4 md:p-5 transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-baby/15 hover:border-baby/50"
                      >
                        <span className="font-display text-sm font-light text-baby-dark">{s.n}</span>
                        <h4 className="mt-1.5 font-display text-lg md:text-xl font-medium tracking-tight">
                          {s.title}
                        </h4>
                        <p className="mt-1.5 text-sm text-ink/60 leading-relaxed flex-1">{s.text}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 md:mt-12">
            <Reveal y={30} scale={0.97}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-[2rem] bg-baby-light border border-baby/40 px-6 md:px-10 py-7 md:py-9 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-baby/40 blur-3xl animate-float-soft" />
              <div className="relative">
                <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tighter">
                  Δεν είσαι σίγουρος τι χρειάζεσαι;
                </h3>
                <p className="mt-2 text-sm text-ink/60 max-w-lg leading-relaxed">
                  Πες μας το πρόβλημα — θα σου πούμε ειλικρινά τι χρειάζεται.
                </p>
              </div>
              <Magnetic strength={0.25} className="relative shrink-0">
                <button
                  onClick={() => scrollToId("#contact")}
                  data-testid="services-cta-button"
                  className="btn-shine group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition-transform duration-300 hover:scale-105"
                >
                  Ζήτησε Δωρεάν Προσφορά
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                </button>
              </Magnetic>
            </div>
            </Reveal>
          </div>
        </div>
    </section>
  );
}
