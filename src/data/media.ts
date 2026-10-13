import type { ImageMetadata } from 'astro';
import type { ServiceCategory } from './services';

import logoPng from '@/assets/images/logo/blackport-logo.png';
import rojoPerfilNoir from '@/assets/images/cortes/rojo-perfil-noir.jpg';
import tinteGuantesNoir from '@/assets/images/barbero/barbero-tinte-guantes-noir.jpg';
import staffNoir from '@/assets/images/barberia/staff-noir.jpg';
import clienteRojoNoir from '@/assets/images/barbero/barbero-cliente-rojo-noir.jpg';
import maquinaNucaNoir from '@/assets/images/cortes/maquina-nuca-rojo-noir.jpg';
import tijeraNoir from '@/assets/images/barbero/barbero-tijera-noir.jpg';
import mechasPapelNoir from '@/assets/images/cortes/mechas-papel-noir.jpg';
import secadoRojoNoir from '@/assets/images/cortes/secado-rojo-noir.jpg';
import rojoLateral from '@/assets/images/cortes/rojo-lateral.jpg';
import espejoPuestos from '@/assets/images/barberia/espejo-puestos.jpg';
import rojoNucaDiseno from '@/assets/images/cortes/rojo-nuca-diseno.jpg';
import decoloracionRubio from '@/assets/images/cortes/decoloracion-rubio.jpg';
import barberoPeine from '@/assets/images/barbero/barbero-peine.jpg';
import secadoRojo from '@/assets/images/cortes/secado-rojo.jpg';
import mechasPeinado from '@/assets/images/cortes/mechas-peinado.jpg';
import decoloracionPapel from '@/assets/images/cortes/decoloracion-papel.jpg';
import staff from '@/assets/images/barberia/staff.jpg';

/**
 * Registro central de fotografía y vídeo.
 *
 * Fotos: los originales están en `img/`. `node scripts/process-images.mjs`
 * genera las versiones web en `src/assets/images/` (color con grade suave y,
 * para piezas editoriales, `-noir`: B/N que conserva solo los rojos).
 * Astro las sirve en AVIF/WebP con varios tamaños.
 *
 * Vídeos: guardarlos en `public/videos/` (MP4 H.264 + WebM opcional) y
 * referenciarlos por ruta pública, p. ej. '/videos/presentacion.mp4'.
 * Un vídeo sin archivo es un hueco pendiente: solo se ve en desarrollo.
 */
export type PhotoCategory = 'corte' | 'barberia' | 'barbero' | 'detalle';

export interface Photo {
  id: string;
  category: PhotoCategory;
  /** Texto alternativo útil (qué se ve, no «foto de…»). */
  alt: string;
  src?: ImageMetadata;
  /** Punto focal CSS para los recortes, p. ej. '50% 30%'. */
  focus?: string;
}

export interface Video {
  id: string;
  title: string;
  mp4?: string;
  webm?: string;
  poster?: ImageMetadata;
  /** Proporción del archivo real, p. ej. '16 / 9' o '9 / 16'. */
  aspect: string;
}

/** Logotipo original (extraído del archivo recibido, fondo transparente; usar solo sobre oscuro). */
export const logo: ImageMetadata | undefined = logoPng;

export const heroPhoto: Photo = {
  id: 'hero',
  category: 'corte',
  alt: 'Cliente de perfil con el pelo teñido de rojo, degradado bajo y línea de diseño',
  src: rojoPerfilNoir,
  focus: '35% 30%',
};

/** Segunda capa del hero: detalle de corte en color, más pequeño y por delante. */
export const heroDetail: Photo = {
  id: 'hero-detalle',
  category: 'corte',
  alt: 'Nuca con degradado, línea de diseño y tinte rojo',
  src: rojoNucaDiseno,
  focus: '50% 40%',
};

/** Vídeo de fondo del hero. Si se añade, sustituye a la foto (que pasa a ser su poster). */
export const heroVideo: Video = { id: 'hero', title: 'BLACKPORT', aspect: '16 / 9' };

export const presentationVideo: Video = { id: 'presentacion', title: 'Vídeo de presentación', aspect: '16 / 9' };
export const openingVideo: Video = { id: 'inauguracion', title: 'Vídeo de inauguración', aspect: '9 / 16' };

