/**
 * Geometría de la lava viva: un borde fundido del que cuelgan gotas.
 * Pura y determinista (misma semilla → misma forma): el servidor dibuja la forma
 * en reposo y el navegador la recalcula en cada fotograma con otras longitudes.
 *
 * Forma de cada gota: cuello que se estrecha y bulbo algo más ancho en la punta,
 * como un líquido denso que cede a la gravedad.
 */

export interface Drip {
  /** Posición horizontal, 0–1 del ancho. */
  x: number;
  /** Ancho del cuello en la raíz, en px. */
  w: number;
  /** Longitud en reposo, en px (desde la base). */
  len: number;
  /** Fase y periodo (s) del «respirar» lento de la gota. */
  phase: number;
  period: number;
  /** Inercia: las gotas largas responden más tarde al scroll. */
  mass: number;
}

export interface FlowSpec {
  seed: number;
  /** Número de gotas. */
  count: number;
  /** Grosor medio de la banda fundida, px. */
  base: number;
  /** Ondulación de la banda, px. */
  amp: number;
  minLen: number;
  maxLen: number;
  minW: number;
  maxW: number;
}

/** PRNG pequeño y estable (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Reparte las gotas con separación mínima (sin amontonarlas ni dejar huecos
 * accidentales): se divide el ancho en tramos y cada gota cae dentro del suyo.
 * Las gotas largas son pocas; la mayoría son cortas, como en un borde real.
 */
export function makeDrips(spec: FlowSpec): Drip[] {
  const r = rng(spec.seed);
  const drips: Drip[] = [];
  const slot = 1 / spec.count;
  for (let i = 0; i < spec.count; i++) {
    const x = (i + 0.2 + r() * 0.6) * slot;
    const k = Math.pow(r(), 2.2); // sesgo hacia gotas cortas
    const len = spec.minLen + k * (spec.maxLen - spec.minLen);
    const w = spec.minW + (0.35 + 0.65 * k) * (spec.maxW - spec.minW) * (0.7 + r() * 0.3);
    drips.push({ x, w, len, phase: r() * Math.PI * 2, period: 7 + r() * 9, mass: 0.6 + k * 1.6 });
  }
  return drips;
}

/** Ondulación de la banda: suma de senos con fases de la semilla (sin ruido de alta frecuencia). */
export function baseLine(spec: FlowSpec, x01: number, t = 0): number {
  const s = spec.seed * 0.618;
  return (
    spec.base +
    spec.amp *
      (0.55 * Math.sin(x01 * 6.1 + s + t * 0.12) + 0.3 * Math.sin(x01 * 13.7 + s * 2.3 - t * 0.09) + 0.15 * Math.sin(x01 * 29.3 + s * 4.1))
  );
}

const f = (n: number): string => n.toFixed(1);

/**
 * Trazado SVG del borde con sus gotas.
 * @param width ancho real en px (el viewBox usa px, sin deformación)
 * @param lens longitud actual de cada gota (mismo orden que `drips`)
 * @param swell ensanchamiento actual de cada gota (1 = reposo)
 */
export function flowPath(spec: FlowSpec, drips: Drip[], width: number, lens: number[], swell?: number[], t = 0): string {
  const step = Math.max(18, width / 80);
  const by = (x: number): number => baseLine(spec, x / width, t);
  let d = `M0 0L0 ${f(by(0))}`;
  let x = 0;
  drips.forEach((drip, i) => {
    const cx = drip.x * width;
    const w = drip.w * (swell?.[i] ?? 1);
    const len = Math.max(w * 0.9, lens[i]);
    const x0 = cx - w;
    const x1 = cx + w;
    if (x0 <= x) return; // gota solapada con la anterior (pantallas muy estrechas): se omite
    for (x += step; x < x0; x += step) d += `L${f(x)} ${f(by(x))}`;
    const y0 = by(x0);
    const y1 = by(x1);
    const root = Math.min(y0, y1);
    const tip = root + len;
    const neck = w * 0.3; // medio ancho del cuello
    const bulb = w * 0.44; // radio del bulbo: más ancho que el cuello
    const bulbY = tip - bulb;
    d +=
      `L${f(x0)} ${f(y0)}` +
      // lado izquierdo: del borde al cuello y al bulbo
      `C${f(x0 + w * 0.55)} ${f(y0)} ${f(cx - neck)} ${f(root + len * 0.22)} ${f(cx - neck)} ${f(Math.min(bulbY, root + len * 0.5))}` +
      `C${f(cx - neck)} ${f(bulbY + bulb * 0.15)} ${f(cx - bulb)} ${f(bulbY)} ${f(cx - bulb)} ${f(bulbY + bulb * 0.3)}` +
      // bulbo
      `C${f(cx - bulb)} ${f(tip + bulb * 0.15)} ${f(cx + bulb)} ${f(tip + bulb * 0.15)} ${f(cx + bulb)} ${f(bulbY + bulb * 0.3)}` +
      // lado derecho de vuelta al borde
      `C${f(cx + bulb)} ${f(bulbY)} ${f(cx + neck)} ${f(bulbY + bulb * 0.15)} ${f(cx + neck)} ${f(Math.min(bulbY, root + len * 0.5))}` +
      `C${f(cx + neck)} ${f(root + len * 0.22)} ${f(x1 - w * 0.55)} ${f(y1)} ${f(x1)} ${f(y1)}`;
    x = x1;
  });
  for (x += step; x < width; x += step) d += `L${f(x)} ${f(by(x))}`;
  d += `L${f(width)} ${f(by(width))}L${f(width)} 0Z`;
  return d;
}

/** Brillo especular: un trazo fino por el lado izquierdo de cada gota larga. */
export function glossPath(spec: FlowSpec, drips: Drip[], width: number, lens: number[], t = 0): string {
  let d = '';
  drips.forEach((drip, i) => {
    const len = lens[i];
    if (len < drip.w * 2.2) return;
    const cx = drip.x * width;
    const root = baseLine(spec, drip.x, t);
    const gx = cx - drip.w * 0.16;
    d += `M${f(gx)} ${f(root + len * 0.18)}C${f(gx - 1)} ${f(root + len * 0.45)} ${f(gx - drip.w * 0.12)} ${f(root + len * 0.7)} ${f(gx - drip.w * 0.1)} ${f(root + len * 0.82)}`;
  });
  return d;
}
