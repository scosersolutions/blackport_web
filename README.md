# blackport_web

Web de BLACKPORT, barbería en Tenerife. Astro 7 + TypeScript, salida estática, sin librerías de animación.

## Comandos

```bash
npm install
npm run dev       # http://localhost:4321 — muestra los datos pendientes etiquetados en amarillo
npm run build     # astro check + build estático en dist/
npm run preview   # sirve dist/ tal como quedaría publicado
node scripts/process-images.mjs   # regenera fotos web, logo, iconos y og.jpg desde img/
```

## Dónde se edita cada cosa

| Qué | Archivo |
|---|---|
| Booksy, dirección, mapa, horario, teléfono, email, Instagram, enlaces de reseñas | `src/config/site.ts` (cambiar `pending(...)` por `confirmed(valor)`) |
| Servicios, precios y duraciones | `src/data/services.ts` |
| Reseñas reales de Google / Booksy | `src/data/reviews.ts` |
| Fotos, vídeos y su uso en cada sección | `src/data/media.ts` |
| Colores, tipografía, espaciado | `src/styles/tokens.css` |
| Dominio público (canonical, OG, sitemap) | `.env` → `SITE_URL=https://…` (ver `.env.example`) |

## Datos pendientes

Nada pendiente se publica como real. En `npm run dev` aparece con etiquetas amarillas
«PENDIENTE»; en el build de producción se oculta (sección, enlace o botón). Para revisar
un build con los huecos visibles: `PUBLIC_SHOW_PENDING=true` en `.env`.

## Fotos y vídeos

- Originales en `img/` (no se modifican). `scripts/process-images.mjs` los copia a
  `src/assets/images/` con nombre descriptivo y genera la versión `-noir` (B/N que conserva
  solo los rojos) para las piezas editoriales. Astro sirve AVIF/WebP en varios tamaños.
- Vídeos: `public/videos/*.mp4` y rellenar `heroVideo`, `presentationVideo` u
  `openingVideo` en `src/data/media.ts`. La sección de vídeos aparece sola al tener archivo.
- El logo actual se extrae de una imagen de 500 px: conviene sustituirlo por la versión vectorial.
