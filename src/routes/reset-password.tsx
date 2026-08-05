import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password | LoyalityReal250" },
      { name: "description", content: "Set a new password for your LoyalityReal250 agent account using the secure reset link sent to your email address." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reset Your Password | LoyalityReal250" },
      { property: "og:description", content: "Set a new password for your LoyalityReal250 agent account." },
      { property: "og:url", content: "https://dwell-discover-dot.lovable.app/reset-password" },
    ],
    links: [{ rel: "canonical", href: "https://dwell-discover-dot.lovable.app/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery") || hash.includes("access_token")) setReady(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/login" });
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready ? "Enter and confirm your new password." : "Open the reset link from your email to continue."}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <Label>New password</Label>
            <div className="relative mt-1">
              <Input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl pr-10" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button disabled={loading || !ready} type="submit" className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </SiteShell>
  );
}