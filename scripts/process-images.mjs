/**
 * Prepara las fotos originales de `img/` para la web (no modifica los originales).
 *
 *   node scripts/process-images.mjs
 *
 * - Copia cada foto con nombre descriptivo a `src/assets/images/<categoria>/`.
 *   Astro genera después AVIF/WebP en varios tamaños.
 * - Para las fotos marcadas con `noir`, crea además `<nombre>-noir.jpg`:
 *   blanco y negro cinematográfico que conserva solo los rojos (tinte, logo
 *   de las capas), con contraste y viñeteado.
 * - Extrae el logotipo original sobre fondo transparente.
 *
 * Para añadir fotos: copiarlas en `img/`, añadirlas a PHOTOS y ejecutar.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = 'img';
const OUT = 'src/assets/images';

/** [archivo original, categoría, nombre de salida, genera versión noir] */
const PHOTOS = [
  ['WhatsApp Image 2026-10-12 at 21.02.06.jpeg', 'barbero', 'barbero-tijera', true],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (1).jpeg', 'cortes', 'decoloracion-papel', false],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (2).jpeg', 'cortes', 'maquina-nuca-rojo', true],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (3).jpeg', 'barbero', 'barbero-cliente-rojo', true],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (4).jpeg', 'barbero', 'barbero-tinte-guantes', true],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (5).jpeg', 'barbero', 'barbero-peine', false],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (6).jpeg', 'cortes', 'rojo-perfil', true],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (7).jpeg', 'cortes', 'rojo-lateral', false],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (8).jpeg', 'cortes', 'rojo-nuca-diseno', false],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (9).jpeg', 'cortes', 'secado-rojo', true],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (10).jpeg', 'cortes', 'mechas-papel', true],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (11).jpeg', 'barberia', 'espejo-puestos', false],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (12).jpeg', 'barberia', 'staff', true],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (13).jpeg', 'cortes', 'decoloracion-rubio', false],
  ['WhatsApp Image 2026-10-12 at 21.02.07.jpeg', 'cortes', 'mechas-peinado', false],
];

const LOGO = 'WhatsApp Image 2026-10-12 at 21.01.21.jpeg';

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** B/N que conserva los rojos + curva de contraste + viñeteado. */
async function noir(input, output) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const out = Buffer.alloc(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      let hue = 0;
      if (max !== min) {
        if (max === r) hue = ((g - b) / (max - min)) % 6;
        else if (max === g) hue = (b - r) / (max - min) + 2;
        else hue = (r - g) / (max - min) + 4;
        hue *= 60;
        if (hue < 0) hue += 360;
      }
      // Tinte magenta/rojo del pelo y del logo; la piel (más naranja y menos saturada) queda fuera.
      const dist = Math.min(Math.abs(hue - 344), 360 - Math.abs(hue - 344));
      const keep = (1 - smooth(10, 20, dist)) * smooth(0.6, 0.78, sat) * smooth(0.22, 0.38, max);

      let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lum = Math.pow(lum, 1.18);
      lum = Math.min(1, Math.max(0, (lum - 0.5) * 1.22 + 0.47));
      // Comprime las altas luces: paredes blancas → gris profundo.
      if (lum > 0.55) lum = 0.55 + (lum - 0.55) * 0.5;

      const nx = x / w - 0.5;
      const ny = y / h - 0.45;
      const vig = 1 - 0.55 * smooth(0.12, 0.62, Math.sqrt(nx * nx + ny * ny));

      const mix = (c) => {
        const graded = Math.pow(c, 1.08) * 1.04;
        return Math.min(1, (lum * (1 - keep) + graded * keep) * vig);
      };
      out[i] = Math.round(mix(r) * 255);
      out[i + 1] = Math.round(mix(g) * 255);
      out[i + 2] = Math.round(mix(b) * 255);
    }
  }
  await sharp(out, { raw: { width: w, height: h, channels: ch } }).jpeg({ quality: 90, mozjpeg: true }).toFile(output);
}

/** Logo sobre negro → PNG transparente (des-multiplicado sobre negro). */
async function extractLogo(input, output) {
  const img = sharp(input).removeAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      if (Math.max(data[i], data[i + 1], data[i + 2]) > 40) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  const pad = 6;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad) - left;
  const chh = Math.min(h, maxY + pad) - top;
  const rgba = Buffer.alloc(cw * chh * 4);
  for (let y = 0; y < chh; y++) {
    for (let x = 0; x < cw; x++) {
      const i = ((y + top) * w + (x + left)) * ch;
      const o = (y * cw + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const a = Math.max(r, g, b);
      // Elimina el ruido JPEG del fondo.
      const alpha = a < 18 ? 0 : a;
      rgba[o] = alpha ? Math.round((r / a) * 255) : 0;
      rgba[o + 1] = alpha ? Math.round((g / a) * 255) : 0;
      rgba[o + 2] = alpha ? Math.round((b / a) * 255) : 0;
      rgba[o + 3] = alpha;
    }
  }
  await sharp(rgba, { raw: { width: cw, height: chh, channels: 4 } }).png({ compressionLevel: 9 }).toFile(output);
  return { width: cw, height: chh };
}

for (const dir of ['logo', 'cortes', 'barberia', 'barbero']) {
  await fs.mkdir(path.join(OUT, dir), { recursive: true });
}

const logoSize = await extractLogo(path.join(SRC, LOGO), path.join(OUT, 'logo', 'blackport-logo.png'));
console.log('logo', logoSize);

for (const [file, cat, name, makeNoir] of PHOTOS) {
  const input = path.join(SRC, file);
  const base = path.join(OUT, cat, name);
  // Grade suave para el color: baja el brillo de las paredes blancas.
  await sharp(input)
    .modulate({ brightness: 0.95, saturation: 0.95 })
    .linear(1.06, -8)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(`${base}.jpg`);
  if (makeNoir) await noir(input, `${base}-noir.jpg`);
  console.log(cat, name, makeNoir ? '+noir' : '');
}

// Iconos y Open Graph a partir del logo y la foto del hero.
const INK = { r: 9, g: 9, b: 9, alpha: 1 };
const logoPath = path.join(OUT, 'logo', 'blackport-logo.png');
const onInk = async (size, logoWidth) =>
  sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: await sharp(logoPath).resize(logoWidth).toBuffer(), gravity: 'center' }])
    .png();
await (await onInk(180, 156)).toFile('public/apple-touch-icon.png');
await (await onInk(512, 440)).toFile('public/icon-512.png');

const heroNoir = path.join(OUT, 'cortes', 'rojo-perfil-noir.jpg');
const ogPhoto = await sharp(heroNoir).resize(560, 630, { fit: 'cover', position: 'top' }).toBuffer();
const fade = Buffer.from(
  `<svg width="560" height="630"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#090909"/><stop offset=".45" stop-color="#090909" stop-opacity="0"/></linearGradient></defs><rect width="560" height="630" fill="url(#g)"/></svg>`,
);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: INK } })
  .composite([
    { input: ogPhoto, left: 640, top: 0 },
    { input: fade, left: 640, top: 0 },
    { input: await sharp(logoPath).resize(520).toBuffer(), left: 80, top: 200 },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/og.jpg');
console.log('iconos + og');
