import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";

export const Route = createFileRoute("/agents/$id")({
  component: AgentDetail,
});

function AgentDetail() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["agent", id],
    queryFn: async () => {
      const [{ data: agent }, { data: listings }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("properties").select("*").eq("agent_id", id).eq("status", "active").order("created_at", { ascending: false }),
      ]);
      return { agent, listings: (listings ?? []) as unknown as PropertyCardData[] };
    },
  });

  if (!data?.agent) return <SiteShell><div className="p-10">Agent not found.</div></SiteShell>;
  const a = data.agent;

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-border bg-card p-8 md:flex-row md:items-center">
          {a.profile_photo_url ? (
            <img src={a.profile_photo_url} alt="" className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <span className="grid h-28 w-28 place-items-center rounded-full bg-brand text-3xl font-bold text-brand-foreground">{a.full_name.charAt(0) || "A"}</span>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{a.full_name}</h1>
            {a.agency_name && <p className="mt-1 text-muted-foreground">{a.agency_name}</p>}
            {a.bio && <p className="mt-3 max-w-2xl text-sm">{a.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {a.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-brand" /> {a.phone}</span>}
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-brand" /> {a.email}</span>
              {a.address && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand" /> {a.address}</span>}
              {a.agency_name && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-brand" /> {a.agency_name}</span>}
            </div>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-bold">Listings by {a.full_name}</h2>
        {data.listings.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No active listings.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.listings.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </SiteShell>
  );
}