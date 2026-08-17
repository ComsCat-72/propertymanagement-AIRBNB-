import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const KEY = "ibyungura.onetap.dismissed";

/** Low-friction prompt inviting visitors to create a free browsing account with Google. */
export function GoogleOneTap() {
  const { user, loading } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
  }, [loading, user]);

  if (!show || user) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 shadow-xl lg:bottom-6">
      <button
        onClick={() => { localStorage.setItem(KEY, "1"); setShow(false); }}
        aria-label="Dismiss sign-in prompt"
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-6 text-sm font-bold">Save homes & review agents</p>
      <p className="mt-1 text-xs text-muted-foreground">Create a free browsing account in one tap. No password needed.</p>
      <GoogleSignInButton className="mt-3" />
    </div>
  );
}
