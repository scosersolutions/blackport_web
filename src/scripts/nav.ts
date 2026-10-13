/**
 * Navegación flotante y menú.
 * - Escena actual: el menú marca su enlace (aria-current) y la cápsula muestra su nombre.
 * - Menú: <dialog> modal (foco atrapado y Escape nativos). Con movimiento, una cortina
 *   de lava cae con sus gotas, la obsidiana la sigue y los enlaces suben escalonados;
 *   al cerrar, todo se recoge hacia arriba. Con reduced-motion, fundido simple.
 * - Escritorio: cada enlace muestra su foto al pasar por encima o recibir el foco.
 */
import { gsap } from 'gsap';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

/** Cortina: borde inferior a la altura `y` (0–100) con gotas que crecen a mitad de recorrido. */
const DRIPS = [
  { x: 9, w: 2.4, l: 9 },
  { x: 24, w: 3.2, l: 16 },
  { x: 41, w: 2, l: 6 },
  { x: 58, w: 3.6, l: 20 },
  { x: 74, w: 2.2, l: 8 },
  { x: 90, w: 3, l: 13 },
];
function curtain(p: number): string {
  const y = -24 + p * 132;
  const grow = Math.sin(Math.min(1, p) * Math.PI);
  let d = `M0 -1L100 -1L100 ${y.toFixed(2)}`;
  for (let i = DRIPS.length - 1; i >= 0; i--) {
    const { x, w, l } = DRIPS[i];
    const len = l * grow + 0.01;
    const tip = y + len;
    d +=
      `L${(x + w).toFixed(2)} ${y.toFixed(2)}` +
      `C${(x + w * 0.4).toFixed(2)} ${y.toFixed(2)} ${(x + w * 0.45).toFixed(2)} ${tip.toFixed(2)} ${x.toFixed(2)} ${tip.toFixed(2)}` +
      `C${(x - w * 0.45).toFixed(2)} ${tip.toFixed(2)} ${(x - w * 0.4).toFixed(2)} ${y.toFixed(2)} ${(x - w).toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}L0 ${y.toFixed(2)}Z`;
}

export function setupNav(): void {
  const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const where = document.querySelector<HTMLElement>('[data-nav-where]');
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-spy]'));

  // ── Escena actual ──
  const labels = new Map(links.map((a) => [a.hash.slice(1), a.querySelector('.menu-label')?.textContent?.trim() ?? '']));
  let current = '';
  const setCurrent = (id: string): void => {
    if (id === current) return;
    current = id;
    links.forEach((a) => (a.hash.slice(1) === id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
    if (!where) return;
    const text = labels.get(id) || 'Inicio';
    if (reduce.matches) {
      where.textContent = text;
      return;
    }
    gsap.to(where, {
      yPercent: -110,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        where.textContent = text;
        gsap.fromTo(where, { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: 'expo.out' });
      },
    });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id === 'inicio' ? '' : e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ['inicio', ...labels.keys()].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  if (!menu || !openBtn) return;

  // ── Menú ──
  const lava = menu.querySelector<SVGPathElement>('[data-mc="lava"]');
  const rock = menu.querySelector<SVGPathElement>('[data-mc="rock"]');
  const items = Array.from(menu.querySelectorAll<HTMLElement>('.menu-item, .menu-foot, .menu-top'));
  const curtainState = { lava: 0, rock: 0 };
  const paint = (): void => {
    lava?.setAttribute('d', curtain(curtainState.lava));
    rock?.setAttribute('d', curtain(curtainState.rock));
  };
  let tl: gsap.core.Timeline | null = null;

  const open = (): void => {
    menu.showModal();
    if (reduce.matches) {
      menu.classList.remove('is-animated');
      return;
    }
    menu.classList.add('is-animated');
    tl?.kill();
    curtainState.lava = 0;
    curtainState.rock = 0;
    paint();
    tl = gsap
      .timeline()
      .to(curtainState, { lava: 1, duration: 0.9, ease: 'expo.inOut', onUpdate: paint }, 0)
      .to(curtainState, { rock: 1, duration: 0.95, ease: 'expo.inOut', onUpdate: paint }, 0.14)
      .fromTo(items, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0.5);
  };

  const close = (then?: () => void): void => {
    if (!menu.open) return;
    if (reduce.matches || !menu.classList.contains('is-animated')) {
      menu.close();
      then?.();
      return;
    }
    tl?.kill();
    tl = gsap
      .timeline({
        onComplete: () => {
          menu.close();
          then?.();
        },
      })
      .to(items, { y: -30, autoAlpha: 0, duration: 0.3, stagger: 0.02, ease: 'power2.in' }, 0)
      .to(curtainState, { rock: 0, duration: 0.6, ease: 'expo.inOut', onUpdate: paint }, 0.1)
      .to(curtainState, { lava: 0, duration: 0.6, ease: 'expo.inOut', onUpdate: paint }, 0.2);
  };

  openBtn.addEventListener('click', open);
  menu.querySelector('[data-menu-close]')?.addEventListener('click', () => close());
  // Escape: se intercepta para cerrar con la misma coreografía.
  menu.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  menu.addEventListener('close', () => {
    gsap.set(items, { clearProps: 'all' });
    openBtn.focus({ preventScroll: true });
  });
  // Enlaces: cerrar y luego desplazarse (el diálogo modal bloquea el scroll mientras está abierto).
  menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(a.hash);
      close(() => {
        target?.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
        history.replaceState(null, '', a.hash);
      });
    });
  });

  // ── Foto de cada enlace (escritorio) ──
  const preview = menu.querySelector<HTMLElement>('.menu-preview');
  const img = menu.querySelector<HTMLImageElement>('[data-menu-preview]');
  if (preview && img) {
    const show = (a: HTMLAnchorElement): void => {
      if (!fine.matches || !a.dataset.preview) return;
      if (img.getAttribute('src') !== a.dataset.preview) {
        preview.classList.remove('is-on');
        // Reinicia el revelado con la nueva foto.
        void preview.offsetWidth;
        img.src = a.dataset.preview;
        img.style.objectPosition = a.dataset.focus ?? '';
      }
      preview.classList.add('is-on');
    };
    menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach((a) => {
      a.addEventListener('pointerenter', () => show(a));
      a.addEventListener('focus', () => show(a));
    });
    menu.querySelector('.menu-nav')?.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
  }
}
