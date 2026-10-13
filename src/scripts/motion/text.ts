/**
 * Tipografía en movimiento. Cada titular declara su efecto con data-split:
 * - chars: letras que entran desde su máscara de línea con un giro (cuchilla).
 * - words: palabras que suben escalonadas.
 * - slide: cada línea entra desde un lado distinto, ligada al scroll.
 * - fill:  texto que se «enciende» palabra a palabra al leerlo (scrub).
 * Los titulares ya traen sus líneas en `.line-mask` (que hacen de máscara).
 */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

const lineTargets = (el: HTMLElement): HTMLElement[] => {
  const lines = Array.from(el.querySelectorAll<HTMLElement>(':scope > .line-mask > span'));
  return lines.length ? lines : [el];
};

export function splitChars(el: HTMLElement): void {
  const split = SplitText.create(lineTargets(el), { type: 'chars', aria: 'none' });
  gsap.from(split.chars, {
    yPercent: 115,
    rotate: 9,
    transformOrigin: '0% 100%',
    duration: 1.05,
    ease: 'expo.out',
    stagger: 0.022,
    scrollTrigger: { trigger: el, start: 'top 86%' },
  });
}

export function splitWords(el: HTMLElement): void {
  const split = SplitText.create(lineTargets(el), { type: 'words', aria: 'none' });
  gsap.from(split.words, {
    yPercent: 120,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.07,
    scrollTrigger: { trigger: el, start: 'top 86%' },
  });
}

export function slideLines(el: HTMLElement): void {
  lineTargets(el).forEach((line, i) => {
    gsap.from(line, {
      xPercent: i % 2 ? 22 : -22,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
    });
  });
}

export function fillWords(el: HTMLElement): void {
  const split = SplitText.create(el, { type: 'words', aria: 'none' });
  gsap.fromTo(
    split.words,
    { opacity: 0.16 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true },
    },
  );
}

const FX: Record<string, (el: HTMLElement) => void> = {
  chars: splitChars,
  words: splitWords,
  slide: slideLines,
  fill: fillWords,
};

export function setupText(): void {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    // Lectores de pantalla: el texto original queda como etiqueta del bloque.
    if (!el.hasAttribute('aria-label') && el.dataset.split !== 'fill' && el.dataset.split !== 'slide') {
      el.setAttribute('aria-label', el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    }
    FX[el.dataset.split ?? '']?.(el);
  });
}

/** Con reduced-motion: solo fundidos, sin desplazamientos. */
export function setupTextReduced(): void {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    gsap.from(el, { opacity: 0, duration: 0.9, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}
