# One-tap Google sign-in (native prompt)

Replace the current custom "Save homes & review agents" card and full redirect flow with Google's real One Tap prompt — the small panel that appears top-right showing the visitor's own Google account and a "Continue as <name>" button, exactly like the reference.

## What changes for visitors

- A few seconds after landing, Google's own prompt slides in at the top-right showing their signed-in Google account.
- Tapping "Continue as ..." signs them into Ibyungura instantly, on the same page — no redirect to Google, no page reload.
- Dismissing it hides it (Google itself suppresses it for a cooldown period; we also keep our own dismissal flag).
- Never shown to already signed-in users.
- The existing "Continue with Google" buttons on login/register stay as the fallback for anyone who dismisses or blocks the prompt.

## How it works technically

- Load Google Identity Services (`https://accounts.google.com/gsi/client`) from the root route head.
- Rewrite `src/components/GoogleOneTap.tsx` to:
  - initialize `google.accounts.id` with the web Client ID, `auto_select: false`, `cancel_on_tap_outside: false`, `use_fedcm_for_prompt: true`;
  - on credential callback, call `supabase.auth.signInWithIdToken({ provider: "google", token: credential, nonce })` with a generated + SHA-256 hashed nonce;
  - on success show a toast and refresh auth state in place;
  - render nothing itself (Google renders the panel), and skip entirely when no Client ID is configured or the user is authenticated.
- Client ID comes from a `VITE_GOOGLE_CLIENT_ID` env value so it works on both Lovable and the Vercel deployment.

## What is needed from you

The Google **Web Client ID** (the one already used for Google login in the backend), plus your site origins (`https://www.ibyungura.com`, `https://ibyungura.com`, and the preview domain) added to **Authorized JavaScript origins** in the Google Cloud OAuth client. Without the Client ID the prompt cannot render and the app quietly falls back to the existing button.
