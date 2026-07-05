import { Link } from "@tanstack/react-router";
import { Heart, ChevronLeft, ChevronRight, BedDouble, Bath, Maximize, MessageCircle } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/format";

export interface PropertyCardData {
  id: string;
  title: string;
  city: string;
  location: string;
  price: number;
  property_type: "sale" | "rent";
  category: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  images: string[];
  agent?: { id: string; full_name: string; profile_photo_url: string | null; phone?: string | null } | null;
}

export function PropertyCard({ p }: { p: PropertyCardData }) {
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const imgs = p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"];
  const waPhone = (p.agent?.phone || "").replace(/[^\d]/g, "");
  const waHref = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${p.agent?.full_name ?? ""}, I'm interested in "${p.title}" on LoyalityReal250.`)}`
    : "";

  return (
    <div className="group">
      <Link to="/properties/$id" params={{ id: p.id }} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
          <img src={imgs[idx]} alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" />
          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/20 backdrop-blur-sm transition hover:scale-110"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-accent text-accent" : "fill-black/40 text-white"}`} />
          </button>
          {imgs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); setIdx((i) => (i - 1 + imgs.length) % imgs.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-white/90 opacity-0 shadow transition group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setIdx((i) => (i + 1) % imgs.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-white/90 opacity-0 shadow transition group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                {imgs.slice(0, 5).map((_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`} />
                ))}
              </div>
            </>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold capitalize">{p.category}</span>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Chat on WhatsApp"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#20b357]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-foreground">{p.title}</h3>
            <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{p.property_type === "rent" ? "Rent" : "Sale"}</span>
          </div>
          <p className="text-sm text-muted-foreground">{p.city}{p.location ? `, ${p.location}` : ""}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.bathrooms}</span>
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{p.area_sqm}m²</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-foreground">{formatPrice(p.price, p.property_type)}</span>
            {p.agent && (
              <div className="flex items-center gap-1.5">
                {p.agent.profile_photo_url ? (
                  <img src={p.agent.profile_photo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
                    {p.agent.full_name.charAt(0) || "A"}
                  </span>
                )}
                <span className="max-w-[80px] truncate text-xs text-muted-foreground">{p.agent.full_name}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}