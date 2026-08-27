import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, FileText, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { commissionAmount, dealReference } from "@/lib/growth";
import { formatRwf } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard/deals")({
  component: DealsPage,
});

export interface DealRow {
  id: string;
  agent_id: string;
  property_id: string | null;
  property_title: string;
  property_location: string;
  deal_type: string;
  client_name: string;
  client_contact: string;
  deal_value: number;
  commission_pct: number;
  closed_on: string;
  reference: string;
  notes: string;
}

const EMPTY = {
  property_id: "",
  property_title: "",
  property_location: "",
  deal_type: "sale",
  client_name: "",
  client_contact: "",
  deal_value: "",
  commission_pct: "3",
  closed_on: new Date().toISOString().slice(0, 10),
  notes: "",
};

function DealsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [showCount, setShowCount] = useState(false);

  useQuery({
    queryKey: ["deal-count-pref", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("show_deal_count").eq("id", user!.id).maybeSingle();
      setShowCount(!!data?.show_deal_count);
      return data ?? null;
    },
  });

  const listings = useQuery({
    queryKey: ["deal-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, title, city, location, property_type, price").eq("agent_id", user!.id);
      return data ?? [];
    },
  });

  const deals = useQuery({
    queryKey: ["my-deals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").eq("agent_id", user!.id).order("closed_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DealRow[];
    },
  });

  const pickListing = (id: string) => {
    const l = listings.data?.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      property_id: id,
      property_title: l?.title ?? f.property_title,
      property_location: l ? [l.location, l.city].filter(Boolean).join(", ") : f.property_location,
      deal_type: l?.property_type ?? f.deal_type,
      deal_value: l ? String(l.price) : f.deal_value,
    }));
  };

  const save = async () => {
    if (!user) return;
    if (!form.property_title.trim() || !form.client_name.trim()) {
      toast.error("Property title and client name are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("deals").insert({
      agent_id: user.id,
      property_id: form.property_id || null,
      property_title: form.property_title.trim(),
      property_location: form.property_location.trim(),
      deal_type: form.deal_type,
      client_name: form.client_name.trim(),
      client_contact: form.client_contact.trim(),
      deal_value: Number(form.deal_value) || 0,
      commission_pct: Number(form.commission_pct) || 0,
      closed_on: form.closed_on,
      notes: form.notes.trim(),
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deal recorded");
    setOpen(false);
    setForm({ ...EMPTY });
    void qc.invalidateQueries({ queryKey: ["my-deals", user.id] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("deals").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["my-deals", user?.id] });
  };

  const toggleCount = async (v: boolean) => {
    if (!user) return;
    setShowCount(v);
    const { error } = await supabase.from("profiles").update({ show_deal_count: v } as never).eq("id", user.id);
    if (error) { toast.error(error.message); setShowCount(!v); }
  };

  const rows = deals.data ?? [];
  const totalValue = rows.reduce((s, d) => s + Number(d.deal_value), 0);
  const totalCommission = rows.reduce((s, d) => s + commissionAmount(Number(d.deal_value), Number(d.commission_pct)), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Deals closed" value={String(rows.length)} />
        <Stat label="Total value" value={formatRwf(totalValue)} />
        <Stat label="Your commission" value={formatRwf(Math.round(totalCommission))} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showCount} onChange={(e) => void toggleCount(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--brand))]" />
          Show my closed-deal count publicly on my profile
        </label>
        <Button onClick={() => setOpen(true)} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="mr-1.5 h-4 w-4" /> Record a deal
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((d) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{d.property_title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {d.property_location || "—"} · {d.client_name} · {new Date(d.closed_on).toLocaleDateString()}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{d.reference || dealReference(d.id, d.closed_on)}</p>
              </div>
              <div className="text-right">
                <p className="numeric font-bold">{formatRwf(Number(d.deal_value))}</p>
                <p className="text-xs text-muted-foreground">
                  {d.commission_pct}% = {formatRwf(Math.round(commissionAmount(Number(d.deal_value), Number(d.commission_pct))))}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/deals/$id/certificate" params={{ id: d.id }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                <Award className="h-3.5 w-3.5" /> Certificate
              </Link>
              <Link to="/deals/$id/invoice" params={{ id: d.id }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                <FileText className="h-3.5 w-3.5" /> Invoice
              </Link>
              <button onClick={() => void remove(d.id)} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No deals recorded yet. Add one to generate a closing certificate and a professional invoice.
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader><DialogTitle>Record a closed deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="deal-listing">Link one of your listings (optional)</Label>
              <select id="deal-listing" value={form.property_id} onChange={(e) => pickListing(e.target.value)} className="mt-1 h-11 w-full rounded-full border border-border bg-background px-4 text-sm">
                <option value="">Not linked</option>
                {(listings.data ?? []).map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
            <Field label="Property title" value={form.property_title} onChange={(v) => setForm({ ...form, property_title: v })} />
            <Field label="Location" value={form.property_location} onChange={(v) => setForm({ ...form, property_location: v })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="deal-type">Deal type</Label>
                <select id="deal-type" value={form.deal_type} onChange={(e) => setForm({ ...form, deal_type: e.target.value })} className="mt-1 h-11 w-full rounded-full border border-border bg-background px-4 text-sm">
                  <option value="sale">Sale</option>
                  <option value="rent">Rental</option>
                </select>
              </div>
              <Field label="Closing date" type="date" value={form.closed_on} onChange={(v) => setForm({ ...form, closed_on: v })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Client name" value={form.client_name} onChange={(v) => setForm({ ...form, client_name: v })} />
              <Field label="Client phone / email" value={form.client_contact} onChange={(v) => setForm({ ...form, client_contact: v })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Deal value (RWF)" type="number" value={form.deal_value} onChange={(v) => setForm({ ...form, deal_value: v })} />
              <Field label="Commission %" type="number" value={form.commission_pct} onChange={(v) => setForm({ ...form, commission_pct: v })} />
            </div>
            <div>
              <Label htmlFor="deal-notes">Notes (shown on the invoice)</Label>
              <Textarea id="deal-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 rounded-2xl" rows={3} />
            </div>
            <Button disabled={saving} onClick={save} className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
              {saving ? "Saving…" : "Save deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="numeric mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const id = `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 rounded-full" />
    </div>
  );
}
