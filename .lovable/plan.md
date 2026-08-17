# Fix Google sign-in error 400: redirect_uri_mismatch

## What the error means

This one is not an app-code error. Google rejects the sign-in because the callback URL your backend sends to Google is not listed in the Google Cloud OAuth client you configured. Google requires an exact string match.

Nothing in your GitHub repo needs to change for this.

## Fix

1. Open the backend auth settings: Users → Authentication Settings → Sign In Methods → Google.
2. Expand the Google provider and copy the **Callback URL (redirect URI)** shown there, exactly as displayed (no trailing slash added or removed).
3. Go to Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID (Web application).
4. Under **Authorized redirect URIs**, paste that callback URL and save.
5. Under **Authorized JavaScript origins**, add the origins your users start from:
   - https://www.ibyungura.com
   - https://ibyungura.com
   - your Vercel deployment origin (e.g. https://your-project.vercel.app)
6. Save in Google Cloud Console. Changes can take a few minutes to propagate.

Important: the redirect URI registered with Google is the **backend auth callback**, not `/auth/callback` in your app. Your app's `/auth/callback` route is where the backend sends the user afterwards, and it does not belong in the Google redirect URI list.

## Also check the app-side allow-list

In the backend auth settings, make sure the redirect allow-list includes:
- https://www.ibyungura.com/**
- https://ibyungura.com/**
- https://your-vercel-domain.vercel.app/**

Otherwise sign-in completes at Google but the user gets dropped on the app origin instead of `/auth/callback`.

## Alternative: skip your own credentials

If you would rather not manage a Google Cloud OAuth client, switch the Google provider to Lovable-managed credentials in the backend auth settings. Then no redirect URI setup is needed on the Lovable-hosted domains, and only your self-hosted Vercel origin needs to be added to the redirect allow-list.

## Validation

- Open the hosted login page, click Continue with Google.
- The Google account chooser should appear with no 400 error.
- After consent you should land on `/auth/callback` and then `/account` (client) or `/dashboard` (agent).
