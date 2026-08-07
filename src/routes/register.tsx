import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCropper, safeStorageName } from "@/components/PhotoCropper";

const schema = z.object({
  full_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(200),
  agency_name: z.string().trim().max(120),
  bio: z.string().trim().max(800),
  profile_photo_url: z.string().trim().min(1, "Please upload a profile photo").max(500),
});

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Become a Listing Agent | LoyalityReal250" },
      { name: "description", content: "Create a free LoyalityReal250 agent account to list houses, land, commercial property and vehicles, and reach buyers and renters across Rwanda." },
      { property: "og:title", content: "Become a Listing Agent | LoyalityReal250" },
      { property: "og:description", content: "Create a free agent account and start listing properties on LoyalityReal250." },
      { property: "og:url", content: "https://dwell-discover-dot.lovable.app/register" },
    ],
    links: [{ rel: "canonical", href: "https://dwell-discover-dot.lovable.app/register" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", phone: "", address: "", agency_name: "", bio: "", profile_photo_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const pickFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setPending(file);
  };

  const uploadCropped = async (blob: Blob) => {
    if (!pending) return;
    const src = pending;
    setPending(null);
    setUploading(true);
    const name = safeStorageName(src.name).replace(/\.[a-z]+$/, ".jpg");
    const path = `signup/${crypto.randomUUID()}-${name}`;
    const { error } = await supabase.storage.from("property-images").upload(path, blob, { contentType: "image/jpeg" });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = await supabase.storage.from("property-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (data?.signedUrl) setForm((f) => ({ ...f, profile_photo_url: data.signedUrl }));
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          agency_name: form.agency_name,
          bio: form.bio,
          profile_photo_url: form.profile_photo_url,
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Check your email if confirmation is required.");
    navigate({ to: "/dashboard" });
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold">Become a LoyalityReal250 agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create your agent account and start listing properties.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Profile photo *</Label>
            <div className="mt-2 flex items-center gap-4">
              {form.profile_photo_url ? (
                <img src={form.profile_photo_url} alt="Profile" className="h-28 w-24 rounded-md border border-border object-cover shadow-sm" />
              ) : (
                <span className="grid h-28 w-24 place-items-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">Passport photo</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickFile(f);
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-full">
                <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : form.profile_photo_url ? "Change photo" : "Upload photo"}
              </Button>
            </div>
          </div>
          <div className="md:col-span-2"><Label htmlFor="reg-full-name">Full name *</Label><Input id="reg-full-name" required value={form.full_name} onChange={set("full_name")} className="mt-1 rounded-xl" /></div>
          <div><Label htmlFor="reg-email">Email *</Label><Input id="reg-email" type="email" required value={form.email} onChange={set("email")} className="mt-1 rounded-xl" /></div>
          <div>
            <Label htmlFor="reg-password">Password *</Label>
            <div className="relative mt-1">
              <Input id="reg-password" type={showPassword ? "text" : "password"} required value={form.password} onChange={set("password")} className="rounded-xl pr-10" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div><Label htmlFor="reg-phone">Phone</Label><Input id="reg-phone" value={form.phone} onChange={set("phone")} className="mt-1 rounded-xl" /></div>
          <div><Label htmlFor="reg-agency">Agency name</Label><Input id="reg-agency" value={form.agency_name} onChange={set("agency_name")} className="mt-1 rounded-xl" /></div>
          <div className="md:col-span-2"><Label htmlFor="reg-address">Office address</Label><Input id="reg-address" value={form.address} onChange={set("address")} className="mt-1 rounded-xl" /></div>
          <div className="md:col-span-2"><Label htmlFor="reg-bio">Bio</Label><Textarea id="reg-bio" value={form.bio} onChange={set("bio")} rows={4} className="mt-1 rounded-xl" /></div>
          <Button disabled={loading} type="submit" className="md:col-span-2 rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? "Creating…" : "Create agent account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" search={{ next: undefined }} className="font-semibold text-brand underline">Log in</Link>
        </p>
        <PhotoCropper open={!!pending} file={pending} onCancel={() => setPending(null)} onConfirm={uploadCropped} />
      </div>
    </SiteShell>
  );
}