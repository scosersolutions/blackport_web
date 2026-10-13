/**
 * Prepara las fotos originales de `img/` para la web (no modifica los originales).
 *
 *   node scripts/process-images.mjs
 *
 * - Copia cada foto con nombre descriptivo a `src/assets/images/<categoria>/`.
 *   Astro genera después AVIF/WebP en varios tamaños.
 * - El blanco y negro de la web se aplica en CSS (token --photo-mono), igual para
 *   todas las fotos: aquí no se generan versiones tratadas.
 * - Extrae el logotipo original sobre fondo transparente.
 *
 * Para añadir fotos: copiarlas en `img/`, añadirlas a PHOTOS y ejecutar.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = 'img';
const OUT = 'src/assets/images';

/** [archivo original, categoría, nombre de salida] */
const PHOTOS = [
  ['WhatsApp Image 2026-10-12 at 21.02.06.jpeg', 'barbero', 'barbero-tijera'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (1).jpeg', 'cortes', 'decoloracion-papel'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (2).jpeg', 'cortes', 'maquina-nuca-rojo'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (3).jpeg', 'barbero', 'barbero-cliente-rojo'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (4).jpeg', 'barbero', 'barbero-tinte-guantes'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (5).jpeg', 'barbero', 'barbero-peine'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (6).jpeg', 'cortes', 'rojo-perfil'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (7).jpeg', 'cortes', 'rojo-lateral'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (8).jpeg', 'cortes', 'rojo-nuca-diseno'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (9).jpeg', 'cortes', 'secado-rojo'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (10).jpeg', 'cortes', 'mechas-papel'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (11).jpeg', 'barberia', 'espejo-puestos'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (12).jpeg', 'barberia', 'staff'],
  ['WhatsApp Image 2026-10-12 at 21.02.07 (13).jpeg', 'cortes', 'decoloracion-rubio'],
  ['WhatsApp Image 2026-10-12 at 21.02.07.jpeg', 'cortes', 'mechas-peinado'],
];

const LOGO = 'WhatsApp Image 2026-10-12 at 21.01.21.jpeg';

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

for (const [file, cat, name] of PHOTOS) {
  const input = path.join(SRC, file);
  const base = path.join(OUT, cat, name);
  // Grade suave para el color: baja el brillo de las paredes blancas.
  await sharp(input)
    .modulate({ brightness: 0.95, saturation: 0.95 })
    .linear(1.06, -8)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(`${base}.jpg`);
  console.log(cat, name);
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

const heroPhoto = path.join(OUT, 'cortes', 'rojo-perfil.jpg');
const ogPhoto = await sharp(heroPhoto).resize(560, 630, { fit: 'cover', position: 'top' }).grayscale().linear(1.1, -10).toBuffer();
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
