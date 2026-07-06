import { useEffect, useState } from "react";
import { Cookie, X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const COOKIE_KEY = "lr250-cookie-consent";
export type CookieConsent = "accepted" | "declined";

export function getCookieConsent(): CookieConsent | null {
  try { return (localStorage.getItem(COOKIE_KEY) as CookieConsent | null) ?? null; } catch { return null; }
}

export function setCookieConsent(v: CookieConsent | null) {
  try {
    if (v === null) localStorage.removeItem(COOKIE_KEY);
    else localStorage.setItem(COOKIE_KEY, v);
    window.dispatchEvent(new CustomEvent("lr250:cookie-consent", { detail: v }));
  } catch { /* ignore */ }
}

/** Small floating badge (bottom-left) that lets the user re-open the banner
 *  after they've already decided. Persists their preference forever via localStorage. */
function ConsentBadge({ current, onOpen }: { current: CookieConsent; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="Cookie preferences"
      className="fixed bottom-4 left-4 z-[55] flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur hover:bg-muted"
    >
      <Settings2 className="h-3.5 w-3.5 text-brand" />
      Cookies: {current === "accepted" ? <span className="text-brand">On</span> : <span className="text-muted-foreground">Off</span>}
    </button>
  );
}

export function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = getCookieConsent();
    setConsent(c);
    if (!c) setOpen(true);
    const onChange = (e: Event) => setConsent((e as CustomEvent<CookieConsent | null>).detail ?? null);
    window.addEventListener("lr250:cookie-consent", onChange);
    return () => window.removeEventListener("lr250:cookie-consent", onChange);
  }, []);

  const decide = (v: CookieConsent) => {
    setCookieConsent(v);
    setConsent(v);
    setOpen(false);
  };

  if (!open) return consent ? <ConsentBadge current={consent} onOpen={() => setOpen(true)} /> : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur md:flex-row md:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
          <Cookie className="h-5 w-5" />
        </span>
        <div className="flex-1 text-sm">
          <p className="font-semibold">We use cookies</p>
          <p className="text-muted-foreground">
            We use cookies to improve your browsing experience, analyze site traffic and remember your preferences.
          </p>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <Button variant="outline" onClick={() => decide("declined")} className="flex-1 rounded-full md:flex-none">
            Decline
          </Button>
          <Button onClick={() => decide("accepted")} className="flex-1 rounded-full bg-brand text-brand-foreground hover:bg-brand/90 md:flex-none">
            Accept
          </Button>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => decide("declined")}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}