/**
 * Geometría de «rojo líquido» generada en build a partir de una semilla.
 * Cada instancia produce una silueta distinta (goteos, bordes derretidos,
 * trazos diagonales, salpicaduras) sin repetir un único SVG.
 * Todo se calcula en el servidor: el cliente recibe SVG estático.
 */
export type Rng = () => number;

/** mulberry32: PRNG determinista y suficiente para formas. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number): string => (Math.round(n * 10) / 10).toString();
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export interface Highlight {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface DripShape {
  d: string;
  highlight: Highlight;
  /** Retardo de la animación de revelado, en segundos. */
  delay: number;
  length: number;
  /** Coordenada y del extremo inferior del bulbo. */
  bottom: number;
}

/**
 * Una gota colgante: hombros que se funden con la superficie, cuello
 * estrecho y bulbo redondeado al final.
 */
export function drip(cx: number, top: number, width: number, length: number, r: Rng): DripShape {
  const bulb = width / 2;
  const len = Math.max(length, bulb * 3.2);
  const neck = bulb * (0.5 + r() * 0.2);
  const shoulder = bulb * (1.5 + r() * 0.9);
  const lean = (r() - 0.5) * bulb * 0.5;
  const bottom = top + len;
  const bc = cx + lean;

  const d = [
    `M${f(cx - shoulder)} ${f(top)}`,
    `C${f(cx - neck * 1.1)} ${f(top)} ${f(cx - neck)} ${f(top + len * 0.22)} ${f(lerp(cx, bc, 0.5) - neck * 0.92)} ${f(top + len * 0.55)}`,
    `C${f(bc - neck * 0.85)} ${f(bottom - bulb * 1.7)} ${f(bc - bulb)} ${f(bottom - bulb * 1.35)} ${f(bc - bulb)} ${f(bottom - bulb)}`,
    `A${f(bulb)} ${f(bulb)} 0 0 0 ${f(bc + bulb)} ${f(bottom - bulb)}`,
    `C${f(bc + bulb)} ${f(bottom - bulb * 1.35)} ${f(bc + neck * 0.85)} ${f(bottom - bulb * 1.7)} ${f(lerp(cx, bc, 0.5) + neck * 0.92)} ${f(top + len * 0.55)}`,
    `C${f(cx + neck)} ${f(top + len * 0.22)} ${f(cx + neck * 1.1)} ${f(top)} ${f(cx + shoulder)} ${f(top)}`,
    'Z',
  ].join(' ');

  return {
    d,
    highlight: { cx: bc - bulb * 0.38, cy: bottom - bulb * 1.15, rx: bulb * 0.16, ry: bulb * 0.38 },
    delay: r() * 0.7,
    length: len,
    bottom,
  };
}

/** Curva suave que pasa por los puntos medios (contorno orgánico). */
function smooth(points: Array<[number, number]>): string {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  const [lx, ly] = points[points.length - 1];
  return `${d} L${f(lx)} ${f(ly)}`;
}

export interface EdgeOptions {
  seed: number;
  width?: number;
  /** Altura media de la franja superior. */
  base?: number;
  /** Irregularidad del borde. */
  amp?: number;
  drips?: number;
  minLen?: number;
  maxLen?: number;
  minW?: number;
  maxW?: number;
  /** Zona sin goteos en los extremos (0–0.5). */
  margin?: number;
  /** Concentra los goteos en un tramo [inicio, fin] (0–1). */
  span?: [number, number];
  /** Goteos colocados a mano (t = posición 0–1), p. ej. bajo los astiles de una letra. */
  fixed?: Array<{ t: number; len: number; w: number }>;
}

export interface EdgeShape {
  width: number;
  height: number;
  band: string;
  drips: DripShape[];
}

