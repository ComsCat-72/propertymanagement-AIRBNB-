import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, Building2, Award, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { isVerified } from "@/lib/plans";
import { cldUrl } from "@/lib/cloudinary";
import { formatPhone, whatsappLink } from "@/lib/phone";

export const Route = createFileRoute("/agents/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, agency_name, bio, profile_photo_url")
      .eq("id", params.id)
      .maybeSingle();
    return { seo: data as { full_name: string; agency_name: string | null; bio: string | null; profile_photo_url: string | null } | null };
  },
  head: ({ params, loaderData }) => {
    const s = loaderData?.seo;
    const url = `https://dwell-discover-dot.lovable.app/agents/${params.id}`;
    const title = s ? `${s.full_name} — Property Agent | LoyalityReal250` : "Property agent | LoyalityReal250";
    const raw = s
      ? `${s.full_name}${s.agency_name ? ` of ${s.agency_name}` : ""} is a property agent on LoyalityReal250. ${s.bio ?? "View their listings, achievements and contact details."}`.trim()
      : "View this LoyalityReal250 agent's profile, achievements and active property listings.";
    const description = raw.length > 157 ? `${raw.slice(0, 157)}…` : raw;
    const image = s?.profile_photo_url;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        ...(image?.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      ...(s
        ? {
            scripts: [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Person",
                  name: s.full_name,
                  jobTitle: "Property Agent",
                  description,
                  url,
                  ...(s.profile_photo_url ? { image: s.profile_photo_url } : {}),
                  ...(s.agency_name
                    ? { worksFor: { "@type": "Organization", name: s.agency_name } }
                    : {}),
                }),
              },
            ],
          }
        : {}),
    };
  },
  component: AgentDetail,
});

const LISTING_PAGE_SIZE = 6;

function AgentDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["agent", id],
    queryFn: async () => {
      const { data: agent } = await supabase
        .from("profiles")
        .select("id, full_name, agency_name, bio, profile_photo_url, achievements, phone, status, is_verified, verified_expires_at")
        .eq("id", id)
        .maybeSingle();
      return { agent };
    },
  });

  const {
    data: listingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listingsLoading,
  } = useInfiniteQuery({
    queryKey: ["agent-listings", id],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number;
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("agent_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(from, from + LISTING_PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as unknown as PropertyCardData[];
      return { rows, nextFrom: rows.length === LISTING_PAGE_SIZE ? from + LISTING_PAGE_SIZE : null };
    },
    getNextPageParam: (last) => last.nextFrom,
  });
  const listings = (listingsData?.pages ?? []).flatMap((p) => p.rows);

  useEffect(() => {
    const channel = supabase
      .channel(`agent-${id}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table: "properties", filter: `agent_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["agent-listings", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["agent", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, qc]);

  if (!data?.agent) return <SiteShell><div className="p-10">Agent not found.</div></SiteShell>;
  const a = data.agent;
  const waLink = whatsappLink(a.phone, `Hi ${a.full_name}, I found your profile on Ibyungura.com and would like to chat.`);

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-border bg-card p-8 md:flex-row md:items-center">
          {a.profile_photo_url ? (
            <img src={cldUrl(a.profile_photo_url, 320)} alt="" className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <span className="grid h-28 w-28 place-items-center rounded-full bg-brand text-3xl font-bold text-brand-foreground">{a.full_name.charAt(0) || "A"}</span>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{a.full_name}</h1>
              {isVerified(a) && <VerifiedBadge />}
            </div>
            {a.agency_name && <p className="mt-1 text-muted-foreground">{a.agency_name}</p>}
            {a.bio && <p className="mt-3 max-w-2xl text-sm">{a.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {a.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-brand" /> {formatPhone(a.phone)}</span>}
              {a.agency_name && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-brand" /> {a.agency_name}</span>}
            </div>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#20b357]">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            )}
          </div>
        </div>

        {(a as { achievements?: string }).achievements && (
          <div className="mt-6 rounded-3xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Award className="h-5 w-5 text-gold" /> Achievements</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{(a as { achievements: string }).achievements}</p>
          </div>
        )}

        <h2 className="mt-10 text-2xl font-bold">Listings by {a.full_name}</h2>
        {listingsLoading ? (
          <p className="mt-4 text-muted-foreground">Loading listings…</p>
        ) : listings.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No active listings.</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((p) => (
                <PropertyCard
                  key={p.id}
                  p={{ ...p, agent: { id: a.id, full_name: a.full_name, profile_photo_url: a.profile_photo_url, phone: a.phone, is_verified: a.is_verified, verified_expires_at: a.verified_expires_at } }}
                />
              ))}
            </div>
            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="rounded-full"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </SiteShell>
  );
}