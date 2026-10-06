import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Mail, Send, X } from "lucide-react";
import { Magnetic } from "@/components/Reveal";
import { useContactModal } from "@/context/ContactModalContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const inputCls =
  "w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-[border-color,box-shadow] duration-300 focus:border-baby-dark focus:ring-4 focus:ring-baby/25";

const EMPTY = { name: "", email: "", phone: "", company: "", message: "" };

export default function ContactModal() {
  const { isOpen, closeModal } = useContactModal();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Close on Escape
  const handleKey = useCallback(
    (e) => { if (e.key === "Escape") closeModal(); },
    [closeModal]
  );
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleKey]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) { setForm(EMPTY); setShowSuccess(false); }
  }, [isOpen]);

  // Auto-dismiss success after 4s
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => { setShowSuccess(false); closeModal(); }, 4000);
    return () => clearTimeout(t);
  }, [showSuccess, closeModal]);

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await axios.post(`${API}/contact`, form);
      setShowSuccess(true);
    } catch {
      toast.error("Κάτι πήγε στραβά. Δοκίμασε ξανά.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-testid="contact-modal-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <AnimatePresence mode="wait">
            {!showSuccess ? (
              <motion.div
                key="form"
                role="dialog"
                aria-modal="true"
                data-testid="contact-modal-panel"
                className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-ink/30"
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
              >
                {/* Header strip */}
                <div className="relative bg-baby px-7 pt-8 pb-6 overflow-hidden">
                  <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/25 blur-2xl pointer-events-none" />
                  <button
                    type="button"
                    onClick={closeModal}
                    data-testid="contact-modal-close"
                    aria-label="Κλείσιμο"
                    className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-ink/60 transition-colors hover:bg-white hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/50">KNDP Studio</p>
                  <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tighter text-ink leading-tight">
                    Ας μιλήσουμε.
                  </h2>
                  <a
                    href="mailto:hello@kndp.studio"
                    data-testid="contact-modal-email"
                    className="group mt-4 inline-flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/70 backdrop-blur px-4 py-2.5 text-sm font-semibold text-ink transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Mail className="h-4 w-4 text-baby-dark" />
                    hello@kndp.studio
                    <ArrowUpRight className="h-3.5 w-3.5 text-ink/30 transition-transform duration-300 group-hover:rotate-45" />
                  </a>
                </div>

                {/* Form body */}
                <form
                  data-testid="contact-modal-form"
                  onSubmit={submit}
                  className="px-7 py-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="modal-name" className="mb-1.5 block text-xs uppercase tracking-[0.2em] font-semibold text-ink/50">
                        Όνομα *
                      </label>
                      <input id="modal-name" data-testid="modal-name-input" required value={form.name} onChange={set("name")} placeholder="Το όνομά σου" className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="modal-email" className="mb-1.5 block text-xs uppercase tracking-[0.2em] font-semibold text-ink/50">
                        Email *
                      </label>
                      <input id="modal-email" data-testid="modal-email-input" required type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" className={inputCls} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="modal-phone" className="mb-1.5 block text-xs uppercase tracking-[0.2em] font-semibold text-ink/50">
                        Τηλέφωνο <span className="normal-case tracking-normal font-medium text-ink/30">· προαιρετικό</span>
                      </label>
                      <input id="modal-phone" data-testid="modal-phone-input" type="tel" value={form.phone} onChange={set("phone")} placeholder="π.χ. 69XXXXXXXX" className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="modal-company" className="mb-1.5 block text-xs uppercase tracking-[0.2em] font-semibold text-ink/50">
                        Εταιρεία <span className="normal-case tracking-normal font-medium text-ink/30">· προαιρετικό</span>
                      </label>
                      <input id="modal-company" data-testid="modal-company-input" value={form.company} onChange={set("company")} placeholder="Η εταιρεία σου" className={inputCls} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label htmlFor="modal-message" className="mb-1.5 block text-xs uppercase tracking-[0.2em] font-semibold text-ink/50">
                      Πες μας λίγα λόγια <span className="normal-case tracking-normal font-medium text-ink/30">· προαιρετικό</span>
                    </label>
                    <textarea id="modal-message" data-testid="modal-message-input" rows={3} value={form.message} onChange={set("message")} placeholder="Π.χ. «Θέλω μια ιστοσελίδα για την καφετέρια μου»." className={`${inputCls} resize-none`} />
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <Magnetic strength={0.2}>
                      <button
                        type="submit"
                        data-testid="contact-modal-submit"
                        disabled={sending}
                        className="btn-shine group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-bold text-white transition-[transform,opacity] duration-300 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                      >
                        {sending ? "Αποστολή…" : "Αποστολή Μηνύματος"}
                        <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </button>
                    </Magnetic>
                    <p className="flex items-center gap-2 text-xs font-semibold text-ink/50">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-baby-dark" />
                      Δωρεάν προσφορά — απαντάμε εντός 2 ωρών.
                    </p>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* Success state */
              <motion.div
                key="success"
                role="dialog"
                aria-modal="true"
                data-testid="contact-modal-success"
                className="relative w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/60 bg-white px-8 pb-8 pt-10 text-center shadow-2xl shadow-ink/30"
                initial={{ opacity: 0, scale: 0.85, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 12 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <div className="pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-baby/40 blur-3xl" />
                <button type="button" onClick={closeModal} data-testid="contact-modal-success-close" aria-label="Κλείσιμο" className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink">
                  <X className="h-4 w-4" />
                </button>

                {/* Animated checkmark */}
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  <motion.span className="absolute inset-0 rounded-full bg-baby/40" initial={{ scale: 0.6, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 1.4, ease: "easeOut", delay: 0.25, repeat: Infinity, repeatDelay: 0.6 }} />
                  <motion.span className="absolute inset-0 rounded-full bg-baby/20" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.05 }} />
                  <motion.span className="absolute inset-2 rounded-full bg-gradient-to-br from-baby to-baby-dark shadow-lg shadow-baby/40" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 15, delay: 0.12 }} />
                  <svg viewBox="0 0 24 24" className="relative h-10 w-10">
                    <motion.path d="M4 12.5l5 5L20 6.5" fill="none" stroke="white" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.38 }} />
                  </svg>
                </div>

                <motion.h3 className="relative mt-6 font-display text-2xl font-bold tracking-tight text-ink" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
                  Το μήνυμα εστάλη!
                </motion.h3>
                <motion.p className="relative mt-2 text-sm leading-relaxed text-ink/60" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.4 }}>
                  Ευχαριστούμε! Θα επικοινωνήσουμε σύντομα μαζί σου — εντός 2 ωρών τις εργάσιμες μέρες.
                </motion.p>
                <motion.button type="button" onClick={closeModal} data-testid="contact-modal-success-ok" className="btn-shine relative mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-bold text-white transition-transform duration-300 hover:scale-[1.03]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46, duration: 0.4 }}>
                  Τέλεια!
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
