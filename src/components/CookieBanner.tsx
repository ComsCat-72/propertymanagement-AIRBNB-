import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "lr250-cookie-consent";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const decide = (v: "accepted" | "declined") => {
    try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
    setOpen(false);
  };

  if (!open) return null;

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