/** Franja derretida que cuelga desde arriba con goteos de longitud variable. */
export function meltedEdge(o: EdgeOptions): EdgeShape {
  const r = rng(o.seed);
  const width = o.width ?? 1440;
  const base = o.base ?? 28;
  const amp = o.amp ?? 10;
  const count = o.drips ?? 7;
  const minLen = o.minLen ?? 24;
  const maxLen = o.maxLen ?? 160;
  const minW = o.minW ?? 10;
  const maxW = o.maxW ?? 30;
  const [s0, s1] = o.span ?? [o.margin ?? 0.04, 1 - (o.margin ?? 0.04)];

  const segments = Math.max(8, Math.round(width / 90));
  const phase = r() * Math.PI * 2;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const wave = Math.sin(phase + i * 0.9) * 0.5 + Math.sin(phase * 1.7 + i * 2.3) * 0.3;
    pts.push([x, base + (wave + (r() - 0.5) * 0.6) * amp]);
  }
  const yAt = (x: number): number => {
    const t = (x / width) * segments;
    const i = Math.min(segments - 1, Math.floor(t));
    return lerp(pts[i][1], pts[i + 1][1], t - i);
  };

  const reversed = [...pts].reverse();
  const band = `M0 0 L${width} 0 L${f(reversed[0][0])} ${f(reversed[0][1])}${smooth(reversed)} Z`;

  const drips: DripShape[] = [];
  for (const fx of o.fixed ?? []) {
    const x = fx.t * width;
    drips.push(drip(x, yAt(x) - 4, fx.w, fx.len, r));
  }
  for (let i = 0; i < (o.fixed ? 0 : count); i++) {
    const t = lerp(s0, s1, (i + 0.15 + r() * 0.7) / count);
    const x = t * width;
    const len = minLen + (maxLen - minLen) * Math.pow(r(), 1.9);
    const w = minW + (maxW - minW) * (0.35 * r() + 0.65 * ((len - minLen) / (maxLen - minLen || 1)));
    drips.push(drip(x, yAt(x) - 4, w, len, r));
  }

  const height = Math.ceil(Math.max(base + amp, ...drips.map((d) => d.bottom)) + 8);
  return { width, height, band, drips };
}

export interface SlashOptions {
  seed: number;
  width?: number;
  height?: number;
  thickness?: number;
  drips?: number;
}

export interface SlashShape {
  width: number;
  height: number;
  stroke: string;
  drips: DripShape[];
  splats: Array<{ cx: number; cy: number; r: number }>;
}

/** Brochazo diagonal de grosor irregular, con goteos desde su borde inferior. */
export function slash(o: SlashOptions): SlashShape {
  const r = rng(o.seed);
  const width = o.width ?? 900;
  const height = o.height ?? 360;
  const thick = o.thickness ?? 34;
  const n = 28;
  const x0 = width * 0.03;
  const y0 = height * 0.62;
  const x1 = width * 0.97;
  const y1 = height * 0.12;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;

  const topPts: Array<[number, number]> = [];
  const botPts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // Arranque cargado de pintura, cola que se deshilacha.
    const profile = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.04)), 0.45) * (1 - t * 0.55);
    const w = thick * Math.max(0.08, profile) * (0.82 + r() * 0.36);
    const cx = lerp(x0, x1, t);
    const cy = lerp(y0, y1, t) + Math.sin(t * 5 + r()) * 3;
    topPts.push([cx - (nx * w) / 2, cy - (ny * w) / 2]);
    botPts.push([cx + (nx * w) / 2, cy + (ny * w) / 2]);
  }
  const stroke = `M${f(topPts[0][0])} ${f(topPts[0][1])}${smooth(topPts)} L${f(botPts[n][0])} ${f(botPts[n][1])}${smooth([...botPts].reverse())} Z`;

  const dripCount = o.drips ?? 3;
  const drips: DripShape[] = [];
  for (let i = 0; i < dripCount; i++) {
    const idx = Math.round(lerp(3, n * 0.7, (i + 0.2 + r() * 0.6) / dripCount));
    const [bx, by] = botPts[idx];
    const w = thick * (0.28 + r() * 0.25);
    drips.push(drip(bx, by - w * 0.6, w, 30 + r() * 110, r));
  }

  const splats: SlashShape['splats'] = [];
  for (let i = 0; i < 9; i++) {
    const t = r();
    const off = (r() - 0.5) * thick * 4.5;
    splats.push({
      cx: lerp(x0, x1, t) + nx * off,
      cy: lerp(y0, y1, t) + ny * off,
      r: 1.2 + Math.pow(r(), 2.5) * 6,
    });
  }
  return { width, height, stroke, drips, splats };
}

export interface Splat {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
}

