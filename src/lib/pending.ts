/**
 * Datos pendientes de confirmar.
 *
 * Todo dato comercial (dirección, Booksy, teléfono, servicios…) es un `Field<T>`:
 * o está confirmado con su valor real, o está pendiente con una nota.
 * Lo pendiente NUNCA se publica como real: en desarrollo se muestra como
 * placeholder etiquetado; en producción se oculta.
 */
export type Field<T> =
  | { status: 'confirmed'; value: T }
  | { status: 'pending'; note: string };

export const pending = (note: string): Field<never> => ({ status: 'pending', note });
export const confirmed = <T>(value: T): Field<T> => ({ status: 'confirmed', value });

export const valueOf = <T>(field: Field<T>): T | undefined =>
  field.status === 'confirmed' ? field.value : undefined;

/** Placeholders visibles: siempre en `astro dev`, o con PUBLIC_SHOW_PENDING=true. */
export const SHOW_PENDING: boolean =
  import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_PENDING === 'true';
