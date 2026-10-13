/**
 * Escenas ligadas al scroll. Concepto «corte y lava»: cortes diagonales y máscaras
 * afiladas para la tipografía y la foto; el rojo se derrama y conecta las secciones.
 * Se crean dentro de gsap.matchMedia (index.ts), que las revierte al cambiar de contexto.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(sel));

/* ── Hero: la foto invade la pantalla, el titular se parte y cruza un corte rojo ── */
export function heroScene(desktop: boolean): void {
  const hero = $('[data-scene="hero"]');
  if (!hero) return;
  const main = $('.hero-main', hero);
  const inner = $('.hero-main-inner', hero);
  const dim = $('.hero-main-dim', hero);
  const lines = $$('.hero-title > .line-mask', hero);
  const foot = $('.hero-foot', hero);
  const detail = $('.hero-detail', hero);
  const word = $('.hero-word', hero);
  const cut = $('.hero-cut', hero);
  const eyebrow = $('.hero-eyebrow', hero);

  if (desktop) {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=85%', scrub: 0.7, pin: true, anticipatePin: 1 },
    });
    tl.to(main, { width: '100vw', right: 0 }, 0)
      .to(inner, { scale: 1.14, yPercent: 4 }, 0)
      .to(dim, { opacity: 0.62 }, 0)
      .to(lines[0], { xPercent: -14 }, 0)
      .to(lines[1], { xPercent: 16 }, 0)
      .to(lines[2], { xPercent: -6, scale: 1.08, transformOrigin: '0% 50%' }, 0)
      .to([foot, eyebrow], { y: -60, autoAlpha: 0, stagger: 0.04 }, 0)
      .to(detail, { yPercent: -150, rotate: -7, autoAlpha: 0 }, 0)
      .to(word, { xPercent: -22 }, 0)
      .fromTo(cut, { scaleX: 0 }, { scaleX: 1, ease: 'power2.in' }, 0.45)
      .to(cut, { yPercent: 900, opacity: 0, ease: 'power1.in' }, 0.85);
  } else {
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    })
      .to(inner, { yPercent: 12, scale: 1.12 }, 0)
      .to(lines[0], { xPercent: -10 }, 0)
      .to(lines[1], { xPercent: 10 }, 0)
      .to(word, { xPercent: -30 }, 0);
  }
}

/* ── Sobre: pastillas que se abren, pincelada roja, retrato que se descubre en diagonal ── */
export function aboutScene(desktop: boolean): void {
  const about = $('[data-scene="about"]');
  if (!about) return;

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

  const brush = $$('.brush path', about);
  if (brush.length) {
    gsap.fromTo(
      brush,
      { drawSVG: '0%' },
      { drawSVG: '100%', ease: 'none', stagger: 0.25, scrollTrigger: { trigger: '.about-last', start: 'top 85%', end: 'top 45%', scrub: 0.8 } },
    );
  }

  const frame = $('[data-portrait]', about);
  if (frame) {
    gsap
      .timeline({ scrollTrigger: { trigger: frame, start: 'top 92%', end: 'center 50%', scrub: 0.8 } })
      .fromTo(
        frame,
        { clipPath: 'polygon(0% 38%, 100% 18%, 100% 62%, 0% 82%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none' },
        0,
      )
      .fromTo($('.media', frame), { scale: 1.35 }, { scale: 1, ease: 'none' }, 0);
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
    scrollTrigger: { trigger: '.about-values', start: 'top 85%' },
  });
}

/* ── Servicios: filas que se cortan al entrar, guiones que se dibujan, foto con zoom lento ── */
export function servicesScene(): void {
  const section = $('[data-scene="services"]');
  if (!section) return;

  $$('[data-svc-group]', section).forEach((group) => {
    const head = $('[data-svc-head]', group);
    const rows = $$('[data-svc-row]', group);
    const tl = gsap.timeline({ scrollTrigger: { trigger: group, start: 'top 80%' } });
    if (head) tl.from(head, { clipPath: 'inset(0 100% 0 0)', duration: 0.9, ease: 'expo.inOut' }, 0);
    tl.from(rows, { yPercent: 40, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 0.15).from(
      $$('.svc-lead', group),
      { scaleX: 0, transformOrigin: '0% 50%', duration: 1, stagger: 0.08, ease: 'expo.inOut' },
      0.3,
    );
  });

  const frame = $('.sv-frame', section);
  if (frame) {
    gsap.fromTo(frame, { scale: 0.92 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: true } });
  }
}

