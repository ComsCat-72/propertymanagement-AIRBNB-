export interface Country {
  code: string;   // ISO alpha-2
  name: string;
  dial: string;   // without "+"
}

/** Common countries first (East Africa), then a broad list. */
export const COUNTRIES: Country[] = [
  { code: "RW", name: "Rwanda", dial: "250" },
  { code: "UG", name: "Uganda", dial: "256" },
  { code: "KE", name: "Kenya", dial: "254" },
  { code: "TZ", name: "Tanzania", dial: "255" },
  { code: "BI", name: "Burundi", dial: "257" },
  { code: "CD", name: "DR Congo", dial: "243" },
  { code: "ZA", name: "South Africa", dial: "27" },
  { code: "NG", name: "Nigeria", dial: "234" },
  { code: "GH", name: "Ghana", dial: "233" },
  { code: "ET", name: "Ethiopia", dial: "251" },
  { code: "EG", name: "Egypt", dial: "20" },
  { code: "US", name: "United States", dial: "1" },
  { code: "CA", name: "Canada", dial: "1" },
  { code: "GB", name: "United Kingdom", dial: "44" },
  { code: "FR", name: "France", dial: "33" },
  { code: "DE", name: "Germany", dial: "49" },
  { code: "BE", name: "Belgium", dial: "32" },
  { code: "NL", name: "Netherlands", dial: "31" },
  { code: "IT", name: "Italy", dial: "39" },
  { code: "ES", name: "Spain", dial: "34" },
  { code: "SE", name: "Sweden", dial: "46" },
  { code: "CH", name: "Switzerland", dial: "41" },
  { code: "TR", name: "Turkey", dial: "90" },
  { code: "AE", name: "United Arab Emirates", dial: "971" },
  { code: "SA", name: "Saudi Arabia", dial: "966" },
  { code: "QA", name: "Qatar", dial: "974" },
  { code: "IN", name: "India", dial: "91" },
  { code: "PK", name: "Pakistan", dial: "92" },
  { code: "CN", name: "China", dial: "86" },
  { code: "JP", name: "Japan", dial: "81" },
  { code: "AU", name: "Australia", dial: "61" },
  { code: "BR", name: "Brazil", dial: "55" },
];

export const DEFAULT_DIAL = "250";

/** Longest dial codes first so "250" wins over "25". */
const DIALS = Array.from(new Set(COUNTRIES.map((c) => c.dial))).sort((a, b) => b.length - a.length);

/**
 * Turn any stored phone value into a WhatsApp-ready international number
 * (digits only, no "+"). Local numbers such as 0780979872 get the default
 * country code so existing records keep working.
 */
export function toInternational(raw?: string | null, fallbackDial: string = DEFAULT_DIAL): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    if (trimmed.startsWith("00")) digits = digits.replace(/^00/, "");
    return digits;
  }
  // Already prefixed with a known country code and long enough to be international.
  const known = DIALS.find((d) => digits.startsWith(d) && digits.length >= d.length + 8);
  if (known) return digits;

  return fallbackDial + digits.replace(/^0+/, "");
}

/** Pretty display form: +250 780 979 872 */
export function formatPhone(raw?: string | null): string {
  const intl = toInternational(raw);
  if (!intl) return "";
  return `+${intl}`;
}

/** Build a wa.me link, or "" when there is no usable number. */
export function whatsappLink(raw: string | null | undefined, message: string): string {
  const intl = toInternational(raw);
  if (intl.length < 9) return "";
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

/** Split a stored value into a dial code + local part for editing. */
export function splitPhone(raw?: string | null): { dial: string; local: string } {
  if (!raw) return { dial: DEFAULT_DIAL, local: "" };
  const digits = raw.replace(/\D/g, "").replace(/^00/, "");
  const dial = DIALS.find((d) => digits.startsWith(d) && digits.length > d.length);
  if (raw.trim().startsWith("+") && dial) return { dial, local: digits.slice(dial.length) };
  if (dial && digits.length >= dial.length + 8) return { dial, local: digits.slice(dial.length) };
  return { dial: DEFAULT_DIAL, local: digits.replace(/^0+/, "") };
}

/** Join a dial code + local input into stored E.164 form. */
export function joinPhone(dial: string, local: string): string {
  const l = local.replace(/\D/g, "").replace(/^0+/, "");
  if (!l) return "";
  return `+${dial}${l}`;
}
