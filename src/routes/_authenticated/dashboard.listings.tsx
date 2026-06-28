import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authenticated/dashboard/listings")({
  component: ListingsPage,
});

type Form = {
  id?: string;
  title: string;
  description: string;
  price: string;
  property_type: "sale" | "rent";
  category: "house" | "apartment" | "land" | "commercial" | "villa";
  location: string;
  city: string;
  bedrooms: string;
  bathrooms: string;
  area_sqm: string;
  amenities: string;
  images: string[];
  status: "active" | "sold" | "rented";
};

const emptyForm = (): Form => ({
  title: "", description: "", price: "", property_type: "sale", category: "house",
  location: "", city: "", bedrooms: "0", bathrooms: "0", area_sqm: "0",
  amenities: "", images: [], status: "active",
});

function ListingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());
  const [uploading, setUploading] = useState(false);

  const { data: listings } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("*").eq("agent_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

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
    for (const file of Array.from(files)) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data } = await supabase.storage.from("property-images").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (data?.signedUrl) urls.push(data.signedUrl);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    if (!form.title || !form.city) { toast.error("Title and city are required"); return; }
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
      amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
      images: form.images,
      status: form.status,
    };
    const { error } = form.id
      ? await supabase.from("properties").update(payload).eq("id", form.id)
      : await supabase.from("properties").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Listing updated" : "Listing created");
    setOpen(false);
    setForm(emptyForm());
    qc.invalidateQueries({ queryKey: ["my-listings"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
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
      amenities: (x.amenities as string[]).join(", "),
      images: x.images, status: x.status,
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{listings?.length ?? 0} listings</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm()); }}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90"><Plus className="mr-2 h-4 w-4" /> New listing</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit listing" : "New listing"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Type</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value as never })}>
                  <option value="sale">For Sale</option><option value="rent">For Rent</option>
                </select>
              </div>
              <div><Label>Category</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as never })}>
                  <option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option><option value="commercial">Commercial</option><option value="villa">Villa</option>
                </select>
              </div>
              <div><Label>Status</Label>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as never })}>
                  <option value="active">Active</option><option value="sold">Sold</option><option value="rented">Rented</option>
                </select>
              </div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Address / area</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
              <div><Label>Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
              <div><Label>Area (m²)</Label><Input type="number" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Amenities (comma separated)</Label><Input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="Pool, Garage, Garden" /></div>
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
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white">
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

      <div className="space-y-3">
        {listings?.map((l) => (
          <div key={l.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
              {(l.images as string[])[0] && <img src={(l.images as string[])[0]} alt="" className="h-full w-full object-cover" />}
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