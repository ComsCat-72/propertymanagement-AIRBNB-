# Fix Vercel backend environment configuration

## Goal

Ensure the GitHub-synced Vercel deployment connects to the same Lovable Cloud backend even when Vercel has not injected the public backend variables, while preserving environment overrides for other deployments.

## Changes

1. Add a single app-owned public backend configuration containing only the backend URL, publishable key, and project identifier. These values are designed to be browser-visible and are not privileged secrets.
2. Update the Vite/TanStack build configuration to resolve both `VITE_SUPABASE_*` and server-side `SUPABASE_*` public values from:
  - deployment environment variables first;
  - the checked-in public configuration as a fallback.
3. Keep `SUPABASE_SERVICE_ROLE_KEY`, Cloudinary credentials, and every other privileged credential environment-only; no secret fallback will be committed.
4. Remove or simplify the ineffective runtime environment bridge so configuration is established during compilation before generated browser and authenticated server modules execute.
5. Update deployment documentation to distinguish built-in public connection values from server-only secrets that still must be configured in Vercel.

## Validation

- Run the production build with the backend environment variables intentionally absent and confirm it succeeds.
- Start/inspect the production-compatible app and verify the homepage no longer emits repeated missing-variable errors.
- Verify authenticated server middleware receives the compiled public URL/key and that no service-role or Cloudinary secret appears in client output.

## Technical note

The current bridge can only copy `VITE_SUPABASE_*` values when Vercel already provides them. The generated auth middleware reads `process.env.SUPABASE_URL` and `process.env.SUPABASE_PUBLISHABLE_KEY`; compiling safe public fallbacks into those exact references resolves the failure without editing generated integration files.  
  
This error is coming when am uploading properties(images)