import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);
  const hoveringRef = useRef(false);
  const downRef = useRef(false);
  // Position tracked directly (no spring) so the dot sits exactly on the
  // pointer — no trailing / follow-up lag.
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);

    // The blue dot IS the cursor — hide the native OS cursor everywhere.
    const style = document.createElement("style");
    style.setAttribute("data-cursor-hide", "true");
    style.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(style);

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    // Only trigger a re-render when the hover state actually changes,
    // not on every mouseover (which fires for every element traversed).
    const over = (e) => {
      const next = !!e.target.closest("a,button,input,textarea,select,[data-cursor]");
      if (next !== hoveringRef.current) {
        hoveringRef.current = next;
        setHovering(next);
      }
    };
    const onDown = () => {
      if (!downRef.current) { downRef.current = true; setDown(true); }
    };
    const onUp = () => {
      if (downRef.current) { downRef.current = false; setDown(false); }
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      style.remove();
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      data-testid="custom-cursor"
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
      style={{ x, y, willChange: "transform" }}
    >
      {/* Small blue dot, matching the accent dot next to the KNDP logo */}
      <motion.span
        animate={{ scale: down ? 0.7 : hovering ? 1.22 : 1 }}
        transition={{ type: "spring", stiffness: 650, damping: 28, mass: 0.3 }}
        className="block h-3 w-3 -ml-1.5 -mt-1.5 rounded-full bg-baby shadow-[0_0_14px_rgba(120,170,255,0.75)]"
        style={{ willChange: "transform" }}
      />
    </motion.div>
  );
}
