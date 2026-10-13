import type { DayHours, IsoDay } from '@/config/site';

/** Utilidades de horario. Puras: se usan en el build y en el navegador. */

export const DAY_NAME: Record<IsoDay, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export const DAY_SHORT: Record<IsoDay, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };

const SCHEMA_DAY: Record<IsoDay, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export const formatSlots = (d: DayHours): string =>
  d.slots.length ? d.slots.map(([a, b]) => `${a}–${b}`).join(' · ') : 'Cerrado';

/** Agrupa los días con el mismo horario: «Lun, Mié · 10:00–13:00 · 16:00–21:00». */
export function groupHours(hours: DayHours[]): Array<{ days: string; slots: string }> {
  const groups = new Map<string, IsoDay[]>();
  for (const d of hours) {
    const key = formatSlots(d);
    groups.set(key, [...(groups.get(key) ?? []), d.day]);
  }
  return [...groups].map(([slots, days]) => ({ days: days.map((d) => DAY_SHORT[d]).join(', '), slots }));
}

/** schema.org OpeningHoursSpecification. */
export const toSchema = (hours: DayHours[]): Array<Record<string, string>> =>
  hours.flatMap((d) =>
    d.slots.map(([opens, closes]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAY[d.day],
      opens,
      closes,
    })),
  );

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export interface ZonedNow {
  day: IsoDay;
  minutes: number;
}

const WEEKDAY: Record<string, IsoDay> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Día ISO y minuto actual en la zona horaria del local. */
export function nowIn(timeZone: string, date: Date = new Date()): ZonedNow {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? '';
  return { day: WEEKDAY[get('weekday')] ?? 1, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export interface OpenStatus {
  open: boolean;
  /** Texto corto, p. ej. «Abierto · cierra a las 13:00». */
  label: string;
}

/** Estado actual y próximo cambio. */
export function openStatus(hours: DayHours[], now: ZonedNow): OpenStatus {
  const byDay = new Map(hours.map((d) => [d.day, d]));
  const today = byDay.get(now.day);
  const current = today?.slots.find(([a, b]) => now.minutes >= toMin(a) && now.minutes < toMin(b));
  if (current) return { open: true, label: `Abierto · cierra a las ${current[1]}` };

  const laterToday = today?.slots.find(([a]) => toMin(a) > now.minutes);
  if (laterToday) return { open: false, label: `Cerrado · abre hoy a las ${laterToday[0]}` };

  for (let i = 1; i <= 7; i++) {
    const day = (((now.day - 1 + i) % 7) + 1) as IsoDay;
    const next = byDay.get(day)?.slots[0];
    if (next) {
      const when = i === 1 ? 'mañana' : `el ${DAY_NAME[day].toLowerCase()}`;
      return { open: false, label: `Cerrado · abre ${when} a las ${next[0]}` };
    }
  }
  return { open: false, label: 'Cerrado' };
}
