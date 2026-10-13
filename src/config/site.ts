import { confirmed, valueOf, type Field } from '@/lib/pending';

/**
 * Fuente única de los datos del negocio.
 * Sustituir cada `pending(...)` por `confirmed(valorReal)` cuando se confirme.
 *
 * Origen de los datos confirmados (13/10/2026):
 * - Dirección, teléfono, Maps, reseñas de Google y enlace de Booksy: facilitados por BLACKPORT.
 * - Coordenadas: las de la ficha de Google Maps facilitada.
 * - Horario, Instagram y valoración: perfil público de Booksy.
 */

/** 1 = lunes … 7 = domingo (ISO 8601). */
export type IsoDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DayHours {
  day: IsoDay;
  /** Tramos 'HH:MM'–'HH:MM'. Sin tramos = cerrado. */
  slots: Array<[string, string]>;
}

export interface Rating {
  value: number;
  count: number;
  /** Fecha (ISO) en que se tomó el dato. */
  asOf: string;
}

export interface SiteConfig {
  name: string;
  /** Nombres con los que aparece en Google y Booksy. */
  alternateNames: string[];
  island: string;
  country: string;
  timeZone: string;
  description: string;
  booksyUrl: Field<string>;
  address: Field<{ street: string; postalCode: string; locality: string; region: string }>;
  geo: Field<{ lat: number; lng: number }>;
  mapsUrl: Field<string>;
  hours: Field<DayHours[]>;
  phone: Field<{ display: string; e164: string }>;
  email: Field<string>;
  instagram: Field<{ handle: string; url: string }>;
  googleReviewsUrl: Field<string>;
  booksyReviewsUrl: Field<string>;
  booksyRating: Field<Rating>;
  /** Características publicadas en el perfil de Booksy. */
  amenities: Field<string[]>;
}

export const site: SiteConfig = {
  name: 'BLACKPORT',
  alternateNames: ['Black Port Barber Studio', 'Barbería Black Port'],
  island: 'Tenerife',
  country: 'España',
  timeZone: 'Atlantic/Canary',
  description:
    'BLACKPORT, barbería en Icod de los Vinos (Tenerife). Cortes, degradados, barba a navaja, mechas y decoloración. Reserva tu cita en Booksy.',
  booksyUrl: confirmed('https://booksy.com/es-es/dl/show-business/156795?utm_medium=c2c_referral'),
  address: confirmed({
    street: 'C. Antonio Pérez Díaz, 9, Loc 22',
    postalCode: '38430',
    locality: 'Icod de los Vinos',
    region: 'Santa Cruz de Tenerife',
  }),
  geo: confirmed({ lat: 28.3739565, lng: -16.710563 }),
  mapsUrl: confirmed('https://maps.app.goo.gl/JUzS66aiRUbWRqmg7'),
  hours: confirmed([
    { day: 1, slots: [['10:00', '13:00'], ['16:00', '21:00']] },
    { day: 2, slots: [['09:00', '13:00'], ['16:00', '20:00']] },
    { day: 3, slots: [['10:00', '13:00'], ['16:00', '21:00']] },
    { day: 4, slots: [['09:00', '13:00'], ['16:00', '20:00']] },
    { day: 5, slots: [['09:00', '13:00'], ['16:00', '20:00']] },
    { day: 6, slots: [['09:00', '14:00']] },
    { day: 7, slots: [] },
  ]),
  phone: confirmed({ display: '677 81 78 33', e164: '+34677817833' }),
  // Dominio previsto: blackport.es (blackport.com pertenece a un tercero). El buzón debe existir antes de publicar.
  email: confirmed('barberia@blackport.es'),
  instagram: confirmed({ handle: 'black.port_', url: 'https://www.instagram.com/black.port_/' }),
  googleReviewsUrl: confirmed(
    'https://www.google.com/maps/place/BARBER%C3%8DA+%E2%80%9CBLACK+PORT%E2%80%9D/@28.3739565,-26.4664224,6z/data=!4m12!1m2!2m1!1zQkFSQkVSw41BIOKAnEJMQUNLIFBPUlTigJ0!3m8!1s0xc6a7d4f952ee1f3:0x8055362f1a3dfe0d!8m2!3d28.3739565!4d-16.710563!9m1!1b1!15sChpCQVJCRVLDjUEg4oCcQkxBQ0sgUE9SVOKAnZIBC2JhcmJlcl9zaG9w4AEA!16s%2Fg%2F11ykvfs021?entry=ttu&g_ep=EgoyMDI2MTAxMS4wIKXMDSoASAFQAw%3D%3D',
  ),
  booksyReviewsUrl: confirmed('https://booksy.com/es-es/156795_black-port-barber-studio_barberia_70749_playa-de-san-marcos'),
  booksyRating: confirmed({ value: 5, count: 106, asOf: '2026-10-13' }),
  amenities: confirmed(['Programa de fidelidad', 'Adaptado para niños', 'Se permiten mascotas']),
};

/** Destino único de todos los CTA de reserva. */
export const BOOKSY_URL: string | undefined = valueOf(site.booksyUrl);

export { confirmed };
