import { confirmed, pending, valueOf, type Field } from '@/lib/pending';

/**
 * Fuente única de los datos del negocio.
 * Sustituir cada `pending(...)` por `confirmed(valorReal)` cuando se confirme.
 */
export interface OpeningHours {
  /** Ej.: 'Lunes a viernes' */
  days: string;
  /** Ej.: '10:00 – 20:00' */
  hours: string;
}

export interface SiteConfig {
  name: string;
  island: string;
  country: string;
  description: string;
  booksyUrl: Field<string>;
  address: Field<{ street: string; postalCode: string; locality: string }>;
  geo: Field<{ lat: number; lng: number }>;
  mapsUrl: Field<string>;
  directions: Field<string>;
  hours: Field<OpeningHours[]>;
  phone: Field<{ display: string; e164: string }>;
  email: Field<string>;
  instagram: Field<{ handle: string; url: string }>;
  googleReviewsUrl: Field<string>;
  booksyReviewsUrl: Field<string>;
}

export const site: SiteConfig = {
  name: 'BLACKPORT',
  island: 'Tenerife',
  country: 'España',
  description:
    'BLACKPORT, barbería en Tenerife. Cortes, degradados, color y acabados con carácter propio. Reserva tu cita en Booksy.',
  booksyUrl: pending('URL del perfil de BLACKPORT en Booksy'),
  address: pending('Dirección exacta del local'),
  geo: pending('Coordenadas del local'),
  mapsUrl: pending('Enlace de Google Maps del local'),
  directions: pending('Indicaciones para llegar / aparcamiento'),
  hours: pending('Horario de apertura'),
  phone: pending('Teléfono de contacto'),
  email: pending('Correo electrónico'),
  instagram: pending('Cuenta de Instagram'),
  googleReviewsUrl: pending('Enlace a las reseñas de Google'),
  booksyReviewsUrl: pending('Enlace a las reseñas de Booksy'),
};

/** Destino único de todos los CTA de reserva. */
export const BOOKSY_URL: string | undefined = valueOf(site.booksyUrl);

export { confirmed };
