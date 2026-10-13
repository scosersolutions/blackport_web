/**
 * Comportamientos base, independientes de GSAP (funcionan también con reduced-motion):
 * - [data-reveal], [data-lava]: revelado CSS al entrar en pantalla.
 * - [data-magnetic]: el elemento sigue ligeramente al puntero (solo puntero fino).
 * - [data-status]: estado abierto/cerrado según el horario, en hora de Canarias.
 * - [data-count]: cuenta desde 0 hasta su valor al entrar en pantalla.
 */
import { site } from '@/config/site';
import { valueOf } from '@/lib/pending';
import { nowIn, openStatus } from '@/lib/hours';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

export function setupReveal(): void {
  const targets = document.querySelectorAll('[data-reveal], [data-lava]');
  if (reduce.matches || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
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
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );
  targets.forEach((el) => io.observe(el));
}

export function setupMagnetic(): void {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.25;
    el.addEventListener('pointermove', (e) => {
      if (!finePointer.matches || reduce.matches) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

export function setupStatus(): void {
  const hours = valueOf(site.hours);
  const nodes = document.querySelectorAll<HTMLElement>('[data-status]');
  if (!hours || !nodes.length) return;
  const render = (): void => {
    const now = nowIn(site.timeZone);
    const status = openStatus(hours, now);
    nodes.forEach((n) => {
      n.classList.toggle('is-open', status.open);
      const label = n.querySelector('[data-status-label]');
      if (label) label.textContent = status.label;
      n.hidden = false;
    });
    // Marca la fila del día actual en las tablas de horario.
    document.querySelectorAll<HTMLElement>('[data-day]').forEach((row) => {
      row.classList.toggle('is-today', row.dataset.day === String(now.day));
    });
  };
  render();
  window.setInterval(render, 60_000);
}

export function setupCount(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!items.length || reduce.matches) return;
  const formatter = (el: HTMLElement): Intl.NumberFormat => {
    const decimals = Number(el.dataset.decimals ?? 0);
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };
  // El HTML trae el valor final (sin JS o para lectores); aquí se parte de 0.
  items.forEach((el) => (el.textContent = formatter(el).format(0)));
  const run = (el: HTMLElement): void => {
    const target = Number(el.dataset.count);
    const fmt = formatter(el);
    const start = performance.now();
    const dur = 1600;
    const tick = (t: number): void => {
      const k = Math.min(1, (t - start) / dur);
      el.textContent = fmt.format(target * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        run(e.target as HTMLElement);
        io.unobserve(e.target);
      }
    },
    { threshold: 0.6 },
  );
  items.forEach((el) => io.observe(el));
}