/** Miniaturas incrustadas en el titular de «Sobre» (decorativas). */
export const aboutInline: Photo[] = [
  { id: 'inline-rojo', category: 'corte', alt: '', src: rojoLateral, focus: '55% 30%' },
  { id: 'inline-rubio', category: 'corte', alt: '', src: decoloracionRubio, focus: '45% 55%' },
];

export const aboutPhotos: { main: Photo; detail: Photo } = {
  main: {
    id: 'sobre-barbero',
    category: 'barbero',
    alt: 'Barbero con guantes aplicando tinte rojo a un cliente',
    src: tinteGuantesNoir,
    focus: '40% 30%',
  },
  detail: {
    id: 'sobre-staff',
    category: 'barberia',
    alt: 'Barbero de espaldas con camiseta negra rotulada STAFF en rojo',
    src: staffNoir,
    focus: '60% 50%',
  },
};

/** Imagen que acompaña a cada grupo de la carta de servicios (ambiente, no ejemplo literal). */
export const servicePhotos: Record<ServiceCategory, Photo> = {
  corte: {
    id: 'servicio-corte',
    category: 'corte',
    alt: 'Repaso con máquina en la nuca de un cliente con tinte rojo',
    src: maquinaNucaNoir,
    focus: '40% 35%',
  },
  combo: {
    id: 'servicio-combo',
    category: 'barbero',
    alt: 'Barbero repasando el corte de un cliente con el pelo rojo',
    src: clienteRojoNoir,
    focus: '50% 30%',
  },
  barba: {
    id: 'servicio-barba',
    category: 'barbero',
    alt: 'Barbero trabajando con peine y tijera frente al aro de luz',
    src: tijeraNoir,
    focus: '60% 35%',
  },
  color: {
    id: 'servicio-color',
    category: 'corte',
    alt: 'Barbero aplicando mechas con papel de aluminio',
    src: mechasPapelNoir,
    focus: '50% 35%',
  },
};

export const bookingPhoto: Photo = {
  id: 'reserva',
  category: 'corte',
  alt: 'Barbero secando con secador el tinte rojo de un cliente',
  src: secadoRojoNoir,
  focus: '55% 30%',
};

/** Orden = orden de la galería. El layout asigna tamaños por posición. */
export const gallery: Photo[] = [
  { id: 'rojo-lateral', category: 'corte', alt: 'Corte con degradado y tinte rojo, vista lateral', src: rojoLateral, focus: '50% 35%' },
  { id: 'espejo-puestos', category: 'barberia', alt: 'Puestos de trabajo de la barbería reflejados en el espejo', src: espejoPuestos },
  { id: 'rojo-nuca', category: 'corte', alt: 'Nuca con degradado, línea de diseño y tinte rojo', src: rojoNucaDiseno, focus: '50% 40%' },
  { id: 'decoloracion', category: 'corte', alt: 'Decoloración rubia en proceso, vista desde arriba', src: decoloracionRubio, focus: '45% 55%' },
  { id: 'peinado', category: 'barbero', alt: 'Barbero peinando a un cliente frente al aro de luz', src: barberoPeine, focus: '60% 40%' },
  { id: 'secado-rojo', category: 'detalle', alt: 'Barbero secando un tinte rojo con secador', src: secadoRojo, focus: '50% 35%' },
  { id: 'staff', category: 'barberia', alt: 'Camiseta del equipo con la palabra STAFF en rojo', src: staff, focus: '55% 50%' },
  { id: 'mechas', category: 'corte', alt: 'Barbero revisando unas mechas rubias', src: mechasPeinado, focus: '50% 35%' },
  { id: 'papel', category: 'detalle', alt: 'Decoloración con papel de aluminio vista en el espejo', src: decoloracionPapel, focus: '55% 35%' },
];

export const hasVideo = (v: Video): boolean => Boolean(v.mp4 || v.webm);

export const CATEGORY_LABEL: Record<PhotoCategory, string> = {
  corte: 'Corte',
  barberia: 'Barbería',
  barbero: 'Barbero',
  detalle: 'Detalle',
};
