/** Coreografía de la entrada «corte» (ver components/Intro.astro). */
import { gsap } from 'gsap';

export function playIntro(): void {
  const root = document.documentElement;
  const intro = document.querySelector<HTMLElement>('[data-intro]');
  if (!intro || !root.classList.contains('intro-on') || root.classList.contains('intro-done')) return;

  const top = intro.querySelector<HTMLElement>('[data-intro-top]')!;
  const bot = intro.querySelector<HTMLElement>('[data-intro-bot]')!;
  const blade = intro.querySelector<HTMLElement>('[data-intro-blade]')!;
  const logos = intro.querySelectorAll<HTMLElement>('.intro-logo');

  // Ángulo real de la diagonal (0, 60 %) → (100 %, 40 %) para este viewport.
  const angle = (Math.atan2(-0.2 * window.innerHeight, window.innerWidth) * 180) / Math.PI;
  blade.style.setProperty('--blade-angle', `${angle.toFixed(2)}deg`);

  const go = (): void => root.classList.add('intro-go');
  const done = (): void => {
    root.classList.add('intro-go', 'intro-done');
    window.removeEventListener('keydown', skip);
    window.removeEventListener('pointerdown', skip);
    window.removeEventListener('wheel', skip);
    window.removeEventListener('touchstart', skip);
  };

  const tl = gsap.timeline({ onComplete: done, defaults: { ease: 'expo.inOut' } });
  tl.from(logos, { opacity: 0, scale: 0.9, filter: 'blur(8px)', duration: 0.7, ease: 'expo.out' })
    .to(blade, { clipPath: 'inset(0 0% 0 0)', duration: 0.5 }, 0.45)
    .add(go, 0.9)
    // Las mitades se separan en perpendicular al corte, cada una con su trozo de logo.
    .to(top, { xPercent: -6, yPercent: -78, duration: 1.05 }, 0.9)
    .to(bot, { xPercent: 6, yPercent: 78, duration: 1.05 }, 0.9)
    .to(blade, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 1.05);

  // Saltable: cualquier interacción la completa al instante.
  function skip(): void {
    tl.progress(1);
  }
  window.addEventListener('keydown', skip, { once: true });
  window.addEventListener('pointerdown', skip, { once: true });
  window.addEventListener('wheel', skip, { once: true, passive: true });
  window.addEventListener('touchstart', skip, { once: true, passive: true });
}