/** Salpicadura: mancha principal irregular, satélites y gotas alargadas. */
export function splatter(seed: number, size = 240): { size: number; blob: string; dots: Splat[] } {
  const r = rng(seed);
  const c = size / 2;
  const base = size * 0.07;
  const k = 14;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= k; i++) {
    const a = (i % k) / k * Math.PI * 2;
    const rad = base * (0.72 + r() * 0.5) * (i % 3 === 0 ? 1.25 : 1);
    pts.push([c + Math.cos(a) * rad, c + Math.sin(a) * rad]);
  }
  const blob = `M${f((pts[0][0] + pts[1][0]) / 2)} ${f((pts[0][1] + pts[1][1]) / 2)}${smooth([...pts.slice(1), pts[1]])} Z`;

  const dots: Splat[] = [];
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const dist = base * (1.5 + Math.pow(r(), 0.7) * 6);
    const s = Math.max(0.8, size * 0.016 * Math.pow(r(), 1.8) * (1.8 - dist / (base * 8)));
    const stretch = r() > 0.7 ? 2.6 : 1;
    dots.push({
      cx: c + Math.cos(a) * dist,
      cy: c + Math.sin(a) * dist,
      rx: s * stretch,
      ry: s,
      rot: (a * 180) / Math.PI,
    });
  }
  return { size, blob, dots };
}

export interface CrackShape {
  width: number;
  height: number;
  /** Grietas principales (más gruesas, más calientes). */
  veins: string[];
  /** Ramificaciones finas. */
  branches: string[];
  /** Focos de calor para el resplandor. */
  hotspots: Array<{ cx: number; cy: number; rx: number; ry: number; o: number }>;
}

/**
 * Grietas de lava incandescente sobre roca volcánica, para el borde inferior
 * de algunas secciones. El resplandor se construye con trazos superpuestos,
 * sin filtros SVG costosos.
 */
export function lavaCracks(seed: number, width = 1440, height = 220): CrackShape {
  const r = rng(seed);
  const walk = (x: number, y: number, steps: number, dx: number, spread: number): string => {
    let d = `M${f(x)} ${f(y)}`;
    let cx = x;
    let cy = y;
    for (let i = 0; i < steps; i++) {
      cx += dx * (0.6 + r() * 0.8);
      cy += (r() - 0.5) * spread;
      cy = Math.min(height - 6, Math.max(height * 0.3, cy));
      d += ` L${f(cx)} ${f(cy)}`;
    }
    return d;
  };

  const veins: string[] = [];
  const branches: string[] = [];
  const hotspots: CrackShape['hotspots'] = [];
  // Red de grietas cortas y quebradas repartidas por todo el ancho (no líneas continuas).
  const count = 11;
  for (let i = 0; i < count; i++) {
    const x = (i / count) * width + (r() - 0.3) * (width / count);
    const y = height * (0.5 + r() * 0.42);
    const dir = r() > 0.5 ? 1 : -1;
    veins.push(walk(x, y, 7 + Math.round(r() * 9), dir * (16 + r() * 22), 22));
  }
  for (let i = 0; i < 44; i++) {
    const x = r() * width;
    const y = height * (0.45 + r() * 0.5);
    branches.push(walk(x, y, 2 + Math.round(r() * 3), (r() > 0.5 ? 1 : -1) * (8 + r() * 18), 26));
  }
  for (let i = 0; i < 7; i++) {
    hotspots.push({
      cx: r() * width,
      cy: height * (0.6 + r() * 0.35),
      rx: 80 + r() * 220,
      ry: 18 + r() * 36,
      o: 0.18 + r() * 0.3,
    });
  }
  return { width, height, veins, branches, hotspots };
}

/** Curvas de nivel concéntricas e irregulares (relieve volcánico decorativo). */
export function contours(seed: number, size = 600, rings = 11): string[] {
  const r = rng(seed);
  const cx = size * (0.45 + r() * 0.1);
  const cy = size * (0.45 + r() * 0.1);
  const k = 18;
  const noise = Array.from({ length: k }, () => 0.75 + r() * 0.5);
  const out: string[] = [];
  for (let ring = 1; ring <= rings; ring++) {
    const base = (ring / rings) * size * 0.4;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2;
      const wobble = noise[i] * (1 + (r() - 0.5) * 0.06 * ring);
      pts.push([cx + Math.cos(a) * base * wobble, cy + Math.sin(a) * base * wobble * 0.82]);
    }
    // Curva cerrada suave: Q por cada vértice hasta el punto medio del siguiente tramo.
    const mid = (i: number): [number, number] => {
      const [ax, ay] = pts[i % k];
      const [bx, by] = pts[(i + 1) % k];
      return [(ax + bx) / 2, (ay + by) / 2];
    };
    const [sx, sy] = mid(0);
    let d = `M${f(sx)} ${f(sy)}`;
    for (let i = 1; i <= k; i++) {
      const [px, py] = pts[i % k];
      const [mx, my] = mid(i);
      d += ` Q${f(px)} ${f(py)} ${f(mx)} ${f(my)}`;
    }
    out.push(`${d} Z`);
  }
  return out;
}
