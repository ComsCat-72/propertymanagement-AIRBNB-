import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { effectivePlan, maxListings, type PlanLimit } from "@/lib/plans";
import { logEvent } from "@/lib/events";
import { uploadListingImage, cldUrl } from "@/lib/cloudinary";
import { deleteUploads } from "@/lib/cloudinary.functions";

export const Route = createFileRoute("/_authenticated/dashboard/listings")({
  component: ListingsPage,
});

type Form = {
  id?: string;
  title: string;
  description: string;
  price: string;
  property_type: "sale" | "rent";
  category: "house" | "apartment" | "land" | "commercial" | "villa" | "car" | "motorcycle";
  location: string;
  city: string;
  bedrooms: string;
  bathrooms: string;
  area_sqm: string;
  amenities: string[];
  features: { label: string; value: string }[];
  images: string[];
  image_public_ids: string[];
  status: "active" | "sold" | "rented";
};

const emptyForm = (): Form => ({
  title: "", description: "", price: "", property_type: "sale", category: "house",
  location: "", city: "", bedrooms: "0", bathrooms: "0", area_sqm: "0",
  amenities: [], features: [], images: [], image_public_ids: [], status: "active",
});

function ListingsPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [amenityDraft, setAmenityDraft] = useState("");

  const { data: listings } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("*").eq("agent_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: limits } = useQuery({
    queryKey: ["plan-limits"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_limits").select("*").order("sort_order");
      return (data ?? []) as unknown as PlanLimit[];
    },
  });

  const cap = maxListings(effectivePlan(profile), limits);
  const used = listings?.length ?? 0;
  const quotaReached = cap !== null && used >= cap;

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`my-listings-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "properties", filter: `agent_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["my-listings", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const upload = async (files: FileList | null) => {
    if (!files || !user) return;
    if (form.images.length + files.length > 10) { toast.error("Max 10 images"); return; }
    setUploading(true);
    const urls: string[] = [];
    const ids: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const { url, publicId } = await uploadListingImage(file);
        urls.push(url);
        ids.push(publicId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Could not upload ${file.name}`);
      }
    }
    setForm((f) => ({ ...f, images: [...f.images, ...urls], image_public_ids: [...f.image_public_ids, ...ids] }));
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    if (!form.id && quotaReached) {
      void logEvent(user.id, "quota_reached", { plan: effectivePlan(profile), metadata: { cap, used } });
      toast.error(`You've reached your plan limit of ${cap} listings. Upgrade to add more.`);
      return;
    }
    if (!form.title || !form.city || !form.location) { toast.error("Title, city, and location are required"); return; }
    const payload = {
      agent_id: user.id,
      title: form.title.trim(),
      description: form.description,
      price: parseFloat(form.price) || 0,
      property_type: form.property_type,
      category: form.category,
      location: form.location,
      city: form.city,
      bedrooms: parseInt(form.bedrooms, 10) || 0,
      bathrooms: parseInt(form.bathrooms, 10) || 0,
      area_sqm: parseFloat(form.area_sqm) || 0,
      amenities: form.amenities.map((s) => s.trim()).filter(Boolean),
      features: form.features.filter((f) => f.label.trim()).map((f) => ({ label: f.label.trim(), value: f.value.trim() })),
      images: form.images,
      image_public_ids: form.image_public_ids,
      status: form.status,
    };
    const { error } = form.id
      ? await supabase.from("properties").update(payload as never).eq("id", form.id)
      : await supabase.from("properties").insert(payload as never);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Listing updated" : "Listing created");
    setOpen(false);
    setForm(emptyForm());
    qc.invalidateQueries({ queryKey: ["my-listings"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const target = listings?.find((l) => l.id === id) as { image_public_ids?: string[] } | undefined;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    const ids = target?.image_public_ids ?? [];
    if (ids.length) void deleteUploads({ data: { publicIds: ids } }).catch(() => {});
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["my-listings"] });
  };

  const edit = (l: typeof listings extends (infer U)[] | undefined ? U : never) => {
    const x = l as never as Form & { amenities: string[] };
    setForm({
      id: (l as { id: string }).id,
      title: x.title, description: x.description, price: String((l as { price: number }).price),
      property_type: x.property_type, category: x.category, location: x.location, city: x.city,
      bedrooms: String((l as { bedrooms: number }).bedrooms),
      bathrooms: String((l as { bathrooms: number }).bathrooms),
      area_sqm: String((l as { area_sqm: number }).area_sqm),
      amenities: (x.amenities as string[]) ?? [],
      features: ((l as unknown as { features?: { label: string; value: string }[] }).features ?? []).filter(Boolean),
      images: x.images, image_public_ids: (l as { image_public_ids?: string[] }).image_public_ids ?? [],
      status: x.status,
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {used} listing{used === 1 ? "" : "s"}
          {cap !== null ? ` of ${cap} on your plan` : " · unlimited plan"}
        </p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm()); }}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90"><Plus className="mr-2 h-4 w-4" /> New listing</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit listing" : "New listing"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Price (RWF)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Type</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value as never })}>
                  <option value="sale">For Sale</option><option value="rent">For Rent</option>
                </select>
              </div>
              <div><Label>Category</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as never })}>
                  <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option><option value="commercial">Commercial</option><option value="villa">Villa</option><option value="car">Car</option><option value="motorcycle">Motorcycle</option>
                </select>
              </div>
              <div><Label>Status</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as never })}>
                  <option value="active">Active</option><option value="sold">Sold</option><option value="rented">Rented</option>
                </select>
              </div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Location *</Label><Input required placeholder="Neighborhood, street, or landmark" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
              <div><Label>Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
              <div><Label>Area (m²)</Label><Input type="number" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })} /></div>

              {/* Custom details — agents add their own fields */}
              <div className="md:col-span-2 rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <Label>Other details</Label>
                  <Button
                    type="button" variant="outline" size="sm" className="rounded-full"
                    onClick={() => setForm((f) => ({ ...f, features: [...f.features, { label: "", value: "" }] }))}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add detail
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Add anything else buyers should know — Parking, Floors, Year, Fuel type…</p>
                {form.features.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.features.map((ft, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder="Label (e.g. Parking)"
                          value={ft.label}
                          onChange={(e) => setForm((f) => ({ ...f, features: f.features.map((x, j) => j === i ? { ...x, label: e.target.value } : x) }))}
                        />
                        <Input
                          placeholder="Value (e.g. 2 cars)"
                          value={ft.value}
                          onChange={(e) => setForm((f) => ({ ...f, features: f.features.map((x, j) => j === i ? { ...x, value: e.target.value } : x) }))}
                        />
                        <Button type="button" variant="outline" size="icon" aria-label="Remove detail" className="shrink-0 rounded-full text-destructive"
                          onClick={() => setForm((f) => ({ ...f, features: f.features.filter((_, j) => j !== i) }))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities as chips */}
              <div className="md:col-span-2 rounded-2xl border border-border p-4">
                <Label>Amenities</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Pool, Garage, Garden…"
                    value={amenityDraft}
                    onChange={(e) => setAmenityDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = amenityDraft.trim();
                        if (v && !form.amenities.includes(v)) setForm((f) => ({ ...f, amenities: [...f.amenities, v] }));
                        setAmenityDraft("");
                      }
                    }}
                  />
                  <Button
                    type="button" variant="outline" className="shrink-0 rounded-full"
                    onClick={() => {
                      const v = amenityDraft.trim();
                      if (v && !form.amenities.includes(v)) setForm((f) => ({ ...f, amenities: [...f.amenities, v] }));
                      setAmenityDraft("");
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                {form.amenities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.amenities.map((a, i) => (
                      <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm">
                        {a}
                        <button type="button" aria-label={`Remove ${a}`} onClick={() => setForm((f) => ({ ...f, amenities: f.amenities.filter((_, j) => j !== i) }))}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Label>Images (max 10)</Label>
                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 hover:bg-muted">
                  <Upload className="h-4 w-4" /><span className="text-sm">{uploading ? "Uploading…" : "Click to upload"}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
                </label>
                {form.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {form.images.map((src, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                        <img src={cldUrl(src, 320)} alt="" className="h-full w-full object-cover" />
                        <button type="button" aria-label="Remove image" onClick={() => {
                          const removed = form.image_public_ids[i];
                          if (removed) void deleteUploads({ data: { publicIds: [removed] } }).catch(() => {});
                          setForm({
                            ...form,
                            images: form.images.filter((_, j) => j !== i),
                            image_public_ids: form.image_public_ids.filter((_, j) => j !== i),
                          });
                        }} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button onClick={save} className="mt-4 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">{form.id ? "Update" : "Create"} listing</Button>
          </DialogContent>
        </Dialog>
      </div>

      {quotaReached && (
        <div className="mb-6 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm">
          <strong className="font-semibold">You've reached your listing limit ({cap}).</strong> Your current listings stay live.{" "}
          <Link to="/dashboard/billing" className="font-semibold underline">Upgrade your plan</Link> to add more.
        </div>
      )}

      <div className="space-y-3">
        {listings?.map((l) => (
          <div key={l.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
              {(l.images as string[])[0] && <img src={cldUrl((l.images as string[])[0], 320)} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold">{l.title}</p>
              <p className="text-sm text-muted-foreground">{l.city} · {formatPrice(l.price, l.property_type as "sale" | "rent")} · <span className="capitalize">{l.status}</span></p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => edit(l)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="rounded-full text-destructive" onClick={() => del(l.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {listings && listings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="font-semibold">No listings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Click "New listing" to create your first one.</p>
          </div>
        )}
      </div>
    </div>
  );
}