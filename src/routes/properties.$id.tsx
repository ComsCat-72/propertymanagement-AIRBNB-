import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, BedDouble, Bath, Maximize, Building2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/properties/$id")({
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, agent:profiles!properties_agent_id_fkey(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) {
    return <SiteShell><div className="mx-auto max-w-6xl px-6 py-10">Loading…</div></SiteShell>;
  }
  if (!data) return null;

  const p = data as never as {
    id: string; title: string; description: string; price: number;
    property_type: "sale" | "rent"; category: string; location: string; city: string;
    bedrooms: number; bathrooms: number; area_sqm: number; amenities: string[]; images: string[];
    agent: { id: string; full_name: string; email: string; phone: string | null; address: string | null; agency_name: string | null; profile_photo_url: string | null; bio: string | null };
  };
  const imgs = p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600"];

  const waPhone = (p.agent.phone || "").replace(/[^\d]/g, "");
  const waMessage = encodeURIComponent(`Hi ${p.agent.full_name}, I'm interested in "${p.title}" on LoyalityReal250.`);
  const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waMessage}` : "";

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
        <h1 className="text-2xl font-bold sm:text-3xl">{p.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{p.city}{p.location ? `, ${p.location}` : ""} · <span className="capitalize">{p.category}</span> · For {p.property_type}</p>

        <div className="mt-4 md:hidden">
          <Carousel opts={{ loop: true }} className="relative overflow-hidden rounded-2xl">
            <CarouselContent>
              {imgs.map((src, i) => (
                <CarouselItem key={i}>
                  <img src={src} alt="" className="h-72 w-full object-cover" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute bottom-2 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">{imgs.length} photos</div>
          </Carousel>
        </div>

        <div className="mt-6 hidden h-[480px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:grid">
          <img src={imgs[0]} alt="" className="col-span-2 row-span-2 h-full w-full object-cover" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-full w-full bg-muted">
              {imgs[i] && <img src={imgs[i]} alt="" className="h-full w-full object-cover" />}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex items-center gap-6 border-b border-border pb-6">
              <span className="flex items-center gap-2 text-sm"><BedDouble className="h-5 w-5" /> {p.bedrooms} bedrooms</span>
              <span className="flex items-center gap-2 text-sm"><Bath className="h-5 w-5" /> {p.bathrooms} bathrooms</span>
              <span className="flex items-center gap-2 text-sm"><Maximize className="h-5 w-5" /> {p.area_sqm} m²</span>
            </div>
            <div className="border-b border-border py-6">
              <h2 className="text-xl font-bold">About this property</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{p.description || "No description provided."}</p>
            </div>
            {p.amenities && p.amenities.length > 0 && (
              <div className="border-b border-border py-6">
                <h2 className="text-xl font-bold">Amenities</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {p.amenities.map((a) => (
                    <div key={a} className="rounded-xl border border-border px-4 py-3 text-sm">{a}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold">{formatPrice(p.price, p.property_type)}</span>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">For {p.property_type}</span>
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  {p.agent.profile_photo_url ? (
                    <img src={p.agent.profile_photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-lg font-bold text-brand-foreground">{p.agent.full_name.charAt(0)}</span>
                  )}
                  <div>
                    <p className="font-bold">{p.agent.full_name}</p>
                    {p.agent.agency_name && <p className="text-xs text-muted-foreground">{p.agent.agency_name}</p>}
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand" /> {p.agent.phone || "—"}</p>
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand" /> {p.agent.email}</p>
                  {p.agent.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand" /> {p.agent.address}</p>}
                  {p.agent.agency_name && <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-brand" /> {p.agent.agency_name}</p>}
                </div>
                <a href={`mailto:${p.agent.email}`} className="mt-5 block">
                  <Button className="w-full rounded-full bg-brand font-semibold text-brand-foreground hover:bg-brand/90">Contact Agent</Button>
                </a>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                    <Button className="w-full rounded-full bg-[#25D366] font-semibold text-white hover:bg-[#20b357]">
                      <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Agent
                    </Button>
                  </a>
                )}
                <Link to="/agents/$id" params={{ id: p.agent.id }} className="mt-2 block text-center text-sm font-semibold text-brand underline">View all listings</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}