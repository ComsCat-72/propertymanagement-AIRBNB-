import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Bell, BellOff, CalendarClock, MessageCircle, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { AgentAssistant } from "@/components/AgentAssistant";
import { AgentReviews } from "@/components/AgentReviews";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cldUrl } from "@/lib/cloudinary";
import { isVerified } from "@/lib/plans";
import { whatsappLink } from "@/lib/phone";
import { useAuth } from "@/lib/auth";
import { buildSlots, WEEKDAYS, type SlotRule } from "@/lib/growth";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/agent/$slug")({
  loader: async ({ params }) => {
    const { data: page } = await supabase
      .from("agent_pages")
      .select("agent_id, slug, tagline, banner_url, ai_chat_enabled, viewings_enabled, slot_minutes")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!page) return { page: null, agent: null };
    const { data: agent } = await supabase
      .from("profiles")
      .select("id, full_name, agency_name, bio, profile_photo_url, phone, is_verified, verified_expires_at, achievements, show_deal_count, deals_closed, specializations")
      .eq("id", page.agent_id)
      .maybeSingle();
    return { page, agent };
  },
  head: ({ params, loaderData }) => {
    const a = loaderData?.agent as { full_name?: string; bio?: string | null; profile_photo_url?: string | null } | null;
    const url = `${SITE_URL}/agent/${params.slug}`;
    const title = a?.full_name ? `${a.full_name} — Property agent in Rwanda | Ibyungura.com` : "Agent page | Ibyungura.com";
    const raw = a?.bio?.trim() || `Browse listings, ask questions and book a viewing with ${a?.full_name ?? "this agent"} on Ibyungura.com.`;
    const description = raw.length > 157 ? `${raw.slice(0, 157)}…` : raw;
    const img = a?.profile_photo_url;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(img?.startsWith("https://") ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: AgentProPage,
});

const PROPERTY_SELECT =
  "id, title, city, location, price, property_type, category, bedrooms, bathrooms, area_sqm, images, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url, phone, is_verified, verified_expires_at)";

