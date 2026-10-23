export const fractions = {
  mixed: "Zmieszane",
  packaging: "Metale i tworzywa sztuczne",
  paper: "Papier",
  glass: "Szkło",
  bio: "Bioodpady",
  bulky: "Wielkogabarytowe",
} as const;
export type Fraction = keyof typeof fractions;
export type WasteSchedule = {
  locality: string;
  housing: string;
  validFrom: string;
  validUntil: string;
  verifiedAt: string;
  sourceUrl: string;
  collections: { date: string; fractions: Fraction[] }[];
};
export const polishDay = (now = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(now);
export function upcomingCollections(schedule: WasteSchedule, today: string) {
  return today >= schedule.validFrom && today <= schedule.validUntil
    ? schedule.collections.filter(entry => entry.date >= today).sort((a, b) => a.date.localeCompare(b.date))
    : [];
}
export function collectionsWithinWeek(schedule: WasteSchedule, today: string) {
  const end = new Date(today + "T12:00:00Z");
  end.setUTCDate(end.getUTCDate() + 7);
  const lastDay = end.toISOString().slice(0, 10);
  return upcomingCollections(schedule, today).filter(entry => entry.date <= lastDay);
}
export function relativeDay(date: string, today: string) {
  const days = Math.round((Date.parse(date + "T12:00:00Z") - Date.parse(today + "T12:00:00Z")) / 86400000);
  return days === 0 ? "Dzisiaj" : days === 1 ? "Jutro" : `Za ${days} dni`;
}
export function isWasteSchedule(value: unknown): value is WasteSchedule {
  if (!value || typeof value !== "object") return false;
  const s = value as WasteSchedule;
  const date = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + "T12:00:00Z")) && new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v;
  return s.locality === "Szczedrzyk" && typeof s.housing === "string" && date(s.validFrom) && date(s.validUntil) && s.validFrom <= s.validUntil && date(s.verifiedAt)
    && typeof s.sourceUrl === "string" && s.sourceUrl.startsWith("https://ozimek.pl/")
    && Array.isArray(s.collections) && s.collections.length > 0 && s.collections.every(e => e && date(e.date) && e.date >= s.validFrom && e.date <= s.validUntil && Array.isArray(e.fractions) && e.fractions.length > 0 && e.fractions.every(f => Object.hasOwn(fractions, f)));
}
