/**
 * Escenas ligadas al scroll (todas menos el hero, en hero.ts, y la galería, en gallery.ts).
 * Concepto: obsidiana, ceniza y lava. La lava solo aparece donde conecta escenas
 * (gotas vivas, frente de lava de la reserva) o como calor (fotos, nota, lago).
 * Se crean dentro de gsap.matchMedia (index.ts), que las revierte al cambiar de contexto;
 * las que añaden listeners o WebGL devuelven su limpieza.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Magma, webglAvailable } from './magma';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(sel));
const fine = (): boolean => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── Sobre: miniaturas que se abren, retrato que se descubre como una grieta, profundidad ── */
export function aboutScene(desktop: boolean): () => void {
  const about = $('[data-scene="about"]');
  if (!about) return () => {};
  const cleanups: Array<() => void> = [];

  $$('.pill', about).forEach((pill, i) => {
    gsap.from(pill, {
      clipPath: 'inset(0 50% 0 50% round 999px)',
      duration: 1.3,
      delay: 0.35 + i * 0.15,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: pill, start: 'top 88%' },
    });
    gsap.from($('img', pill), { scale: 1.8, duration: 1.8, delay: 0.35 + i * 0.15, ease: 'expo.out', scrollTrigger: { trigger: pill, start: 'top 88%' } });
  });

  const frame = $('[data-portrait]', about);
  if (frame) {
    // Se abre como una fisura irregular que se ensancha hasta el marco completo.
    gsap
      .timeline({ scrollTrigger: { trigger: frame, start: 'top 92%', end: 'center 50%', scrub: 0.8 } })
      .fromTo(
        frame,
        { clipPath: 'polygon(46% 0%, 55% 0%, 52% 30%, 57% 58%, 51% 100%, 44% 100%, 48% 64%, 43% 34%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 30%, 100% 58%, 100% 100%, 0% 100%, 0% 64%, 0% 34%)', ease: 'none' },
        0,
      )
      .fromTo($('.media', frame), { scale: 1.4 }, { scale: 1, ease: 'none' }, 0);
  }

  const detail = $('[data-detail]', about);
  if (detail) {
    gsap.fromTo(
      detail,
      { yPercent: desktop ? 40 : 15, rotate: desktop ? 5 : 2 },
      { yPercent: desktop ? -30 : -5, rotate: -2, ease: 'none', scrollTrigger: { trigger: detail, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  }

  gsap.from($$('.about-values li', about), {
    xPercent: -12,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: $('.about-values', about), start: 'top 85%' },
  });

  // Profundidad con el puntero: el retrato gira hacia el cursor y el detalle va al revés.
  const tilt = $('[data-tilt]', about);
  if (desktop && tilt && fine()) {
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3' });
    const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3' });
    const dx = detail ? gsap.quickTo(detail, 'x', { duration: 1.1, ease: 'power3' }) : null;
    gsap.set(tilt, { transformPerspective: 1000 });
    const move = (e: PointerEvent): void => {
      const r = about.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * 9);
      rx(ny * -6);
      dx?.(nx * -30);
    };
    about.addEventListener('pointermove', move);
    cleanups.push(() => about.removeEventListener('pointermove', move));
  }
  return () => cleanups.forEach((c) => c());
}

/* ── Galería: la losa de obsidiana sube sobre la ceniza ── */
export function galleryEnter(): void {
  const section = $('#galeria');
  if (!section) return;
  gsap.fromTo(
    section,
    { clipPath: 'inset(9% 5% 0% 5% round 28px)' },
    {
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 15%', scrub: true },
    },
  );
}

