import { useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.4c-.5 2.9-2.1 5.4-4.5 7l7 5.4c4.1-3.8 7.2-9.4 7.2-16.7z" />
    <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 010-9.4l-7.8-6.1a24 24 0 000 21.6l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7-5.4c-2 1.3-4.6 2.1-8.9 2.1-6.4 0-11.7-3.8-13.6-9.2l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

export function GoogleSignInButton({ className, label = "Continue with Google" }: { className?: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
        if (result?.error) { setLoading(false); toast.error(result.error.message ?? "Google sign-in failed"); }
      }}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-3 rounded-full border border-border bg-background text-sm font-semibold transition hover:bg-muted disabled:opacity-60",
        className,
      )}
    >
      <GoogleMark /> {loading ? "Opening Google…" : label}
    </button>
  );
}
