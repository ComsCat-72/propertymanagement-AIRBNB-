export type PlanKey = "free" | "tier1" | "tier2";

export interface PlanLimit {
  plan: PlanKey;
  label: string;
  price_rwf: number;
  max_listings: number | null;
  perks: string[];
  sort_order: number;
}

export const BADGE_PRICE_RWF = 10000;

export function formatRwf(n: number): string {
  return `RWF ${new Intl.NumberFormat("en-US").format(n)}`;
}

/** Plan actually in force right now (expired paid plans fall back to free). */
export function effectivePlan(p?: { plan?: string | null; plan_expires_at?: string | null } | null): PlanKey {
  const plan = (p?.plan as PlanKey) ?? "free";
  if (plan === "free") return "free";
  const exp = p?.plan_expires_at ? new Date(p.plan_expires_at).getTime() : 0;
  return exp > Date.now() ? plan : "free";
}

export function planExpired(p?: { plan?: string | null; plan_expires_at?: string | null } | null): boolean {
  return (p?.plan ?? "free") !== "free" && effectivePlan(p) === "free";
}

export function isVerified(p?: { is_verified?: boolean | null; verified_expires_at?: string | null } | null): boolean {
  if (!p?.is_verified) return false;
  if (!p.verified_expires_at) return true;
  return new Date(p.verified_expires_at).getTime() > Date.now();
}

export function hasAnalytics(p?: { plan?: string | null; plan_expires_at?: string | null } | null): boolean {
  return effectivePlan(p) !== "free";
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
