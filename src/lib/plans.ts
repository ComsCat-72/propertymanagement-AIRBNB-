export type PlanKey = "free" | "tier1" | "tier2";

export interface PlanLimit {
  plan: PlanKey;
  label: string;
  price_rwf: number;
  max_listings: number | null;
  perks: string[];
  sort_order: number;
}

export const BADGE_PRICE_RWF = 5000;

/** Days after a paid plan lapses during which the listing allowance is kept. */
export const GRACE_DAYS = 7;

export function formatRwf(n: number): string {
  return `RWF ${new Intl.NumberFormat("en-US").format(n)}`;
}

type PlanFields = { plan?: string | null; plan_expires_at?: string | null } | null | undefined;

export type PlanStatus = "free" | "active" | "grace" | "expired";

/** Where the subscription stands: active, in the grace window, or fully lapsed. */
export function planStatus(p?: PlanFields): PlanStatus {
  const plan = (p?.plan as PlanKey) ?? "free";
  if (plan === "free") return "free";
  const exp = p?.plan_expires_at ? new Date(p.plan_expires_at).getTime() : 0;
  if (exp > Date.now()) return "active";
  if (exp + GRACE_DAYS * 86400000 > Date.now()) return "grace";
  return "expired";
}

/** Date the grace window closes, or null when not in grace. */
export function graceEndsAt(p?: PlanFields): Date | null {
  if (planStatus(p) !== "grace" || !p?.plan_expires_at) return null;
  return new Date(new Date(p.plan_expires_at).getTime() + GRACE_DAYS * 86400000);
}

/**
 * Plan used for the listing allowance. During the grace window the paid
 * allowance is kept; after it the agent falls back to free.
 */
export function effectivePlan(p?: PlanFields): PlanKey {
  const plan = (p?.plan as PlanKey) ?? "free";
  const status = planStatus(p);
  return status === "active" || status === "grace" ? plan : "free";
}

export function planExpired(p?: PlanFields): boolean {
  const s = planStatus(p);
  return s === "grace" || s === "expired";
}

export function isVerified(p?: { is_verified?: boolean | null; verified_expires_at?: string | null } | null): boolean {
  if (!p?.is_verified) return false;
  if (!p.verified_expires_at) return true;
  return new Date(p.verified_expires_at).getTime() > Date.now();
}

/** Advanced features are cut off the moment the plan lapses — no grace. */
export function hasAnalytics(p?: PlanFields): boolean {
  return planStatus(p) === "active";
}

export function maxListings(plan: PlanKey, limits?: PlanLimit[]): number | null {
  const row = (limits ?? []).find((l) => l.plan === plan);
  if (row) return row.max_listings;
  return plan === "free" ? 10 : plan === "tier1" ? 50 : null;
}

/**
 * Ranking algorithm: listings from verified agents surface first,
 * ties broken by the incoming (recency / price) order.
 */
export function rankVerifiedFirst<T extends { agent?: { is_verified?: boolean | null; verified_expires_at?: string | null } | null }>(rows: T[]): T[] {
  return rows
    .map((row, i) => ({ row, i, v: isVerified(row.agent) ? 1 : 0 }))
    .sort((a, b) => b.v - a.v || a.i - b.i)
    .map((x) => x.row);
}
