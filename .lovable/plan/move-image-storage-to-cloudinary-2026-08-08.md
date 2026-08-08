# Move image storage to Cloudinary

All images (listing photos and agent profile photos) will be uploaded to Cloudinary at original quality instead of Supabase Storage. Everything else — database rows, auth, listings data — stays where it is. Existing images keep working; only new uploads go to Cloudinary.

## Why this shape

Cloudinary uploads will be **signed on the server**: the browser asks our backend for a short-lived signature, then sends the file straight to Cloudinary. The API secret never reaches the browser, and the file never passes through our server (no size or timeout limits). Files are stored unmodified, so no quality loss; Cloudinary transformations are used only when *displaying* smaller versions.

## Steps

**Step 1 — Cloudinary account and credentials**
You create a free Cloudinary account and copy three values from the dashboard: Cloud name, API key, API secret. I then request them through the secure secrets form (nothing pasted in chat).

**Step 2 — Signature endpoint**
A server function `getCloudinarySignature` that:
- requires a signed-in agent
- returns signature, timestamp, API key, cloud name
- pins the upload folder per user (`byungura/listings/<user-id>` or `byungura/avatars/<user-id>`) so nobody can upload elsewhere

**Step 3 — Shared upload helper**
`src/lib/cloudinary.ts` with `uploadToCloudinary(file, folder)`: fetches the signature, posts the file to Cloudinary, returns the secure URL plus `public_id`. Includes error handling and a size guard.

**Step 4 — Wire up the three upload points**
- Listing images (agent dashboard, listings dialog)
- Agent profile photo (dashboard, profile, cropped output)
- Registration profile photo
Each keeps its current UI and cropping; only the storage call changes. Stored values become Cloudinary URLs — the existing URL columns already fit.

**Step 5 — Display optimisation**
Cards and grids request auto-format/auto-quality resized versions (`f_auto,q_auto,w_800`); detail pages request large versions. Originals stay untouched in Cloudinary, so pages stay fast without sacrificing stored quality.

**Step 6 — Deletion cleanup**
When an agent deletes a listing or replaces a profile photo, a server function deletes the matching Cloudinary asset, so your free quota is not filled with orphans. This needs a small public-id reference stored with each image.

**Step 7 — Verify**
Upload a real photo end to end, confirm it lands in the Cloudinary media library at original dimensions, confirm the card and detail page render it, and confirm delete removes it.

## Technical notes

- New columns: `properties.image_public_ids text[]` and `profiles.photo_public_id text` (cleanup only); existing `images` / `profile_photo_url` columns are unchanged.
- Secrets: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, read only inside server function handlers.
- Signature is SHA-1 over sorted params via Web Crypto (Worker-safe, no Node SDK dependency).
- Old Supabase Storage URLs keep resolving; the `property-images` bucket stays. Backfilling old images into Cloudinary is optional and not part of this plan.