/* ── Servicios: filas que entran; en móvil, la foto de cada categoría se descubre ── */
export function servicesScene(): () => void {
  const section = $('[data-scene="services"]');
  if (!section) return () => {};
  const cleanups: Array<() => void> = [];

  const weekly = $('[data-weekly]', section);
  if (weekly) {
    gsap
      .timeline({ scrollTrigger: { trigger: weekly, start: 'top 85%' } })
      .from(weekly, { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'expo.inOut' })
      .from($$('.weekly-price, .weekly-body > *', weekly), { y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 0.5);
  }

  $$('[data-svc-group]', section).forEach((group) => {
    const head = $('[data-svc-head]', group);
    const rows = $$('[data-svc-row]', group);
    const tl = gsap.timeline({ scrollTrigger: { trigger: group, start: 'top 82%' } });
    if (head) tl.from(head, { clipPath: 'inset(0 100% 0 0)', duration: 0.9, ease: 'expo.inOut' }, 0);
    tl.from(rows, { yPercent: 40, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out' }, 0.15);
    const banner = $('[data-svc-banner]', group);
    if (banner && getComputedStyle(banner).display !== 'none') {
      gsap.fromTo(banner, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', ease: 'none', scrollTrigger: { trigger: banner, start: 'top 95%', end: 'top 55%', scrub: 0.6 } });
      gsap.fromTo($('.media', banner), { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: banner, start: 'top 95%', end: 'bottom 40%', scrub: true } });
    }
  });

  return () => cleanups.forEach((c) => c());
}

/* ── Reserva: un frente de lava sube sobre la carta y el lago se calienta ── */
export function bookingScene(desktop: boolean, animate: boolean): () => void {
  const section = $('[data-scene="booking"]');
  if (!section) return () => {};
  const cleanups: Array<() => void> = [];

  const canvas = $<HTMLCanvasElement>('[data-magma="lake"]', section);
  let magma: Magma | null = null;
  if (canvas && webglAvailable()) {
    try {
      magma = new Magma(canvas, 'lake', animate);
      magma.state.heat = animate ? 0.2 : 0.7;
      magma.kick();
      cleanups.push(() => magma?.destroy());
    } catch {
      magma = null;
    }
  }
  if (!animate) {
    magma?.render();
    return () => cleanups.forEach((c) => c());
  }

  // Frente de lava: el borde superior ondula y sube hasta quedar recto.
  const rise = (): number => Math.max(0, -parseFloat(getComputedStyle(section).marginTop) || 0);
  const POINTS = 28;
  const edge = (p: number, t: number): string => {
    if (p >= 0.999) return 'none';
    const r = rise();
    const amp = (desktop ? 34 : 18) * (1 - p);
    const pts: string[] = [];
    for (let i = 0; i <= POINTS; i++) {
      const x = i / POINTS;
      const y = r * (1 - p) + amp * (0.55 * Math.sin(x * 9 + t * 0.9) + 0.45 * Math.sin(x * 23 - t * 1.3)) + amp;
      pts.push(`${(x * 100).toFixed(2)}% ${Math.max(0, y).toFixed(1)}px`);
    }
    return `polygon(${pts.join(',')},100% 100%,0% 100%)`;
  };
  const front = { p: 0 };
  let t = 0;
  const paint = (): void => {
    section.style.clipPath = edge(front.p, t);
  };
  const tick = (_time: number, dt: number): void => {
    if (front.p >= 0.999) return;
    t += dt / 1000;
    paint();
  };
  section.classList.add('has-front');
  gsap.ticker.add(tick);
  const st = ScrollTrigger.create({
    trigger: section,
    start: () => `top+=${rise()} bottom`,
    end: 'top 20%',
    scrub: 0.6,
    animation: gsap.to(front, { p: 1, ease: 'none', onUpdate: paint }),
    invalidateOnRefresh: true,
  });
  cleanups.push(() => {
    gsap.ticker.remove(tick);
    st.kill();
    section.style.clipPath = '';
    section.classList.remove('has-front');
  });

  if (magma) {
    const m = magma;
    gsap.fromTo(m.state, { heat: 0.15 }, { heat: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top 80%', end: 'center 40%', scrub: true } });
  }

  const ring = $('.orb-ring', section);
  if (ring) gsap.to(ring, { rotate: 360, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  const orb = $('.orb', section);
  if (orb) gsap.from(orb, { scale: 0, rotate: -90, duration: 1.4, ease: 'elastic.out(1, 0.6)', scrollTrigger: { trigger: orb, start: 'top 85%' } });

  return () => cleanups.forEach((c) => c());
}

/* ── Reseñas: la lava sube por las cifras de la nota ── */
export function reviewsScene(): void {
  const section = $('[data-scene="reviews"]');
  if (!section) return;
  const num = $('.score-num', section);
  if (num) {
    gsap.fromTo(num, { '--fill': 0 }, { '--fill': 1, ease: 'none', scrollTrigger: { trigger: num, start: 'top 85%', end: 'bottom 45%', scrub: 0.8 } });
    gsap.from(num, { yPercent: 20, scale: 0.85, transformOrigin: '0% 100%', ease: 'none', scrollTrigger: { trigger: num, start: 'top bottom', end: 'top 40%', scrub: true } });
  }
  gsap.from($$('.source', section), {
    clipPath: 'inset(0 100% 0 0)',
    duration: 1,
    stagger: 0.12,
    ease: 'expo.inOut',
    scrollTrigger: { trigger: $('.sources', section), start: 'top 88%' },
  });
}

/* ── Visítanos: dirección que sube línea a línea, mapa que se abre ── */
export function visitScene(): void {
  const section = $('[data-scene="visit"]');
  if (!section) return;
  gsap.from($$('.visit-address > span', section), {
    yPercent: 100,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: $('.visit-address', section), start: 'top 88%' },
  });
  const map = $('[data-map-window]', section);
  if (map) {
    gsap
      .timeline({ scrollTrigger: { trigger: map, start: 'top 85%' } })
      .from(map, { clipPath: 'inset(50% 0% 50% 0% round 2px)', duration: 1.3, ease: 'expo.inOut' })
      .from($('.map-pin', map), { yPercent: -260, autoAlpha: 0, duration: 1, ease: 'bounce.out' }, 0.8);
  }
  gsap.from($$('.channel', section), {
    y: 30,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.07,
    ease: 'expo.out',
    scrollTrigger: { trigger: $('.channels', section), start: 'top 92%' },
  });
}

/* ── Pie: el logotipo sube letra a letra con el scroll ── */
export function footerScene(): void {
  const word = $('[data-footer-word]');
  if (!word) return;
  const split = SplitText.create(word.children, { type: 'chars', aria: 'none' });
  gsap.from(split.chars, {
    yPercent: 105,
    ease: 'none',
    stagger: 0.06,
    scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
  });
}

/* ── Progreso de lectura: el anillo del botón de menú ── */
export function navProgress(): void {
  const dial = $('[data-nav-progress]');
  if (!dial) return;
  gsap.fromTo(dial, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

/** Con reduced-motion: solo fundidos suaves de las fotos principales, sin desplazamientos. */
export function reducedScene(): () => void {
  $$('[data-portrait], [data-detail], [data-map-window], .score, [data-weekly]').forEach((el) => {
    gsap.from(el, { opacity: 0, duration: 1, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  return bookingScene(false, false);
}

export { ScrollTrigger };
