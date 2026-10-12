/**
 * Carta de servicios. Solo servicios CONFIRMADOS por BLACKPORT.
 * Precio y duración son opcionales: si no se conocen, no se muestran.
 */
export interface Service {
  name: string;
  description?: string;
  /** En euros. */
  price?: number;
  /** «Desde» cuando el precio varía. */
  priceFrom?: boolean;
  /** En minutos. */
  durationMin?: number;
}

export const services: Service[] = [];

/**
 * Solo para previsualizar el diseño en desarrollo. NO son servicios reales
 * y nunca se renderizan en producción.
 */
export const servicePreview: Service[] = [
  { name: 'Corte', description: 'Ejemplo de categoría — sin confirmar.' },
  { name: 'Barba', description: 'Ejemplo de categoría — sin confirmar.' },
  { name: 'Corte + barba', description: 'Ejemplo de categoría — sin confirmar.' },
  { name: 'Color', description: 'Ejemplo de categoría — sin confirmar.' },
  { name: 'Perfilado', description: 'Ejemplo de categoría — sin confirmar.' },
];

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

export const formatPrice = (s: Service): string | undefined =>
  s.price === undefined ? undefined : `${s.priceFrom ? 'desde ' : ''}${euro.format(s.price)}`;

export const formatDuration = (s: Service): string | undefined =>
  s.durationMin === undefined ? undefined : `${s.durationMin} min`;
