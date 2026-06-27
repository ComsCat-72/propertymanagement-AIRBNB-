import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — LoyalityReal250" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const uid = data.user?.id;
    if (!uid) { navigate({ to: "/" }); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    toast.success("Welcome back");
    navigate({ to: isAdmin ? "/admin" : "/dashboard" });
  };

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to manage your listings.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 rounded-xl" />
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