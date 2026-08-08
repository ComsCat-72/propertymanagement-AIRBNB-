# Fix "Image storage is not configured" on Vercel

The uploader works in Lovable but fails on your Vercel deployment because the Cloudinary credentials only exist as secrets inside Lovable. Vercel runs the same code with an empty environment, so the server-side signature step aborts with that message. Nothing in the upload logic is broken — it is purely missing configuration, plus an error message that doesn't tell you which value is missing.

## What will change

**1. Make the error say exactly what's wrong**
Instead of the generic "Image storage is not configured", the server will report which specific variables are missing (for example: "Missing CLOUDINARY_API_SECRET"), and the browser will surface that text in the toast. This makes the same class of problem self-diagnosing on any host.

**2. Accept the standard Cloudinary variable names too**
Cloudinary's own docs and most hosts use `CLOUDINARY_URL`. The server will read the three individual variables first, and fall back to parsing `CLOUDINARY_URL` if present, so either style works on Vercel, Lovable, or a local checkout.

**3. Add a committed `.env.example`**
A checked-in template listing every variable the app needs (Supabase public values plus the three Cloudinary ones), with comments marking which are server-only. Real secrets stay out of git — `.env` remains untracked.

**4. Add a short deployment/setup section to the README**
Step-by-step: which variables to add in Vercel → Project Settings → Environment Variables, that they must be set for Preview and Production, and that a redeploy is required for changes to take effect. Also covers local dev via `.env`.

**5. Cover the rest of the server environment**
The Supabase server helpers read `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. These are equally absent on Vercel and would fail later in the same way, so they go into the example file and the docs alongside Cloudinary.

## What you'll need to do

Copy the three Cloudinary values from your Cloudinary dashboard into Vercel's environment variables, then redeploy. I can't set them on Vercel from here. Inside Lovable the secrets already exist, so the preview keeps working unchanged.

## Technical notes

- `readEnv()` in `src/lib/cloudinary.functions.ts` gets per-variable reporting and `CLOUDINARY_URL` parsing; still read inside `.handler()` only.
- Variable names: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (server-only, never `VITE_`-prefixed).
- New files: `.env.example`, README deployment section. No database, RLS, or UI changes.