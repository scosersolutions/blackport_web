/**
 * Reseñas auténticas, copiadas de las fuentes oficiales con permiso.
 * No añadir reseñas inventadas, parafraseadas ni puntuaciones agregadas.
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
}

export const reviews: Review[] = [];

export const SOURCE_LABEL: Record<ReviewSource, string> = {
  google: 'Google',
  booksy: 'Booksy',
};
