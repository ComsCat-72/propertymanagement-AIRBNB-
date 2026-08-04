import { supabase } from "@/integrations/supabase/client";
import type { PlanKey } from "@/lib/plans";

export type MonetizationEventType =
  | "listing_created"
  | "tier_upgrade"
  | "tier_downgrade"
  | "plan_renewed"
  | "badge_activated"
  | "badge_requested"
  | "upgrade_requested"
  | "subscription_cancelled"
  | "quota_reached";

export const EVENT_LABELS: Record<string, string> = {
  listing_created: "Listing created",
  tier_upgrade: "Tier upgrade",
  tier_downgrade: "Plan downgrade",
  plan_renewed: "Plan renewed",
  badge_activated: "Verified badge activated",
  badge_requested: "Verified badge requested",
  upgrade_requested: "Upgrade requested",
  subscription_cancelled: "Subscription cancelled",
  quota_reached: "Quota reached",
};

export interface MonetizationEvent {
  id: string;
  agent_id: string;
  event_type: MonetizationEventType | string;
  plan: PlanKey | null;
  amount_rwf: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Records a monetization event for the signed-in agent. Never throws. */
export async function logEvent(
  agentId: string,
  eventType: MonetizationEventType,
  opts: { plan?: PlanKey | null; amountRwf?: number; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    await supabase.from("monetization_events").insert({
      agent_id: agentId,
      event_type: eventType,
      plan: opts.plan ?? null,
      amount_rwf: opts.amountRwf ?? 0,
      metadata: opts.metadata ?? {},
    } as never);
  } catch {
    /* analytics must never break a user flow */
  }
}
