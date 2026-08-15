# Per-image upload progress

Show a real percentage bar for every photo while it uploads — profile photos (sign-up and dashboard profile) and each listing image.

## What changes for you

- **Listing images**: choose several photos at once and each one appears immediately as a tile with a thumbnail preview, a progress bar and a live percentage. Uploads run in parallel (up to 5 at a time), tiles turn into the finished image when done, and a failed tile shows an error with a Retry button.
- **Profile photo (dashboard + registration)**: after cropping, a circular/rectangular preview shows a progress overlay with the percentage until the photo lands.
- Saving is blocked while uploads are still running so nothing is lost.

## Technical notes

- `src/lib/cloudinary.ts`: replace `fetch` with an `XMLHttpRequest`-based upload so `upload.onprogress` gives real byte progress. Same signature plus an optional `onProgress(percent)` callback; `uploadListingImage`, `uploadAvatar`, `uploadSignupAvatar` all accept it. No server-function change — signing stays the same.
- New small component `src/components/UploadProgressTile.tsx` (thumbnail via `URL.createObjectURL`, progress bar, status: uploading / done / error + retry).
- `dashboard.listings.tsx`: replace the sequential loop with a tracked queue keyed by a per-file id, holding `{ file, previewUrl, percent, status, error }`; render pending tiles in the same grid alongside completed images; disable Save while any tile is uploading.
- `dashboard.profile.tsx` and `register.tsx`: keep existing flow, add a `percent` state and a progress overlay on the photo preview instead of the plain "Uploading…" label.
- Progress bars use existing design tokens (brand color) — no new dependencies.