function AgentProPage() {
  const { page, agent } = Route.useLoaderData() as {
    page: { agent_id: string; slug: string; tagline: string; banner_url: string; ai_chat_enabled: boolean; viewings_enabled: boolean; slot_minutes: number } | null;
    agent: {
      id: string; full_name: string; agency_name: string | null; bio: string | null; profile_photo_url: string | null;
      phone: string | null; is_verified: boolean | null; verified_expires_at: string | null; achievements: string | null;
      show_deal_count: boolean | null; deals_closed: number | null; specializations: string[] | null;
    } | null;
  };
  const { user } = useAuth();
  const qc = useQueryClient();

  const listings = useQuery({
    queryKey: ["agent-page-listings", page?.agent_id],
    enabled: !!page,
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("agent_id", page!.agent_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(24);
      return (data ?? []) as unknown as PropertyCardData[];
    },
  });

  const subscription = useQuery({
    queryKey: ["my-subscription", page?.agent_id, user?.id],
    enabled: !!page && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_subscriptions")
        .select("id")
        .eq("agent_id", page!.agent_id)
        .eq("subscriber_id", user!.id)
        .maybeSingle();
      return data ?? null;
    },
  });

  if (!page || !agent) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">This agent page doesn't exist</h1>
          <p className="mt-2 text-muted-foreground">The address may have changed.</p>
          <Link to="/agents" search={{ q: "", city: "", agency: "" }} className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 font-semibold text-brand-foreground">
            Browse all agents
          </Link>
        </div>
      </SiteShell>
    );
  }

  const verified = isVerified(agent);
  const wa = whatsappLink(agent.phone, `Hi ${agent.full_name}, I found your page on Ibyungura.com.`);

  const toggleFollow = async () => {
    if (!user) { toast.info("Sign in to follow this agent"); return; }
    if (subscription.data) {
      await supabase.from("agent_subscriptions").delete().eq("id", subscription.data.id);
      toast.success("You will no longer get alerts");
    } else {
      const { error } = await supabase.from("agent_subscriptions").insert({
        agent_id: page.agent_id, subscriber_id: user.id,
      } as never);
      if (error) { toast.error(error.message); return; }
      toast.success("You'll be notified about new listings");
    }
    void qc.invalidateQueries({ queryKey: ["my-subscription", page.agent_id, user.id] });
  };

  return (
    <SiteShell>
      <div className="relative h-48 w-full overflow-hidden bg-navy sm:h-64">
        {page.banner_url && <img src={cldUrl(page.banner_url, 1600)} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="mx-auto max-w-[1100px] px-6 pb-16 lg:px-10">
        <div className="-mt-14 flex flex-wrap items-end gap-5">
          {agent.profile_photo_url ? (
            <img src={cldUrl(agent.profile_photo_url, 256)} alt={agent.full_name} className="h-28 w-28 rounded-3xl border-4 border-background object-cover" />
          ) : (
            <span className="grid h-28 w-28 place-items-center rounded-3xl border-4 border-background bg-brand text-3xl font-bold text-brand-foreground">
              {agent.full_name.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{agent.full_name}</h1>
              {verified && <VerifiedBadge />}
            </div>
            <p className="text-sm text-muted-foreground">{agent.agency_name || "Independent agent"}</p>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            <Button onClick={() => void toggleFollow()} variant={subscription.data ? "outline" : "default"} className="rounded-full">
              {subscription.data ? <><BellOff className="mr-1.5 h-4 w-4" /> Following</> : <><Bell className="mr-1.5 h-4 w-4" /> Follow</>}
            </Button>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {page.tagline && <p className="mt-6 max-w-2xl text-lg">{page.tagline}</p>}
        {agent.bio && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{agent.bio}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          {(agent.specializations ?? []).map((s) => (
            <span key={s} className="rounded-full bg-muted px-3 py-1 font-medium">{s}</span>
          ))}
          {agent.show_deal_count && (agent.deals_closed ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 font-semibold text-gold">
              <Trophy className="h-3.5 w-3.5" /> {agent.deals_closed} deals closed
            </span>
          )}
          {verified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand">
              <BadgeCheck className="h-3.5 w-3.5" /> Identity verified
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-xl font-bold">Listings ({(listings.data ?? []).length})</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {(listings.data ?? []).map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
            {(listings.data ?? []).length === 0 && (
              <p className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No active listings right now.</p>
            )}

            <div className="mt-10">
              <AgentReviews agentId={agent.id} />
            </div>
          </div>

          <aside className="space-y-6">
            {page.ai_chat_enabled && (
              <AgentAssistant
                agentName={agent.full_name}
                agentBio={agent.bio ?? ""}
                listings={(listings.data ?? []).map((l) => ({
                  title: l.title, city: l.city, location: l.location, price: l.price,
                  property_type: l.property_type, category: l.category,
                  bedrooms: l.bedrooms, bathrooms: l.bathrooms, area_sqm: l.area_sqm,
                }))}
              />
            )}
            {page.viewings_enabled && (
              <ViewingBooker agentId={agent.id} slotMinutes={page.slot_minutes} listings={listings.data ?? []} />
            )}
            {agent.achievements && (
              <div className="rounded-3xl border border-border bg-card p-5">
                <h3 className="font-bold">Achievements</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{agent.achievements}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

function ViewingBooker({ agentId, slotMinutes, listings }: { agentId: string; slotMinutes: number; listings: PropertyCardData[] }) {
  const { user, profile } = useAuth();
  const [chosen, setChosen] = useState<Date | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const rules = useQuery({
    queryKey: ["agent-slots", agentId],
    queryFn: async () => {
      const { data } = await supabase.from("viewing_slots").select("weekday, start_minute, end_minute").eq("agent_id", agentId);
      return (data ?? []) as unknown as SlotRule[];
    },
  });

  const taken = useQuery({
    queryKey: ["agent-taken-slots", agentId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("viewing_bookings")
        .select("starts_at")
        .eq("agent_id", agentId)
        .gte("starts_at", new Date().toISOString());
      return (data ?? []).map((b) => b.starts_at as string);
    },
  });

  const days = buildSlots(rules.data ?? [], slotMinutes || 30, 14, taken.data ?? []);

  const book = async () => {
    if (!user) { toast.info("Sign in to book a viewing"); return; }
    if (!chosen) return;
    setSaving(true);
    const { error } = await supabase.from("viewing_bookings").insert({
      agent_id: agentId,
      client_id: user.id,
      property_id: propertyId || null,
      client_name: name.trim() || profile?.full_name || "",
      client_phone: phone.trim(),
      note: note.trim(),
      starts_at: chosen.toISOString(),
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Viewing requested — the agent will confirm shortly");
    setChosen(null); setNote("");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold"><CalendarClock className="h-4 w-4" /></span>
        <h3 className="font-bold">Book a viewing</h3>
      </div>

      {days.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">This agent hasn't published viewing times yet — message them on WhatsApp instead.</p>
      ) : (
        <>
          <div className="mt-4 max-h-52 space-y-3 overflow-y-auto pr-1">
            {days.slice(0, 7).map((d) => (
              <div key={d.date.toISOString()}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {WEEKDAYS[d.date.getDay()]} {d.date.getDate()}/{d.date.getMonth() + 1}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {d.times.map((t) => (
                    <button
                      key={t.toISOString()}
                      onClick={() => setChosen(t)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${chosen?.getTime() === t.getTime() ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand/50"}`}
                    >
                      {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {chosen && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div>
                <Label htmlFor="bk-listing">Listing (optional)</Label>
                <select id="bk-listing" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="mt-1 h-10 w-full rounded-full border border-border bg-background px-4 text-sm">
                  <option value="">General viewing</option>
                  {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="bk-name">Your name</Label>
                <Input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-full" />
              </div>
              <div>
                <Label htmlFor="bk-phone">Phone</Label>
                <Input id="bk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 rounded-full" />
              </div>
              <div>
                <Label htmlFor="bk-note">Note (optional)</Label>
                <Input id="bk-note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 rounded-full" />
              </div>
              <Button disabled={saving} onClick={() => void book()} className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
                {saving ? "Sending…" : `Request ${chosen.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
