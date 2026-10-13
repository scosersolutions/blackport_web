/**
 * Apertura y escena del hero.
 *
 * 1. Entrada (≈3 s, saltable con cualquier gesto): el nombre sube desde su máscara,
 *    la grieta se enciende trazándose, se abre y separa BLACK | PORT, y la foto
 *    emerge de la oscuridad con un leve empuje de cámara. Las acciones llegan al final,
 *    pero la reserva está disponible desde el primer instante en la navegación.
 * 2. Scroll: en escritorio la escena se fija y la grieta se abre hasta ocupar la
 *    pantalla (la foto pasa de franja a protagonista y aparece la frase); en móvil,
 *    sin fijar, la grieta solo se ensancha mientras el hero sale.
 *
 * El lienzo de magma y los elementos del DOM leen el mismo estado (magma.state),
 * así los bordes de lava y las mitades del nombre se mueven juntos.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Magma, webglAvailable } from './magma';

/** Mismas proporciones que el CSS de Hero.astro (--open, --rift-y). */
const OPEN = { desktop: 0.19, mobile: 0.13 };
const RIFT_Y_MOBILE = 0.35;

interface HeroEls {
  hero: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement | null;
  photo: HTMLElement | null;
  inner: HTMLElement | null;
  dim: HTMLElement | null;
  halves: HTMLElement[];
  ins: HTMLElement[];
  info: HTMLElement | null;
  introEls: HTMLElement[];
  tagline: HTMLElement | null;
}

const query = (): HeroEls | null => {
  const hero = document.querySelector<HTMLElement>('[data-scene="hero"]');
  const stage = hero?.querySelector<HTMLElement>('[data-hero-stage]');
  if (!hero || !stage) return null;
  const q = <T extends Element = HTMLElement>(s: string): T | null => hero.querySelector<T>(s);
  return {
    hero,
    stage,
    canvas: q<HTMLCanvasElement>('[data-magma]'),
    photo: q('[data-hero-photo]'),
    inner: q('[data-hero-photo-inner]'),
    dim: q('[data-hero-dim]'),
    halves: Array.from(hero.querySelectorAll<HTMLElement>('[data-hm]')),
    ins: Array.from(hero.querySelectorAll<HTMLElement>('[data-hm-in]')),
    info: q('[data-hero-info]'),
    introEls: Array.from(hero.querySelectorAll<HTMLElement>('[data-hero-info] [data-intro-hide]')),
    tagline: q('[data-hero-tagline]'),
  };
};

