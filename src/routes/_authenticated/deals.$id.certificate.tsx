import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DealDocument, DocHeader } from "@/components/DealDocument";
import { dealReference } from "@/lib/growth";
import { formatRwf } from "@/lib/plans";
import type { DealRow } from "./dashboard.deals";

export const Route = createFileRoute("/_authenticated/deals/$id/certificate")({
  head: () => ({ meta: [{ title: "Deal certificate | Ibyungura.com" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CertificatePage,
});

function CertificatePage() {
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

  return (
    <DealDocument title="Deal closing certificate">
      <DocHeader right={<><p className="font-mono text-xs">{ref}</p><p className="text-xs text-muted-foreground">Issued {new Date().toLocaleDateString()}</p></>} />

      <div className="py-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Certificate of completion</p>
        <h2 className="mt-4 text-3xl font-bold">Deal successfully closed</h2>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          This certifies that <strong className="text-foreground">{profile?.full_name || "the agent"}</strong>
          {profile?.agency_name ? <> of <strong className="text-foreground">{profile.agency_name}</strong></> : null} successfully
          completed the {data.deal_type === "rent" ? "rental" : "sale"} of{" "}
          <strong className="text-foreground">{data.property_title}</strong>
          {data.property_location ? <> in {data.property_location}</> : null} with{" "}
          <strong className="text-foreground">{data.client_name}</strong> on{" "}
          <strong className="text-foreground">{new Date(data.closed_on).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</strong>.
        </p>
        <p className="numeric mt-8 text-2xl font-bold text-brand">{formatRwf(Number(data.deal_value))}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Transaction value</p>
      </div>

      <div className="grid grid-cols-2 gap-10 border-t border-border pt-10 text-sm">
        <div>
          <div className="h-12 border-b border-foreground/40" />
          <p className="mt-2 font-semibold">{profile?.full_name || "Agent"}</p>
          <p className="text-xs text-muted-foreground">Agent signature</p>
        </div>
        <div>
          <div className="h-12 border-b border-foreground/40" />
          <p className="mt-2 font-semibold">{data.client_name}</p>
          <p className="text-xs text-muted-foreground">Client signature</p>
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Verify this certificate at ibyungura.com using reference {ref}.
      </p>
    </DealDocument>
  );
}
