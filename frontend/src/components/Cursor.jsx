import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [scale, setScale] = useState(1);
  const cursorRef = useRef(null);
  const hoveringRef = useRef(false);
  const downRef = useRef(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);

    const style = document.createElement("style");
    style.setAttribute("data-cursor-hide", "true");
    style.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(style);

    // Direct DOM write — bypasses React and Framer Motion entirely for position.
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    const syncScale = () => {
      setScale(downRef.current ? 0.7 : hoveringRef.current ? 1.22 : 1);
    };

    const over = (e) => {
      const next = !!e.target.closest("a,button,input,textarea,select,[data-cursor]");
      if (next !== hoveringRef.current) {
        hoveringRef.current = next;
        syncScale();
      }
    };

    const onDown = () => { if (!downRef.current) { downRef.current = true; syncScale(); } };
    const onUp   = () => { if (downRef.current)  { downRef.current = false; syncScale(); } };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup",   onUp,   { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      style.remove();
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden
      data-testid="custom-cursor"
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block will-change-transform"
      style={{ transform: "translate(-100px, -100px)" }}
    >
      <motion.span
        animate={{ scale }}
        transition={{ type: "spring", stiffness: 650, damping: 28, mass: 0.3 }}
        className="block h-3 w-3 -ml-1.5 -mt-1.5 rounded-full bg-baby shadow-[0_0_14px_rgba(120,170,255,0.75)]"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
