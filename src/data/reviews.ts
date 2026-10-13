/**
 * Citas de reseñas auténticas, copiadas de las fuentes oficiales con permiso.
 * No añadir reseñas inventadas ni parafraseadas. La valoración media de Booksy
 * vive en `site.booksyRating` (src/config/site.ts), con la fecha del dato.
 */
export type ReviewSource = 'google' | 'booksy';

export interface Review {
  source: ReviewSource;
  /** Nombre tal como aparece en la plataforma (o inicial, si el autor lo prefiere). */
  author: string;
  text: string;
  /** 1–5, tal como figura en la reseña original. */
  rating?: number;
  /** ISO yyyy-mm-dd de la reseña original. */
  date?: string;
  /** Enlace directo a la reseña, si existe. */
  url?: string;
  /** Servicio reseñado, tal como figura en la plataforma. */
  service?: string;
  /** Idioma del texto si no es español (BCP 47), para lectores de pantalla. */
  lang?: string;
}

/**
 * Reseñas de «Cliente verificado» en Booksy, facilitadas por BLACKPORT (13/10/2026).
 * Textos literales. Orden: más recientes primero. Se omiten las que no tienen texto
 * o solo llevan un emoji/una palabra, y una repetida del mismo cliente.
 * Estrellas: comprobadas una a una en el perfil público de Booksy el 13/10/2026;
 * todas las de esta lista son de 5. Si se añade otra, comprobar la suya.
 */
const booksy = (author: string, date: string, service: string, text: string, lang?: string): Review => ({
  source: 'booksy',
  author,
  rating: 5,
  date,
  service,
  text,
  ...(lang && { lang }),
});

export const reviews: Review[] = [
  booksy('Jean Carlos', '2026-09-04', 'Corte y barba', 'Es un grande ,cliente fijo de por vida no ahí ninguno que lo corte como el'),
  booksy('Eduardo', '2026-08-27', 'Corte y barba', 'Muy buen corte y el peluquero es un tío genial.'),
  booksy(
    'Michael',
    '2026-08-24',
    'Corte caballero',
    'Excelente servicio profesional, ambiente tranquilo muy buena atención por parte de Héctor 🫡👍🏻',
  ),
  booksy('Tony', '2026-08-21', 'Corte y barba', 'Buen trato y buen servicio repito seguro'),
  booksy('Germán', '2026-08-09', 'Corte caballero', 'Mi peluquería favorita, muy buen profesional, buenos precios y un trato increíble'),
  booksy('Rodolfo', '2026-07-29', 'Corte caballero', 'Primera vez que voy y el chaval entendió perfecto como quería el corte. Éxito'),
  booksy('Margarita', '2026-07-25', 'Corte caballero', 'gran profesional , gracias'),
  booksy('Alexander', '2026-07-09', 'Corte caballero', 'Héctor la cabra'),
  booksy('Michael', '2026-06-28', 'Corte caballero', 'friendly, professional, attentive - highly recommend', 'en'),
  booksy(
    'Rayco',
    '2026-06-27',
    'Corte y Barba “Semanal”',
    'Como siempre un crack. Buen trato desde el primer momento se toma su tiempo para dejarte el corte y la barba perfectos. Da gusto ponerse en sus manos. Muy recomendado, nos vemos en el próximo corte. ¡Gracias👏👍👍',
  ),
  booksy('Erik', '2026-06-19', 'Corte y barba', 'Trato muy amable, puntualidad y buen resultado final.'),
  booksy('Vicente', '2026-06-02', 'Mechas o cambios de forma temporales', 'Duro el socio🤜🏽🤛🏽'),
  booksy('Javier', '2025-11-20', 'Corte caballero', 'Gran trato. Y muy muy profesional. Lo recomiendo 100%'),
  booksy('Fabio', '2025-11-18', 'Corte caballero', 'Servicio de calidad, más que satisfecho con el resultado👏🏻👏🏻'),
  booksy(
    'Javi',
    '2025-11-15',
    'Corte caballero',
    'El mejor servicio de la zona, buen degradado y manejo de las tijeras. Muy amable, volvería y volveré.',
  ),
  booksy('Marcos Nerón', '2025-11-15', 'Corte y barba', 'Excelente atención y muy buen corte. Inmejorable.'),
  booksy('Ángel', '2025-11-11', 'Corte caballero', 'Excelente corte, muy buena atención'),
  booksy('Saul', '2025-11-11', 'Corte caballero', 'Trato muy cercano, y cada detalle marcado a la perfección, 10/10'),
];

export const SOURCE_LABEL: Record<ReviewSource, string> = {
  google: 'Google',
  booksy: 'Booksy',
};
