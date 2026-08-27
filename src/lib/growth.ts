/** Shared helpers for the agent growth features: boosts, deals, pro pages, viewings and leads. */

export interface BoostOption {
  days: number;
  price_rwf: number;
  label: string;
  blurb: string;
}

export const BOOST_OPTIONS: BoostOption[] = [
  { days: 7, price_rwf: 5000, label: "7 days", blurb: "A week at the top of search and the homepage." },
  { days: 14, price_rwf: 9000, label: "14 days", blurb: "Two weeks of front-page exposure — best value." },
  { days: 30, price_rwf: 15000, label: "30 days", blurb: "A full month for high-value listings." },
];

export const DEFAULT_LEAD_PRICE_RWF = 5000;

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(min).padStart(2, "0")} ${suffix}`;
}

export interface DaySlots {
  date: Date;
  times: Date[];
}

export interface SlotRule {
  weekday: number;
  start_minute: number;
  end_minute: number;
}

/** Builds bookable times for the next `days` days from an agent's weekly rules. */
export function buildSlots(rules: SlotRule[], slotMinutes: number, days = 14, taken: string[] = []): DaySlots[] {
  const out: DaySlots[] = [];
  const takenSet = new Set(taken.map((t) => new Date(t).getTime()));
  const now = Date.now();
  for (let d = 0; d < days; d++) {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + d);
    const rule = rules.find((r) => r.weekday === base.getDay());
    if (!rule) continue;
    const times: Date[] = [];
    for (let m = rule.start_minute; m + slotMinutes <= rule.end_minute; m += slotMinutes) {
      const t = new Date(base);
      t.setMinutes(m);
      if (t.getTime() <= now || takenSet.has(t.getTime())) continue;
      times.push(t);
    }
    if (times.length) out.push({ date: base, times });
  }
  return out;
}

export function commissionAmount(dealValue: number, pct: number): number {
  return Math.round((Number(dealValue) || 0) * (Number(pct) || 0)) / 100;
}

export function dealReference(id: string, closedOn: string): string {
  const year = new Date(closedOn).getFullYear();
  return `IBY-${year}-${id.slice(0, 6).toUpperCase()}`;
}