export function heroScene(desktop: boolean, animate: boolean): () => void {
  const els = query();
  if (!els) return () => {};
  const { hero, stage, canvas, photo, inner, dim, halves, ins, info, introEls, tagline } = els;
  const root = document.documentElement;
  const finishIntro = (): void => root.classList.add('intro-done');

  let magma: Magma | null = null;
  if (canvas && webglAvailable()) {
    try {
      magma = new Magma(canvas, 'rift', animate);
      hero.classList.add('has-magma');
    } catch {
      magma = null;
    }
  }
  // Sin magma: la grieta estática del CSS ya está compuesta. Nada más que hacer.
  if (!magma) {
    finishIntro();
    return () => {};
  }

  const m = magma;
  const s = m.state;
  const open = desktop ? OPEN.desktop : OPEN.mobile;
  s.vertical = desktop;
  s.veins = 0.55;

  /** Lleva el DOM (mitades del nombre) a la apertura actual de la grieta. */
  const apply = (): void => {
    const H = stage.clientHeight;
    // En móvil el eje lo fija el CSS (--rift-y, en svh); la foto está centrada en él.
    s.centerPx = desktop ? stage.clientWidth / 2 : photo?.offsetTop || H * RIFT_Y_MOBILE;
    const px = s.width * H;
    if (desktop) {
      gsap.set(halves[0], { x: -px * 1.15 });
      gsap.set(halves[1], { x: px * 1.15 });
    } else {
      gsap.set(halves[0], { y: -px * 1.1 });
      gsap.set(halves[1], { y: px * 1.1 });
    }
    if (!animate) m.render();
  };
  const onResize = (): void => apply();
  window.addEventListener('resize', onResize);

  const cleanups: Array<() => void> = [
    () => window.removeEventListener('resize', onResize),
    () => m.destroy(),
    () => hero.classList.remove('has-magma'),
  ];

  // ── Reduced-motion: un único fotograma con la grieta abierta. ──
  if (!animate) {
    s.width = open;
    s.draw = 1;
    s.ignite = 1;
    apply();
    finishIntro();
    return () => cleanups.forEach((c) => c());
  }

  // ── Entrada ──
  const playIntro = root.classList.contains('intro-on') && !root.classList.contains('intro-done') && window.scrollY < 40;
  const intro = gsap.timeline({ paused: !playIntro, onComplete: finishIntro });
  if (playIntro) {
    s.width = 0;
    s.draw = 0;
    s.ignite = 0;
    apply();
    intro
      .fromTo(ins, { yPercent: 105, opacity: 1 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12 }, 0.15)
      .to(s, { ignite: 1, duration: 0.5, ease: 'power2.out' }, 0.75)
      .to(s, { draw: 1, duration: 0.8, ease: 'power2.inOut' }, 0.75)
      .to(s, { width: open, duration: 1.5, ease: 'expo.inOut', onUpdate: apply }, 1.35)
      .fromTo(photo, { opacity: 0 }, { opacity: 1, duration: 1.3, ease: 'power2.out' }, 1.6)
      .fromTo(inner, { scale: 1.28 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 1.35)
      .fromTo(introEls, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'expo.out' }, 2.1);
    if (root.classList.contains('intro-repeat')) intro.timeScale(1.7);
    // Cualquier gesto acelera la entrada hasta el final (no se bloquea nada).
    const skip = (): void => {
      intro.timeScale(5);
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => window.removeEventListener(t, skip));
    };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => window.addEventListener(t, skip, { passive: true }));
    // Si ya hay desplazamiento (barra, ancla, teclado), la entrada termina de golpe:
    // si no, su tween de anchura pisaría el de scroll.
    const settle = (): void => {
      if (window.scrollY > 4 && intro.progress() < 1) intro.progress(1);
      if (intro.progress() === 1) window.removeEventListener('scroll', settle);
    };
    window.addEventListener('scroll', settle, { passive: true });
    cleanups.push(() => ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => window.removeEventListener(t, skip)));
    cleanups.push(() => window.removeEventListener('scroll', settle));
  } else {
    s.width = open;
    s.draw = 1;
    s.ignite = 1;
    apply();
    finishIntro();
  }
  cleanups.push(() => intro.kill());

  // ── Scroll ──
  const H = (): number => stage.clientHeight;
  const W = (): number => stage.clientWidth;
  const photoW = (): number => (photo ? photo.offsetWidth : W());
  let scroll: gsap.core.Timeline;
  if (desktop) {
    scroll = gsap.timeline({
      defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=110%',
        pin: stage,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 1,
      },
    });
    scroll
      .fromTo(info, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -50, duration: 0.22 }, 0)
      .fromTo(s, { width: open }, { width: () => (W() / 2) / H() + 0.14, duration: 0.9, ease: 'power2.in', onUpdate: apply }, 0)
      .fromTo(s, { veins: 0.55 }, { veins: 1, duration: 0.6 }, 0)
      .fromTo(inner, { scale: 1 }, { scale: () => Math.max(1.05, W() / photoW()), duration: 0.9, ease: 'power2.in' }, 0)
      .fromTo(dim, { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0.6)
      .fromTo(tagline, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.62)
      .to({}, { duration: 0.15 });
  } else {
    scroll = gsap.timeline({
      defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
    scroll
      .fromTo(s, { width: open }, { width: open * 1.7, onUpdate: apply }, 0)
      .fromTo(inner, { scale: 1 }, { scale: 1.12 }, 0)
      .fromTo(info, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5 }, 0);
  }
  cleanups.push(() => {
    scroll.scrollTrigger?.kill();
    scroll.kill();
  });

  // ── Profundidad con el puntero (escritorio): foto y nombre se mueven en sentidos opuestos. ──
  if (desktop && window.matchMedia('(hover: hover) and (pointer: fine)').matches && photo) {
    const px = gsap.quickTo(photo, 'x', { duration: 1.2, ease: 'power3' });
    const py = gsap.quickTo(photo, 'y', { duration: 1.2, ease: 'power3' });
    const hy = halves.map((h) => gsap.quickTo(h, 'y', { duration: 1.4, ease: 'power3' }));
    const move = (e: PointerEvent): void => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      px(nx * -26);
      py(ny * -18);
      hy.forEach((f, i) => f(ny * (i ? 14 : 10)));
    };
    window.addEventListener('pointermove', move, { passive: true });
    cleanups.push(() => window.removeEventListener('pointermove', move));
  }

  m.kick();
  return () => {
    cleanups.forEach((c) => c());
    gsap.set([...halves, ...ins, photo, inner, dim, info, tagline, ...introEls].filter(Boolean), { clearProps: 'all' });
  };
}

export { ScrollTrigger };
