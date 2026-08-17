import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({ meta: [{ title: "Signing you in… | Ibyungura.com" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const finish = (path: string) => {
      if (done) return;
      done = true;
      navigate({ to: path, replace: true });
    };
    const stored = sessionStorage.getItem("ibyungura.auth.next");
    sessionStorage.removeItem("ibyungura.auth.next");
    const dest = stored && stored.startsWith("/") && !stored.startsWith("//") ? stored : "/";

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) finish(dest);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(dest);
    });
    const t = setTimeout(() => finish("/login"), 8000);
    return () => { clearTimeout(t); sub.subscription.unsubscribe(); };
  }, [navigate]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
