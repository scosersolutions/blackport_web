/**
 * Motion mínimo y sin dependencias:
 * - Revelados al entrar en pantalla ([data-reveal], [data-lava]).
 * - Parallax sutil ([data-parallax="0.08"]) solo en escritorio y sin reduced-motion.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

function revealAll(): void {
  document.querySelectorAll('[data-reveal], [data-lava]').forEach((el) => el.classList.add('is-in'));
}

function setupReveal(): void {
  if (reduce.matches || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );
  document.querySelectorAll('[data-reveal], [data-lava]').forEach((el) => io.observe(el));
}

function setupParallax(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  const wide = window.matchMedia('(min-width: 900px)');
  if (!items.length) return;

  let ticking = false;
  const update = (): void => {
    ticking = false;
    if (reduce.matches || !wide.matches) {
      items.forEach((el) => (el.style.transform = ''));
      return;
    }
    const vh = window.innerHeight;
    for (const el of items) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      const speed = Number(el.dataset.parallax) || 0.08;
      const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  };
  const onScroll = (): void => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

setupReveal();
setupParallax();
