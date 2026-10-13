/**
 * Lava viva (runtime de components/lava/LavaFlow.astro).
 *
 * Cada gota combina tres comportamientos, sin bucles idénticos:
 * - respiración: se alarga y recoge muy despacio, con periodo y fase propios (viscosidad);
 * - avance: se estira a medida que el borde sube por la pantalla y se recoge al volver;
 * - inercia: un muelle por gota reacciona a la velocidad del scroll; las gotas largas,
 *   más pesadas, responden tarde y oscilan menos.
 * Con puntero fino, las gotas cercanas al cursor se hinchan levemente.
 *
 * Solo se dibuja mientras el borde está en pantalla. Con reduced-motion se ajusta
 * al ancho real una sola vez y queda quieto.
 */
import { makeDrips, flowPath, glossPath, type FlowSpec, type Drip } from '@/lib/lavaflow';

const STRETCH = 0.35; // alargamiento máximo extra por avance/inercia (fracción de la longitud)

interface Flow {
  svg: SVGSVGElement;
  body: SVGPathElement;
  gloss: SVGPathElement | null;
  spec: FlowSpec;
  drips: Drip[];
  width: number;
  height: number;
  visible: boolean;
  spring: Array<{ x: number; v: number }>;
  swell: number[];
}

const flows: Flow[] = [];
let raf = 0;
let lastT = 0;
let lastY = window.scrollY;
let vel = 0;
const pointer = { x: -1e4, y: -1e4 };

const measure = (f: Flow): void => {
  const w = Math.round(f.svg.getBoundingClientRect().width);
  if (!w || w === f.width) return;
  f.width = w;
  f.svg.setAttribute('viewBox', `0 0 ${w} ${f.height}`);
  // En pantallas estrechas, menos gotas y más finas: misma densidad visual.
  const scale = Math.min(1, Math.max(0.55, w / 1200));
  const count = Math.max(4, Math.round(f.spec.count * Math.min(1, w / 1100)));
  f.drips = makeDrips({ ...f.spec, count, maxLen: f.spec.maxLen * scale, minW: f.spec.minW * scale, maxW: f.spec.maxW * scale });
  f.spring = f.drips.map(() => ({ x: 0, v: 0 }));
  f.swell = f.drips.map(() => 1);
};

const draw = (f: Flow, t: number, dt: number, still = false): void => {
  const rect = f.svg.getBoundingClientRect();
  const vh = window.innerHeight;
  // 0 cuando el borde asoma por abajo, 1 cuando ha subido ~80 % de la pantalla.
  const progress = still ? 1 : Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.8)));
  const near = !still && pointer.y > rect.top - 40 && pointer.y < rect.bottom + 40;

  const lens = f.drips.map((d, i) => {
    const breath = still ? 0.5 : 0.5 + 0.5 * Math.sin((t / d.period) * Math.PI * 2 + d.phase);
    const s = f.spring[i];
    if (!still) {
      // Muelle amortiguado: objetivo proporcional a la velocidad de bajada.
      const target = Math.max(-0.15, Math.min(1, vel / 2600)) / d.mass;
      const a = (target - s.x) * 38 - s.v * (9 + 4 * d.mass);
      s.v += a * dt;
      s.x += s.v * dt;
      const dx = Math.abs(rect.left + d.x * f.width - pointer.x);
      const want = near && dx < 110 ? 1 + 0.22 * (1 - dx / 110) : 1;
      f.swell[i] += (want - f.swell[i]) * Math.min(1, dt * 5);
    }
    const advance = 0.42 + 0.58 * progress;
    return d.len * (0.82 + 0.18 * breath) * advance * (1 + STRETCH * s.x) * (0.9 + 0.1 * f.swell[i]);
  });

  f.body.setAttribute('d', flowPath(f.spec, f.drips, f.width, lens, f.swell, still ? 0 : t));
  f.gloss?.setAttribute('d', glossPath(f.spec, f.drips, f.width, lens, still ? 0 : t));
};

const loop = (now: number): void => {
  raf = 0;
  const t = now / 1000;
  const dt = Math.min(0.05, lastT ? t - lastT : 0.016);
  lastT = t;
  const y = window.scrollY;
  const instant = dt > 0 ? (y - lastY) / dt : 0;
  lastY = y;
  vel += (instant - vel) * Math.min(1, dt * 8);
  let any = false;
  for (const f of flows) {
    if (!f.visible) continue;
    any = true;
    draw(f, t, dt);
  }
  if (any) raf = requestAnimationFrame(loop);
};

const wake = (): void => {
  if (!raf) {
    lastT = 0;
    lastY = window.scrollY;
    raf = requestAnimationFrame(loop);
  }
};

export function setupLavaFlow(animate: boolean): () => void {
  const svgs = Array.from(document.querySelectorAll<SVGSVGElement>('[data-lavaflow]'));
  if (!svgs.length) return () => {};
  for (const svg of svgs) {
    const body = svg.querySelector<SVGPathElement>('[data-lf-body]');
    if (!body) continue;
    const spec = JSON.parse(svg.dataset.lavaflow ?? '{}') as FlowSpec;
    const height = Number(svg.viewBox.baseVal.height) || 200;
    flows.push({ svg, body, gloss: svg.querySelector('[data-lf-gloss]'), spec, drips: [], width: 0, height, visible: false, spring: [], swell: [] });
  }

  const relayout = (): void => {
    for (const f of flows) {
      measure(f);
      if (!animate) draw(f, 0, 0, true);
    }
  };
  relayout();
  const ro = new ResizeObserver(relayout);
  flows.forEach((f) => ro.observe(f.svg));
  if (!animate) return () => ro.disconnect();

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const f = flows.find((x) => x.svg === e.target);
        if (f) f.visible = e.isIntersecting;
      }
      wake();
    },
    { rootMargin: '120px 0px' },
  );
  flows.forEach((f) => io.observe(f.svg));
  const onMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', wake, { passive: true });

  return () => {
    io.disconnect();
    ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('scroll', wake);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    flows.length = 0;
  };
}
