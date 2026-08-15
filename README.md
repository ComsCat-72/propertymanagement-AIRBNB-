# Ibyungura.com

Real-estate marketplace for Rwanda — houses, land, commercial property and vehicles.
Built with React, TanStack Start, Tailwind CSS, Supabase and Cloudinary.

## Local development

```bash
bun install
cp .env.example .env   # then fill in the values
bun run dev
```

## Environment variables

See `.env.example` for the full list. Two groups matter:

| Variable | Scope | Required for |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | browser | all data access |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | server | SSR + authenticated server functions |
| `SUPABASE_SERVICE_ROLE_KEY` | server | privileged admin operations only |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | server | **all image uploads** |

Server variables must **not** be prefixed with `VITE_` — that would ship them to the browser.

## Deploying to Vercel

1. Open **Project Settings → Environment Variables**.
2. Add every variable from the table above. Tick **Production**, **Preview** and
   **Development** for each one, otherwise preview deployments fail while
   production works (or vice-versa).
3. For Cloudinary you can either add the three individual variables, or a single
   `CLOUDINARY_URL` in the form `cloudinary://<api_key>:<api_secret>@<cloud_name>`
   (copyable straight from the Cloudinary dashboard).
4. **Redeploy.** Vercel only injects environment variables at build/deploy time,
   so existing deployments keep the old (empty) values until you redeploy.

### Troubleshooting image uploads

If an upload fails with *"Image storage is not configured on this deployment —
missing environment variable: …"*, the named variable is absent from that
deployment's environment. Add it in Vercel and redeploy. The message always
lists exactly which value is missing.

Uploads go straight from the browser to Cloudinary using a short-lived signature
generated on the server, so the API secret never reaches the client and files are
stored at original quality.