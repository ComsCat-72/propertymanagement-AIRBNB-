import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Agent Log In | LoyalityReal250" },
      { name: "description", content: "Log in to your LoyalityReal250 agent account to publish listings, manage your profile and track enquiries from buyers and renters." },
      { property: "og:title", content: "Agent Log In | LoyalityReal250" },
      { property: "og:description", content: "Log in to manage your LoyalityReal250 listings and profile." },
      { property: "og:url", content: "https://dwell-discover-dot.lovable.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://dwell-discover-dot.lovable.app/login" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const uid = data.user?.id;
    if (next) { window.location.href = next; return; }
    if (!uid) { navigate({ to: "/" }); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    toast.success("Welcome back");
    navigate({ to: isAdmin ? "/admin" : "/dashboard" });
  };

  const resetPassword = async () => {
    if (!email) { toast.error("Enter your email above first"); return; }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent — check your email");
  };

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to manage your listings.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <button type="button" onClick={resetPassword} disabled={resetting} className="text-xs font-semibold text-brand hover:underline disabled:opacity-60">
                {resetting ? "Sending…" : "Forgot password?"}
              </button>
            </div>
            <div className="relative mt-1">
              <Input id="login-password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl pr-10" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button disabled={loading} type="submit" className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New agent? <Link to="/register" className="font-semibold text-brand underline">Create an account</Link>
        </p>
      </div>
    </SiteShell>
  );
}