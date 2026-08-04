import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CircleCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { logEvent } from "@/lib/events";
import {
  BADGE_PRICE_RWF, GRACE_DAYS, effectivePlan, formatRwf, graceEndsAt, isVerified,
  maxListings, planStatus, type PlanKey, type PlanLimit,
} from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { user, profile, refresh } = useAuth();
  const qc = useQueryClient();
  const [target, setTarget] = useState<PlanKey | null>(null);
  const [wantsBadge, setWantsBadge] = useState(false);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: limits } = useQuery({
    queryKey: ["plan-limits"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_limits").select("*").order("sort_order");
      return (data ?? []) as unknown as PlanLimit[];
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["my-upgrade-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("upgrade_requests")
        .select("*")
        .eq("agent_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: usedCount } = useQuery({
    queryKey: ["my-listing-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("properties").select("*", { count: "exact", head: true }).eq("agent_id", user!.id);
      return count ?? 0;
    },
  });

  const plan = effectivePlan(profile);
  const cap = maxListings(plan, limits);
  const verified = isVerified(profile);
  const pending = (requests ?? []).find((r) => r.status === "pending");
  const status = planStatus(profile);
  const graceEnd = graceEndsAt(profile);
  const cancelScheduled = !!profile?.cancel_at_period_end && status !== "free";
  const used = usedCount ?? 0;
  const remaining = cap === null ? null : Math.max(0, cap - used);

  const amount = (() => {
    const base = (limits ?? []).find((l) => l.plan === target)?.price_rwf ?? 0;
    return base + (wantsBadge ? BADGE_PRICE_RWF : 0);
  })();

  const submit = async () => {
    if (!user || !target) return;
    setSaving(true);
    const { error } = await supabase.from("upgrade_requests").insert({
      agent_id: user.id,
      requested_plan: target,
      wants_badge: wantsBadge,
      amount_rwf: amount,
      payment_reference: reference.trim(),
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await logEvent(user.id, wantsBadge && target === plan ? "badge_requested" : "upgrade_requested", {
      plan: target, amountRwf: amount, metadata: { wants_badge: wantsBadge },
    });
    setSent(true);
    qc.invalidateQueries({ queryKey: ["my-upgrade-requests"] });
    refresh();
  };

  const closeRequestDialog = () => {
    setTarget(null); setWantsBadge(false); setReference(""); setSent(false);
  };

  const setCancellation = async (cancel: boolean) => {
    if (!user) return;
    setCancelling(true);
    const { error } = await supabase.from("profiles").update({ cancel_at_period_end: cancel } as never).eq("id", user.id);
    setCancelling(false);
    if (error) { toast.error(error.message); return; }
    if (cancel) await logEvent(user.id, "subscription_cancelled", { plan, metadata: { at_period_end: true } });
    setCancelOpen(false);
    toast.success(cancel ? "Subscription set to end on your renewal date." : "Subscription renewal restored.");
    refresh();
  };

  return (
    <div className="space-y-8">
      {status === "grace" && (
        <div className="rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm">
          <strong className="font-semibold">Grace period — {GRACE_DAYS} days.</strong> Your plan lapsed, so analytics and other
          advanced features are paused, but you keep your full listing allowance until{" "}
          {graceEnd?.toLocaleDateString()}. Renew before then to avoid dropping to the Free limit.
        </div>
      )}
      {status === "expired" && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-3 text-sm">
          <strong className="font-semibold">Your subscription has expired.</strong> The grace period is over — your listings are
          still live, but you're back on the Free limit and advanced features are locked. Subscribe again to add more listings.
        </div>
      )}
      {cancelScheduled && status !== "expired" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted px-5 py-3 text-sm">
          <span>
            <strong className="font-semibold">Cancellation scheduled.</strong> Your plan will not renew
            {profile?.plan_expires_at ? ` after ${new Date(profile.plan_expires_at).toLocaleDateString()}` : ""}.
          </span>
          <Button size="sm" variant="outline" className="ml-auto rounded-full" disabled={cancelling} onClick={() => setCancellation(false)}>
            Keep my subscription
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current plan</p>
          <p className="mt-2 text-2xl font-bold capitalize">{(limits ?? []).find((l) => l.plan === plan)?.label ?? plan}</p>
          <p className="mt-1 text-xs font-semibold capitalize text-muted-foreground">
            {status === "active" ? "Active" : status === "grace" ? "In grace period" : status === "expired" ? "Expired" : "Free plan"}
          </p>
          {profile?.plan_expires_at && plan !== "free" && (
            <p className="mt-1 text-xs text-muted-foreground">Renews / expires {new Date(profile.plan_expires_at).toLocaleDateString()}</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Quota remaining</p>
          <p className="mt-2 text-2xl font-bold">{remaining === null ? "Unlimited" : `${remaining} left`}</p>
          <p className="mt-1 text-xs text-muted-foreground">{used}{cap === null ? " listings" : ` of ${cap} used`}</p>
          {cap !== null && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (used / cap) * 100)}%` }} />
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Verified badge</p>
          <div className="mt-2">{verified ? <VerifiedBadge /> : <span className="text-2xl font-bold">Not active</span>}</div>
          {verified && profile?.verified_expires_at && (
            <p className="mt-1 text-xs text-muted-foreground">Until {new Date(profile.verified_expires_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {status !== "free" && !cancelScheduled && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            Cancelling keeps your plan until the current period ends — nothing is removed before then.
          </span>
          <Button variant="outline" size="sm" className="ml-auto rounded-full text-destructive" onClick={() => setCancelOpen(true)}>
            Cancel subscription
          </Button>
        </div>
      )}

      {pending && (
        <div className="rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm">
          <strong className="font-semibold">Upgrade request pending.</strong> You requested{" "}
          {(limits ?? []).find((l) => l.plan === pending.requested_plan)?.label ?? pending.requested_plan}
          {pending.wants_badge ? " + verified badge" : ""} for {formatRwf(pending.amount_rwf)}. An admin will activate it once payment is confirmed.
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold">Plans</h2>
        <p className="text-sm text-muted-foreground">Pay by mobile money, then request the upgrade with your payment reference.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(limits ?? []).map((l) => (
            <div key={l.plan} className={`rounded-3xl border p-6 ${l.plan === plan ? "border-brand bg-brand/5" : "border-border bg-card"}`}>
              <p className="text-sm font-semibold text-muted-foreground">{l.label}</p>
              <p className="mt-1 text-3xl font-bold">{l.price_rwf === 0 ? "Free" : formatRwf(l.price_rwf)}</p>
              {l.price_rwf > 0 && <p className="text-xs text-muted-foreground">per month</p>}
              <ul className="mt-4 space-y-2 text-sm">
                {l.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{perk}</li>
                ))}
              </ul>
              {l.plan === plan ? (
                <p className="mt-5 text-center text-sm font-semibold text-brand">Current plan</p>
              ) : l.plan === "free" ? null : (
                <Button
                  className="mt-5 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={!!pending}
                  onClick={() => { setTarget(l.plan); setWantsBadge(false); }}
                >
                  {pending ? "Request pending" : "Request upgrade"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-gold/40 bg-gold/5 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-gold" /> Verified badge</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatRwf(BADGE_PRICE_RWF)} per month. Verified agents get a badge on their profile and cards, and their listings appear first in search results.
        </p>
        {!verified && (
          <Button
            variant="outline"
            className="mt-4 rounded-full"
            disabled={!!pending}
            onClick={() => { setTarget(plan === "free" ? "free" : plan); setWantsBadge(true); }}
          >
            Request verified badge
          </Button>
        )}
      </div>

      {(requests ?? []).length > 0 && (
        <div>
          <h2 className="text-xl font-bold">Request history</h2>
          <div className="mt-3 space-y-2">
            {(requests ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                <span className="font-semibold capitalize">{r.requested_plan}{r.wants_badge ? " + badge" : ""}</span>
                <span className="text-muted-foreground">{formatRwf(r.amount_rwf)}</span>
                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "approved" ? "bg-brand/10 text-brand" : r.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
                {r.admin_note && <span className="w-full text-xs text-muted-foreground">Note: {r.admin_note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => { if (!o) closeRequestDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{sent ? "Request sent" : "Confirm your upgrade"}</DialogTitle></DialogHeader>
          {sent ? (
            <div className="space-y-4 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10">
                <CircleCheck className="h-6 w-6 text-brand" />
              </span>
              <p className="text-sm text-muted-foreground">
                We've sent your request for{" "}
                <strong className="text-foreground">{(limits ?? []).find((l) => l.plan === target)?.label ?? target}{wantsBadge ? " + verified badge" : ""}</strong>{" "}
                at {formatRwf(amount)}. An admin activates it for 30 days once your payment is confirmed.
              </p>
              <Button onClick={closeRequestDialog} className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">Done</Button>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-muted p-4 text-sm">
              <p className="font-semibold capitalize">
                {(limits ?? []).find((l) => l.plan === target)?.label ?? target}
                {wantsBadge ? " + verified badge" : ""}
              </p>
              <p className="mt-1 text-2xl font-bold">{formatRwf(amount)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
            </div>
            {target !== "free" && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={wantsBadge} onChange={(e) => setWantsBadge(e.target.checked)} />
                Add verified badge ({formatRwf(BADGE_PRICE_RWF)}/month)
              </label>
            )}
            <div>
              <Label>Payment reference (optional)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="MoMo transaction ID or phone used" />
            </div>
            <p className="text-xs text-muted-foreground">An admin reviews and activates your plan for 30 days once payment is confirmed.</p>
            <Button onClick={submit} disabled={saving} className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
              {saving ? "Sending…" : "Send request"}
            </Button>
          </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cancel your subscription?</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Your {(limits ?? []).find((l) => l.plan === plan)?.label ?? plan} plan stays active
              {profile?.plan_expires_at ? ` until ${new Date(profile.plan_expires_at).toLocaleDateString()}` : ""}. After that you
              get a {GRACE_DAYS}-day grace period where your listing allowance is kept but advanced features are paused, then you
              move to the Free limit. Existing listings are never deleted.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setCancelOpen(false)}>Keep plan</Button>
              <Button
                className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={cancelling}
                onClick={() => setCancellation(true)}
              >
                {cancelling ? "Cancelling…" : "Confirm cancellation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
