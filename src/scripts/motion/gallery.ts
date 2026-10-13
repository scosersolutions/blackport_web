/**
 * Galería: recorrido horizontal.
 * - Escritorio con movimiento: el panel se fija (ScrollTrigger) y el scroll vertical
 *   mueve la pista; cada foto se desplaza dentro de su marco, la pista se inclina con
 *   la velocidad y el rótulo de fondo va en sentido contrario.
 * - Móvil o reduced-motion: carrusel nativo con scroll horizontal y snap.
 * Contador, barra y flechas funcionan en ambos modos.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface GalleryEls {
  section: HTMLElement;
  viewport: HTMLElement;
  track: HTMLElement;
  items: HTMLElement[];
}

let pinTrigger: ScrollTrigger | null = null;

const els = (): GalleryEls | null => {
  const section = document.querySelector<HTMLElement>('[data-hscroll]');
  const viewport = section?.querySelector<HTMLElement>('[data-g-viewport]');
  const track = section?.querySelector<HTMLElement>('[data-g-track]');
  if (!section || !viewport || !track) return null;
  return { section, viewport, track, items: Array.from(track.querySelectorAll<HTMLElement>('[data-g-item]')) };
};

const setProgress = ({ section, items }: GalleryEls, p: number): void => {
  const bar = section.querySelector<HTMLElement>('[data-g-bar]');
  const current = section.querySelector<HTMLElement>('[data-g-current]');
  if (bar) bar.style.transform = `scaleX(${Math.max(0.04, p).toFixed(4)})`;
  const idx = Math.min(items.length - 1, Math.round(p * (items.length - 1)));
  if (current) current.textContent = String(idx + 1).padStart(2, '0');
};

/** Controles comunes (siempre activos). */
export function setupGalleryControls(): void {
  const g = els();
  if (!g) return;
  const { section, viewport, items } = g;

  viewport.addEventListener(
    'scroll',
    () => {
      if (pinTrigger) return;
      const range = viewport.scrollWidth - viewport.clientWidth;
      setProgress(g, range > 0 ? viewport.scrollLeft / range : 0);
    },
    { passive: true },
  );

  const step = (dir: 1 | -1): void => {
    const width = (items[0]?.offsetWidth ?? 300) + 24;
    if (!pinTrigger) {
      viewport.scrollBy({ left: dir * width, behavior: 'smooth' });
      return;
    }
    const maxX = g.track.scrollWidth - viewport.clientWidth;
    const range = pinTrigger.end - pinTrigger.start;
    window.scrollBy({ top: maxX > 0 ? dir * (width / maxX) * range : 0, behavior: 'smooth' });
  };
  section.querySelector('[data-g-prev]')?.addEventListener('click', () => step(-1));
  section.querySelector('[data-g-next]')?.addEventListener('click', () => step(1));

  // Teclado en modo fijado: llevar a la vista la foto que recibe el foco.
  g.track.addEventListener('focusin', (e) => {
    if (!pinTrigger) return;
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-g-item], .g-end');
    const maxX = g.track.scrollWidth - viewport.clientWidth;
    if (!item || maxX <= 0) return;
    const target = Math.min(maxX, Math.max(0, item.offsetLeft - (viewport.clientWidth - item.offsetWidth) / 2));
    window.scrollTo({ top: pinTrigger.start + (target / maxX) * (pinTrigger.end - pinTrigger.start) });
  });
}

/** Escena fijada (solo escritorio con movimiento). Devuelve la limpieza. */
export function galleryPinScene(): () => void {
  const g = els();
  if (!g) return () => {};
  const { section, viewport, track, items } = g;
  const pin = section.querySelector<HTMLElement>('.g-pin')!;
  section.classList.add('is-pinned');

  const distance = (): number => Math.max(0, track.scrollWidth - viewport.clientWidth);
  const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' });

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      pin,
      start: 'top top',
      end: () => `+=${distance()}`,
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setProgress(g, self.progress);
        skewTo(gsap.utils.clamp(-5, 5, self.getVelocity() / -450));
      },
      onScrubComplete: () => skewTo(0),
    },
  });
  pinTrigger = tween.scrollTrigger ?? null;

  // Cada foto se mueve dentro de su marco mientras cruza la pantalla.
  items.forEach((item) => {
    const pic = item.querySelector('picture');
    if (!pic) return;
    gsap.fromTo(
      pic,
      { xPercent: 8 },
      {
        xPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: item, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      },
    );
  });

  const bgword = section.querySelector<HTMLElement>('[data-g-bgword]');
  if (bgword) {
    gsap.fromTo(bgword, { xPercent: -30 }, { xPercent: 5, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: true } });
  }

  // Cursor contextual «Ver» sobre las fotos (solo puntero fino).
  const cursor = section.querySelector<HTMLElement>('[data-g-cursor]');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cleanups: Array<() => void> = [];
  if (cursor && fine.matches) {
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    const move = (e: PointerEvent): void => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const over = (e: PointerEvent): void => {
      const on = Boolean((e.target as HTMLElement).closest('.g-btn'));
      cursor.style.opacity = on ? '1' : '0';
      cursor.style.scale = on ? '1' : '0.3';
    };
    window.addEventListener('pointermove', move, { passive: true });
    track.addEventListener('pointerover', over);
    track.addEventListener('pointerleave', () => (cursor.style.opacity = '0'));
    cleanups.push(() => {
      window.removeEventListener('pointermove', move);
      track.removeEventListener('pointerover', over);
      cursor.style.opacity = '0';
    });
  }

  return () => {
    cleanups.forEach((c) => c());
    pinTrigger = null;
    section.classList.remove('is-pinned');
  };
}

export { ScrollTrigger };
