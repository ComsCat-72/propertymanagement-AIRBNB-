Plan: Fix Google OAuth on Vercel / GitHub-hosted copy

Goal
Stop the "Unsupported provider: missing OAuth secret" error on the hosted Vercel project so Google sign-in works there the same way it works on the Lovable preview.

Root cause
The error is returned by Supabase Auth when the Google provider is enabled but has no OAuth client secret configured. The frontend code already has a dual-mode fallback that uses Lovable's broker on Lovable/ibyungura.com hosts and falls back to direct Supabase Google OAuth on any other host (e.g., the raw Vercel URL). The fallback path is the one hitting the missing-secret error.

No new code is required in GitHub for this specific error. The existing code just needs to be verified and the backend provider secret needs to be supplied.

Code to verify in your GitHub repo

1. src/components/GoogleSignInButton.tsx
Must contain the dual-mode logic and the direct Supabase fallback. The current file already has this.

2. src/routes/auth.callback.tsx
Must exist as a public, client-only route that listens for the Supabase session and redirects the user after Google OAuth returns. The current file already has this.

3. src/routes/login.tsx
Must import and render <GoogleSignInButton />. The current file already does this.

Backend configuration steps (this is the actual fix)

1. Open the Lovable Cloud backend authentication settings.
2. Navigate to Users → Authentication Settings → Sign In Methods → Google.
3. Choose either:
   - Managed Google OAuth (Lovable Cloud handles the secret): this should be the fastest fix.
   - Or your own Google OAuth credentials from Google Cloud Console, then paste the Client ID and Client Secret into the Google provider form.
4. If using your own credentials, add the hosted Vercel URL(s) to the Authorized redirect URIs in Google Cloud Console:
   - https://www.ibyungura.com/auth/callback
   - https://dwell-discover-dot.lovable.app/auth/callback
   - any raw Vercel deployment URL you use
5. Save the backend settings.
6. Redeploy the Vercel project so the new provider config is active.

Validation
- Visit the hosted login page and click the Google button.
- Confirm the Google consent screen loads and, after consent, the user lands on /auth/callback then /account (for client role) or /dashboard (for agent role).

Note
If you are on the raw Vercel deployment URL (e.g., something.vercel.app) rather than www.ibyungura.com, the brokerAvailable() function will intentionally fall back to direct Supabase OAuth. That is correct; the only requirement is that the Google provider secret is configured in the backend.