/* ── Reserva: la sección se abre como una inundación roja ── */
export function bookingScene(desktop: boolean): void {
  const section = $('[data-scene="booking"]');
  if (!section) return;

  gsap.fromTo(
    section,
    { clipPath: 'inset(10% 7% 0% 7% round 28px)' },
    {
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 25%', scrub: true },
    },
  );

  // Los goteos se alargan mientras la sección entra.
  gsap.fromTo(
    $$('.booking-pour .drip', section),
    { scaleY: 0.05 },
    { scaleY: 1, ease: 'none', stagger: 0.03, scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 10%', scrub: 0.6 } },
  );

  const photo = $('.booking-photo', section);
  if (photo) {
    gsap.fromTo($('.media', photo), { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to($$('.booking-blinds i', photo), {
      scaleY: 0,
      duration: 1.1,
      stagger: { each: 0.08, from: desktop ? 'start' : 'center' },
      ease: 'expo.inOut',
      scrollTrigger: { trigger: section, start: 'top 55%' },
    });
  }

  const ring = $('.orb-ring', section);
  if (ring) {
    gsap.to(ring, { rotate: 360, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  }
  const orb = $('.orb', section);
  if (orb) {
    gsap.from(orb, { scale: 0, rotate: -90, duration: 1.4, ease: 'elastic.out(1, 0.6)', scrollTrigger: { trigger: orb, start: 'top 85%' } });
  }

  gsap.from($$('.bh-row', section), {
    xPercent: -8,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.06,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.booking-hours', start: 'top 85%' },
  });
}

/* ── Reseñas: la nota crece sobre una mancha roja que se expande ── */
export function reviewsScene(): void {
  const section = $('[data-scene="reviews"]');
  if (!section) return;
  const score = $('.score', section);
  if (score) {
    gsap
      .timeline({ scrollTrigger: { trigger: score, start: 'top 90%', end: 'center 45%', scrub: 0.8 } })
      .fromTo($('.score-blob', score), { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, ease: 'none' }, 0)
      .fromTo($('.score-num', score), { scale: 0.55, yPercent: 30 }, { scale: 1, yPercent: 0, ease: 'none' }, 0);
  }
  gsap.from($$('.source', section), {
    clipPath: 'inset(0 100% 0 0)',
    duration: 1,
    stagger: 0.12,
    ease: 'expo.inOut',
    scrollTrigger: { trigger: '.sources', start: 'top 88%' },
  });
}

/* ── Visítanos: el relieve se dibuja y el marcador cae ── */
export function visitScene(): void {
  const section = $('[data-scene="visit"]');
  if (!section) return;
  const relief = $('.relief', section);
  if (relief) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: relief, start: 'top 80%' } });
    tl.from($$('.contour', relief).reverse(), { drawSVG: '50% 50%', duration: 1.6, stagger: 0.05, ease: 'expo.inOut' }, 0)
      .from($('[data-pin]', relief), { yPercent: -260, autoAlpha: 0, duration: 1, ease: 'bounce.out' }, 0.7)
      .from($$('.relief-label, .relief-coords, .relief-open', relief), { autoAlpha: 0, y: 14, stagger: 0.1, duration: 0.6 }, 1.3);
  }
  gsap.from($$('.visit-address > span', section), {
    yPercent: 100,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.visit-address', start: 'top 88%' },
  });
  gsap.from($$('.channel', section), {
    y: 30,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.07,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.channels', start: 'top 92%' },
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

/* ── Barra de progreso de lectura en la navegación ── */
export function navProgress(): void {
  const bar = $('[data-nav-progress]');
  if (!bar) return;
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

/** Con reduced-motion: solo fundidos suaves de las fotos principales, sin desplazamientos. */
export function reducedScene(): void {
  $$('[data-portrait], [data-detail], .sv-frame, .relief, .score').forEach((el) => {
    gsap.from(el, { opacity: 0, duration: 1, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
}

export { ScrollTrigger };
