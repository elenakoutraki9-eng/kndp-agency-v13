let lenisInstance = null;

export const setLenis = (l) => {
  lenisInstance = l;
};

export const scrollToId = (id, { immediate = false } = {}) => {
  const el = document.querySelector(id);
  if (!el) return;
  if (immediate) {
    // Jump instantly (used behind the page-transition curtain).
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    if (lenisInstance) lenisInstance.scrollTo(Math.max(0, top), { immediate: true, force: true });
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    html.style.scrollBehavior = prev;
    return;
  }
  if (lenisInstance) {
    lenisInstance.scrollTo(el, { offset: -76, duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: "smooth" });
  }
};
