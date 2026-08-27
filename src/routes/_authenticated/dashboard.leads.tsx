import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flame, Lock, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRwf } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard/leads")({
  component: LeadsPage,
});

interface LeadRow {
  id: string; summary: string; category: string; city: string; listing_type: string;
  budget_min: number | null; budget_max: number | null; score: number; price_rwf: number;
  max_sales: number; sold_count: number; status: string; last_active_at: string;
}
interface PurchaseRow { id: string; lead_id: string; status: string; amount_rwf: number; admin_note: string }
interface Contact { name: string; phone: string; email: string }

function LeadsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [target, setTarget] = useState<LeadRow | null>(null);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});

  const leads = useQuery({
    queryKey: ["buyer-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyer_leads")
        .select("id, summary, category, city, listing_type, budget_min, budget_max, score, price_rwf, max_sales, sold_count, status, last_active_at")
        .order("score", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LeadRow[];
    },
  });

  const purchases = useQuery({
    queryKey: ["my-lead-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_purchases").select("id, lead_id, status, amount_rwf, admin_note").eq("agent_id", user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as PurchaseRow[];
    },
  });

  const purchaseFor = (leadId: string) => (purchases.data ?? []).find((p) => p.lead_id === leadId);

  const request = async () => {
    if (!user || !target) return;
    setSaving(true);
    const { error } = await supabase.from("lead_purchases").insert({
      lead_id: target.id, agent_id: user.id, amount_rwf: target.price_rwf, payment_reference: reference.trim(),
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request sent — contact details unlock once an admin confirms the payment");
    setTarget(null); setReference("");
    void qc.invalidateQueries({ queryKey: ["my-lead-purchases", user.id] });
  };

  const reveal = async (leadId: string) => {
    const { data, error } = await supabase.rpc("lead_contact", { _lead_id: leadId });
    if (error) { toast.error(error.message); return; }
    const row = (data ?? [])[0] as Contact | undefined;
    if (!row) { toast.error("Contact details are not unlocked yet"); return; }
    setContacts((c) => ({ ...c, [leadId]: row }));
  };

  const rows = (leads.data ?? []).filter((l) => l.status !== "retired");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gold/40 bg-gold/5 p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/20 text-gold"><Flame className="h-5 w-5" /></span>
          <div>
            <h2 className="text-xl font-bold">Leads Club</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified buyers who are actively saving and contacting listings on Ibyungura.com. Each lead is sold to a maximum of
              three agents, so competition stays fair. Buy the lead to unlock the buyer's name and phone number.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((l) => {
          const p = purchaseFor(l.id);
          const unlocked = p?.status === "approved";
          const contact = contacts[l.id];
          return (
            <div key={l.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{l.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last active {new Date(l.last_active_at).toLocaleDateString()} · {l.sold_count}/{l.max_sales} agents have this lead
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold">Score {l.score}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {l.category && <Tag>{l.category}</Tag>}
                {l.city && <Tag>{l.city}</Tag>}
                {l.listing_type && <Tag>{l.listing_type === "rent" ? "Renting" : "Buying"}</Tag>}
                {l.budget_max ? <Tag>Up to {formatRwf(Number(l.budget_max))}</Tag> : null}
              </div>

              <div className="mt-4">
                {unlocked ? (
                  contact ? (
                    <div className="space-y-1 rounded-2xl bg-brand/5 p-3 text-sm">
                      <p className="font-semibold">{contact.name || "Buyer"}</p>
                      {contact.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{contact.phone}</p>}
                      {contact.email && <p className="flex items-center gap-1.5 break-all"><Mail className="h-3.5 w-3.5" />{contact.email}</p>}
                    </div>
                  ) : (
                    <Button onClick={() => void reveal(l.id)} className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">Show contact details</Button>
                  )
                ) : p?.status === "pending" ? (
                  <p className="rounded-full bg-gold/10 px-4 py-2 text-center text-xs font-semibold text-gold">Payment awaiting admin confirmation</p>
                ) : p?.status === "rejected" ? (
                  <p className="rounded-full bg-destructive/10 px-4 py-2 text-center text-xs font-semibold text-destructive">
                    Declined{p.admin_note ? ` — ${p.admin_note}` : ""}
                  </p>
                ) : l.status === "exhausted" ? (
                  <p className="rounded-full bg-muted px-4 py-2 text-center text-xs font-semibold text-muted-foreground">Sold out</p>
                ) : (
                  <Button onClick={() => setTarget(l)} variant="outline" className="w-full rounded-full">
                    <Lock className="mr-1.5 h-4 w-4" /> Unlock for {formatRwf(l.price_rwf)}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="md:col-span-2 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No leads available right now. New buyer leads appear as visitors browse and contact listings.
          </p>
        )}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Buy this lead</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send <strong className="text-foreground">{target ? formatRwf(target.price_rwf) : ""}</strong> by Mobile Money and paste
            the reference. Contact details unlock as soon as an admin confirms it.
          </p>
          <div className="space-y-2">
            <Label htmlFor="lead-ref">Payment reference</Label>
            <Input id="lead-ref" value={reference} onChange={(e) => setReference(e.target.value)} className="rounded-full" placeholder="e.g. MoMo 123456789" />
          </div>
          <Button disabled={saving} onClick={request} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {saving ? "Sending…" : "Send request"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-muted px-2.5 py-1 font-medium capitalize text-muted-foreground">{children}</span>;
}
