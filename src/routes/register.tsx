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
import { uploadSignupAvatar } from "@/lib/cloudinary";
import { UploadProgressOverlay } from "@/components/UploadProgressTile";
import { PhoneField } from "@/components/PhoneField";
import { DEFAULT_DIAL, joinPhone } from "@/lib/phone";
import { SITE_URL } from "@/lib/site";

const schema = z.object({
  full_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(200),
  agency_name: z.string().trim().max(120),
  bio: z.string().trim().max(800),
  profile_photo_url: z.string().trim().min(1, "Please upload a profile photo").max(500),
  social_instagram: z.string().trim().max(200),
  social_facebook: z.string().trim().max(200),
  social_tiktok: z.string().trim().max(200),
  social_linkedin: z.string().trim().max(200),
  whatsapp_business: z.string().trim().max(40),
});

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Become a Listing Agent | Ibyungura.com" },
      { name: "description", content: "Create a free Ibyungura.com agent account to list houses, land, commercial property and vehicles, and reach buyers and renters across Rwanda." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Become a Listing Agent | Ibyungura.com" },
      { property: "og:description", content: "Create a free agent account and start listing properties on Ibyungura.com." },
      { property: "og:url", content: `${SITE_URL}/register` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/register` }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", phone: "", address: "", agency_name: "", bio: "", profile_photo_url: "",
    social_instagram: "", social_facebook: "", social_tiktok: "", social_linkedin: "", whatsapp_business: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [dial, setDial] = useState(DEFAULT_DIAL);
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
    setPercent(0);
    const localPreview = URL.createObjectURL(blob);
    setPreviewUrl(localPreview);
    const name = safeStorageName(src.name).replace(/\.[a-z]+$/, ".jpg");
    try {
      const { url } = await uploadSignupAvatar(blob, name, setPercent);
      setForm((f) => ({ ...f, profile_photo_url: url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    URL.revokeObjectURL(localPreview);
    setPreviewUrl(null);
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const phone = joinPhone(dial, form.phone);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.full_name,
          phone,
          address: form.address,
          agency_name: form.agency_name,
          bio: form.bio,
          profile_photo_url: form.profile_photo_url,
          social_instagram: form.social_instagram,
          social_facebook: form.social_facebook,
          social_tiktok: form.social_tiktok,
          social_linkedin: form.social_linkedin,
          whatsapp_business: form.whatsapp_business,
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
        <h1 className="text-3xl font-bold">Become Ibyungura.com agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create your agent account and start listing properties.</p>
        <form onSubmit={submit} className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Profile photo *</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="relative h-28 w-24 shrink-0">
                {previewUrl || form.profile_photo_url ? (
                  <img src={previewUrl ?? form.profile_photo_url} alt="Profile" className="h-full w-full rounded-md border border-border object-cover shadow-sm" />
                ) : (
                  <span className="grid h-full w-full place-items-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">Passport photo</span>
                )}
                {uploading && <UploadProgressOverlay percent={percent} />}
              </div>
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
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full">
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
          <div>
            <Label htmlFor="reg-phone">Phone (WhatsApp)</Label>
            <PhoneField id="reg-phone" dial={dial} local={form.phone} onDialChange={setDial} onLocalChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            <p className="mt-1 text-[11px] text-muted-foreground">Choose your country — we save the number with its country code so WhatsApp works.</p>
          </div>
          <div><Label htmlFor="reg-agency">Agency name</Label><Input id="reg-agency" value={form.agency_name} onChange={set("agency_name")} className="mt-1 rounded-xl" /></div>
          <div className="md:col-span-2"><Label htmlFor="reg-address">Office address</Label><Input id="reg-address" value={form.address} onChange={set("address")} className="mt-1 rounded-xl" /></div>
          <div className="md:col-span-2"><Label htmlFor="reg-bio">Bio</Label><Textarea id="reg-bio" value={form.bio} onChange={set("bio")} rows={4} className="mt-1 rounded-xl" /></div>
          <div className="md:col-span-2 mt-2">
            <h2 className="text-sm font-bold">Social links <span className="font-normal text-muted-foreground">(optional)</span></h2>
            <p className="text-xs text-muted-foreground">Shown on your public profile so buyers can check you out.</p>
          </div>
          <div><Label htmlFor="reg-ig">Instagram</Label><Input id="reg-ig" value={form.social_instagram} onChange={set("social_instagram")} placeholder="@yourhandle" className="mt-1 rounded-xl" /></div>
          <div><Label htmlFor="reg-fb">Facebook</Label><Input id="reg-fb" value={form.social_facebook} onChange={set("social_facebook")} placeholder="facebook.com/yourpage" className="mt-1 rounded-xl" /></div>
          <div><Label htmlFor="reg-tt">TikTok</Label><Input id="reg-tt" value={form.social_tiktok} onChange={set("social_tiktok")} placeholder="@yourhandle" className="mt-1 rounded-xl" /></div>
          <div><Label htmlFor="reg-li">LinkedIn</Label><Input id="reg-li" value={form.social_linkedin} onChange={set("social_linkedin")} placeholder="linkedin.com/in/you" className="mt-1 rounded-xl" /></div>
          <div className="md:col-span-2"><Label htmlFor="reg-wab">WhatsApp Business number</Label><Input id="reg-wab" value={form.whatsapp_business} onChange={set("whatsapp_business")} placeholder="+250 7XX XXX XXX" className="mt-1 rounded-xl" /></div>
          <Button disabled={loading || uploading} type="submit" className="md:col-span-2 rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {uploading ? "Uploading photo…" : loading ? "Creating…" : "Create agent account"}
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