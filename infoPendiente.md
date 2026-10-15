# Pendiente — web de BLACKPORT

Estado a 15/10/2026. Marcar cada punto al cerrarlo.

## Bloquea la publicación

- [ ] **Comprar el dominio `blackport.es`.** `blackport.com` pertenece a un tercero (registrado desde 2017).
  Confirmar disponibilidad en el registrador (DonDominio u OVHcloud, ~6–8 €/año; comparar la renovación con IVA).
  Alternativas libres a 13/10/2026: `barberiablackport.com`, `blackportbarber.com`, `blackportbarberia.com`.
- [ ] **Configurar la URL del dominio** en `.env` → `SITE_URL=https://blackport.es`. Activa canonical, Open Graph absoluto y sitemap.
- [ ] **Crear el buzón `barberia@blackport.es`.** La web ya lo muestra (`src/config/site.ts`); sin buzón, los correos rebotan.
- [ ] **Aviso legal y política de privacidad.** Obligatorios por la LSSI (art. 10). Hacen falta el nombre del titular (persona o empresa) y su NIF/CIF.
- [ ] **Publicar la web.** Es estática (`npm run build` → `dist/`); vale Cloudflare Pages o Netlify. Definir allí las variables de `.env`.

## Analítica (opcional)

- [ ] Crear la cuenta de Umami Cloud (plan Hobby gratuito): https://cloud.umami.is/signup → añadir la web → `PUBLIC_UMAMI_ID`.
- [ ] (Opcional) Crear la cuenta de Microsoft Clarity para los mapas de calor → `PUBLIC_CLARITY_ID`. Muestra el aviso de cookies y solo carga si se acepta.
- [ ] Decidir si Umami también va detrás del aviso de consentimiento (riesgo legal mínimo frente a medir menos visitas).

## Contenido

- [ ] **Fotos en alta resolución.** Las actuales son de WhatsApp (853×1280) y se ven blandas en pantallas grandes.
- [ ] **Logo en vector (SVG).** Ahora es un PNG extraído.
- [ ] **Foto de portada:** confirmar `mechas-peinado.jpg` o elegir otra (`secado-rojo`, `espejo-puestos`, `maquina-nuca-rojo`).
- [ ] **Vídeos** de presentación e inauguración. La sección «Capítulos» solo se publica cuando existan.
- [ ] **Enlaces de Booksy por servicio.** No se ha podido verificar un enlace que abra el servicio ya elegido. Si Booksy Biz permite compartir un servicio, añadir cada enlace en `bookingUrl` (`src/data/services.ts`).
- [ ] ¿Nombrar al barbero (Héctor) en «Sobre nosotros»? Aparece en varias reseñas.

## Mantenimiento

- [ ] Precios, horario y valoración se tomaron de Booksy el 13/10/2026: actualizar `src/data/services.ts` y `src/config/site.ts` si cambian.
- [ ] Reseñas (`src/data/reviews.ts`): textos literales de Booksy; al añadir una nueva, comprobar sus estrellas en Booksy.

## Verificación pendiente

- [ ] Probar en dispositivos reales: Safari (iPhone), Chrome (Android) y Firefox. Hasta ahora solo se ha probado en Chrome con viewports simulados (320–1920 px).
- [ ] Con el dominio y la analítica activos: comprobar que el aviso de cookies y los eventos de Umami funcionan en producción.
