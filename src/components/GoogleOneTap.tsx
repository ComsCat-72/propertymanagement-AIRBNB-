import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const KEY = "ibyungura.onetap.dismissed";
const CLIENT_ID = import.meta.env['VITE_GOOGLE_CLIENT_ID'] as string | undefined;

type GsiId = {
  initialize: (o: Record<string, unknown>) => void;
  prompt: () => void;
  cancel: () => void;
};

function gsi(): GsiId | undefined {
  return (window as unknown as { google?: { accounts?: { id?: GsiId } } }).google?.accounts?.id;
}

/** Generates a nonce pair: raw value sent to Supabase, SHA-256 hash sent to Google. */
async function makeNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce));
  const hashed = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { nonce, hashed };
}

/** Google's native One Tap prompt — signs visitors in without leaving the page. */
export function GoogleOneTap() {
  const { user, loading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (!CLIENT_ID || loading || user || started.current) return;
    if (localStorage.getItem(KEY)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      const { nonce, hashed } = await makeNonce();
      const tick = () => {
        if (cancelled) return;
        const id = gsi();
        if (!id) { timer = setTimeout(tick, 400); return; }
        started.current = true;
        id.initialize({
          client_id: CLIENT_ID,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
          nonce: hashed,
          callback: async (res: { credential?: string }) => {
            if (!res.credential) return;
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: res.credential,
              nonce,
            });
            if (error) { toast.error(error.message); return; }
            toast.success("Signed in with Google");
          },
        });
        id.prompt();
      };
      timer = setTimeout(tick, 2500);
    };
    void run();

    return () => { cancelled = true; clearTimeout(timer); };
  }, [loading, user]);

  useEffect(() => {
    if (user) gsi()?.cancel();
  }, [user]);

  if (CLIENT_ID) return null;
  return <FallbackCard />;
}

/** Shown only when no Google Client ID is configured, so visitors still get a one-tap entry point. */
function FallbackCard() {
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
