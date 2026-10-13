/**
 * Carta de servicios, tal como figura en el perfil de BLACKPORT en Booksy
 * (consultado el 13/10/2026). Si cambia allí, actualizar aquí.
 * Precio y duración son opcionales: si no se conocen, no se muestran.
 */
export type ServiceCategory = 'corte' | 'combo' | 'barba' | 'color';

export interface Service {
  name: string;
  category: ServiceCategory;
  description?: string;
  /** En euros. */
  price?: number;
  /** «Desde» cuando el precio varía. */
  priceFrom?: boolean;
  /** En minutos. */
  durationMin?: number;
  /** Marcado como «más popular» en Booksy. */
  popular?: boolean;
  /** Precio «Semanal»: solo con el requisito de WEEKLY_RULE. */
  weekly?: boolean;
  /**
   * Enlace de Booksy que abre este servicio ya elegido (se copia desde Booksy Biz).
   * Sin él, la fila lleva al perfil de Booksy, donde se elige el servicio.
   */
  bookingUrl?: string;
}

/**
 * Condición del precio «Semanal», según la descripción de Booksy
 * («para quien hizo este mismo servicio la semana pasada»).
 */
export const WEEKLY_RULE = 'Para acceder a este precio, es necesario haberse hecho este mismo servicio durante la semana anterior.';
const WEEKLY = WEEKLY_RULE;

export const services: Service[] = [
  { name: 'Corte caballero', category: 'corte', description: 'Tijera y degradado.', price: 12, durationMin: 30, popular: true },
  { name: 'Corte «Semanal»', category: 'corte', description: WEEKLY, price: 10, durationMin: 30, popular: true, weekly: true },
  { name: 'Corte y barba', category: 'combo', price: 15, durationMin: 45, popular: true },
  { name: 'Corte y barba «Semanal»', category: 'combo', description: WEEKLY, price: 12, durationMin: 30, weekly: true },
  { name: 'Corte y barba «Premium»', category: 'combo', price: 25, durationMin: 60 },
  { name: 'Recorte de barba', category: 'barba', description: 'Recorte solo con máquinas.', price: 6, durationMin: 15 },
  {
    name: 'Barba Premium',
    category: 'barba',
    description: 'Recorte o afeitado a navaja con toalla caliente, mascarilla para puntos negros y masaje facial.',
    price: 15,
    durationMin: 30,
  },
  { name: 'Cejas a navaja', category: 'barba', price: 2, durationMin: 5 },
  { name: 'Mechas + corte', category: 'color', price: 40, durationMin: 180 },
  { name: 'Decoloración completa + corte', category: 'color', price: 60, durationMin: 180 },
];

export const CATEGORY_TITLE: Record<ServiceCategory, string> = {
  corte: 'Cortes',
  combo: 'Corte + barba',
  barba: 'Barba y navaja',
  color: 'Color',
};

export const CATEGORY_ORDER: ServiceCategory[] = ['corte', 'combo', 'barba', 'color'];

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const formatPrice = (s: Service): string | undefined =>
  s.price === undefined ? undefined : `${s.priceFrom ? 'desde ' : ''}${euro.format(s.price)}`;

export const formatDuration = (s: Service): string | undefined => {
  if (s.durationMin === undefined) return undefined;
  const h = Math.floor(s.durationMin / 60);
  const m = s.durationMin % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

/** Rango de precios para schema.org (p. ej. «2 €–60 €»). */
export const priceRange = (): string | undefined => {
  const prices = services.map((s) => s.price).filter((p): p is number => p !== undefined);
  return prices.length ? `${euro.format(Math.min(...prices))}–${euro.format(Math.max(...prices))}` : undefined;
};
