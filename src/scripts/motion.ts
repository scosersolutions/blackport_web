/**
 * Motion sin dependencias. Todo lo que se mueve con el scroll usa transform/opacity
 * y solo se calcula para los elementos visibles (IntersectionObserver + rAF).
 *
 * - [data-reveal], [data-lava]: revelado al entrar en pantalla (CSS hace el resto).
 * - [data-parallax="0.08"]: desplazamiento vertical proporcional (escritorio).
 * - [data-progress]: expone --p (0→1) mientras el elemento cruza el viewport;
 *   con data-progress="exit", 0 cuando su borde superior está arriba y 1 al salir.
 * - [data-magnetic]: el elemento sigue ligeramente al puntero (solo puntero fino).
 * - [data-status]: estado abierto/cerrado según el horario, en hora de Canarias.
 * - [data-count]: cuenta desde 0 hasta su valor al entrar en pantalla.
 */
import { site } from '@/config/site';
import { valueOf } from '@/lib/pending';
import { nowIn, openStatus } from '@/lib/hours';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const wide = window.matchMedia('(min-width: 900px)');

function setupReveal(): void {
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

/** Parallax y progreso comparten un único bucle de scroll. */
function setupScrollLinked(): void {
  const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  const progress = Array.from(document.querySelectorAll<HTMLElement>('[data-progress]'));
  if (!parallax.length && !progress.length) return;

  // Solo se calculan los elementos cerca del viewport.
  const active = new Set<HTMLElement>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) active.add(el);
        else active.delete(el);
      }
      schedule();
    },
    { rootMargin: '25% 0px 25% 0px' },
  );
  [...parallax, ...progress].forEach((el) => io.observe(el));

  let queued = false;
  const update = (): void => {
    queued = false;
    const vh = window.innerHeight;
    const still = reduce.matches;
    for (const el of active) {
      const rect = el.getBoundingClientRect();
      if (el.dataset.progress !== undefined) {
        const p =
          el.dataset.progress === 'exit'
            ? -rect.top / Math.max(rect.height, 1)
            : (vh - rect.top) / (vh + rect.height);
        if (still) el.style.removeProperty('--p');
        else el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
      }
      if (el.dataset.parallax !== undefined) {
        if (still || !wide.matches) {
          el.style.transform = '';
          continue;
        }
        const speed = Number(el.dataset.parallax) || 0.08;
        const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
    }
  };
  const schedule = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  reduce.addEventListener('change', schedule);
}

function setupMagnetic(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  items.forEach((el) => {
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

function setupStatus(): void {
  const hours = valueOf(site.hours);
  const nodes = document.querySelectorAll<HTMLElement>('[data-status]');
  if (!hours || !nodes.length) return;
  const render = (): void => {
    const status = openStatus(hours, nowIn(site.timeZone));
    nodes.forEach((n) => {
      n.classList.toggle('is-open', status.open);
      const label = n.querySelector('[data-status-label]');
      if (label) label.textContent = status.label;
      n.hidden = false;
    });
    // Marca la fila del día actual en las tablas de horario.
    const today = String(nowIn(site.timeZone).day);
    document.querySelectorAll<HTMLElement>('[data-day]').forEach((row) => {
      row.classList.toggle('is-today', row.dataset.day === today);
    });
  };
  render();
  window.setInterval(render, 60_000);
}

function setupCount(): void {
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
      const eased = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt.format(target * eased);
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

setupReveal();
setupScrollLinked();
setupMagnetic();
setupStatus();
setupCount();
