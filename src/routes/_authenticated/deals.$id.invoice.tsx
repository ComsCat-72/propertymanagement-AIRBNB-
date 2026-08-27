import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DealDocument, DocHeader, DocRow } from "@/components/DealDocument";
import { commissionAmount, dealReference } from "@/lib/growth";
import { formatRwf } from "@/lib/plans";
import type { DealRow } from "./dashboard.deals";

export const Route = createFileRoute("/_authenticated/deals/$id/invoice")({
  head: () => ({ meta: [{ title: "Commission invoice | Ibyungura.com" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as DealRow | null;
    },
  });

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-10 text-center text-sm text-muted-foreground">Deal not found.</div>;

  const ref = data.reference || dealReference(data.id, data.closed_on);
  const commission = Math.round(commissionAmount(Number(data.deal_value), Number(data.commission_pct)));

  return (
    <DealDocument title="Commission invoice">
      <DocHeader
        right={
          <>
            <p className="text-lg font-bold">INVOICE</p>
            <p className="font-mono text-xs">{ref}</p>
            <p className="text-xs text-muted-foreground">Date {new Date().toLocaleDateString()}</p>
          </>
        }
      />

      <div className="grid gap-8 py-8 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">From</p>
          <p className="mt-1 font-semibold">{profile?.full_name || "Agent"}</p>
          {profile?.agency_name && <p className="text-sm text-muted-foreground">{profile.agency_name}</p>}
          {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
          {profile?.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bill to</p>
          <p className="mt-1 font-semibold">{data.client_name}</p>
          {data.client_contact && <p className="text-sm text-muted-foreground">{data.client_contact}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-border p-5">
        <DocRow label="Property" value={data.property_title} />
        <DocRow label="Location" value={data.property_location || "—"} />
        <DocRow label="Service" value={data.deal_type === "rent" ? "Rental brokerage" : "Sales brokerage"} />
        <DocRow label="Closing date" value={new Date(data.closed_on).toLocaleDateString()} />
        <DocRow label="Transaction value" value={formatRwf(Number(data.deal_value))} />
        <DocRow label={`Commission rate`} value={`${data.commission_pct}%`} />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-brand/10 px-6 py-4">
        <span className="font-semibold">Total due</span>
        <span className="numeric text-2xl font-bold text-brand">{formatRwf(commission)}</span>
      </div>

      {data.notes && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-1 whitespace-pre-line text-sm">{data.notes}</p>
        </div>
      )}

      <p className="mt-10 border-t border-border pt-4 text-[11px] text-muted-foreground">
        Generated on Ibyungura.com. Payment terms as agreed between the agent and the client.
      </p>
    </DealDocument>
  );
}
