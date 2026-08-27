import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BOOST_OPTIONS, type BoostOption } from "@/lib/growth";
import { formatRwf } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard/boosts")({
  component: BoostsPage,
});

interface BoostRow {
  id: string;
  property_id: string;
  days: number;
  amount_rwf: number;
  status: string;
  admin_note: string;
  payment_reference: string;
  ends_at: string | null;
  created_at: string;
}

function BoostsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [propertyId, setPropertyId] = useState("");
  const [option, setOption] = useState<BoostOption>(BOOST_OPTIONS[1]);
  const [reference, setReference] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const listings = useQuery({
    queryKey: ["boostable-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, city, is_featured, status")
        .eq("agent_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const boosts = useQuery({
    queryKey: ["my-boosts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_boosts")
        .select("id, property_id, days, amount_rwf, status, admin_note, payment_reference, ends_at, created_at")
        .eq("agent_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BoostRow[];
    },
  });

  const titleOf = (id: string) => listings.data?.find((l) => l.id === id)?.title ?? "Listing";

  const submit = async () => {
    if (!user || !propertyId) { toast.error("Pick a listing to boost"); return; }
    setSaving(true);
    const { error } = await supabase.from("listing_boosts").insert({
      agent_id: user.id,
      property_id: propertyId,
      days: option.days,
      amount_rwf: option.price_rwf,
      payment_reference: reference.trim(),
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Boost requested — an admin will confirm your payment");
    setOpen(false);
    setReference("");
    void qc.invalidateQueries({ queryKey: ["my-boosts", user.id] });
  };

  const active = (boosts.data ?? []).filter((b) => b.status === "approved" && b.ends_at && new Date(b.ends_at) > new Date());

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-gold/40 bg-gold/5 p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/20 text-gold"><Rocket className="h-5 w-5" /></span>
          <div>
            <h2 className="text-xl font-bold">Boost a listing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Boosted listings appear first on the homepage and in search results, with a Featured tag. Charge the owner for it —
              you keep the difference.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {BOOST_OPTIONS.map((o) => (
            <button
              key={o.days}
              onClick={() => setOption(o)}
              className={`rounded-2xl border p-4 text-left transition ${option.days === o.days ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"}`}
            >
              <p className="font-bold">{o.label}</p>
              <p className="numeric mt-1 text-lg font-bold text-brand">{formatRwf(o.price_rwf)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{o.blurb}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="boost-listing">Listing</Label>
            <select
              id="boost-listing"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="mt-1 h-11 w-full rounded-full border border-border bg-background px-4 text-sm"
            >
              <option value="">Choose a listing…</option>
              {(listings.data ?? []).map((l) => (
                <option key={l.id} value={l.id}>{l.title} — {l.city}</option>
              ))}
            </select>
          </div>
          <Button className="h-11 rounded-full bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setOpen(true)}>
            Boost for {formatRwf(option.price_rwf)}
          </Button>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold">Active boosts ({active.length})</h3>
        <div className="mt-3 space-y-2">
          {active.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4 text-sm">
              <span className="font-semibold">{titleOf(b.property_id)}</span>
              <span className="text-muted-foreground">{b.days} days</span>
              <span className="ml-auto text-xs text-muted-foreground">Ends {b.ends_at ? new Date(b.ends_at).toLocaleDateString() : "—"}</span>
            </div>
          ))}
          {active.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No listing is boosted right now.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold">Boost history</h3>
        <div className="mt-3 space-y-2">
          {(boosts.data ?? []).map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
              <span className="font-semibold">{titleOf(b.property_id)}</span>
              <span className="text-muted-foreground">{b.days} days · {formatRwf(b.amount_rwf)}</span>
              {b.payment_reference && <span className="font-mono text-xs text-muted-foreground">{b.payment_reference}</span>}
              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${b.status === "approved" ? "bg-brand/10 text-brand" : b.status === "pending" ? "bg-gold/15 text-gold" : "bg-destructive/10 text-destructive"}`}>{b.status}</span>
              {b.admin_note && <span className="w-full text-xs text-muted-foreground">Note: {b.admin_note}</span>}
            </div>
          ))}
          {(boosts.data ?? []).length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">You haven't boosted a listing yet.</p>
          )}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Confirm your boost</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send <strong className="text-foreground">{formatRwf(option.price_rwf)}</strong> by Mobile Money, then paste the
            transaction reference below. An admin activates the boost once the payment is confirmed.
          </p>
          <div className="space-y-2">
            <Label htmlFor="boost-ref">Payment reference</Label>
            <Input id="boost-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. MoMo 123456789" className="rounded-full" />
          </div>
          <Button disabled={saving} onClick={submit} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {saving ? "Sending…" : "Send boost request"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
