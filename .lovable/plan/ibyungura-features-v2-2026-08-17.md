# Ibyungura Features V2

Five additions, built in one pass. No changes to existing design tokens, layout, pricing, or current flows — everything below is additive.

## 1. Structured, category-aware listing fields

The listing form shows only the fields relevant to the chosen category, so agents fill in less and listings become comparable.

- **Common to every category**: listing type (sale/rent), price + a "negotiable" toggle, structured location (Province -> District -> Sector dropdowns, cascading), availability status (Available / Under negotiation / Sold / Rented).
- **Houses / Apartments / Villas**: bedrooms, bathrooms, floors, size, furnished (yes/no/partial), parking spaces, amenities checklist (water tank, generator, solar, security/fence, ...).
- **Land**: size + unit (sqm/ha), zoning, title status, road access, utilities nearby.
- **Commercial**: floor area, floor count, intended use tags, parking, existing fit-out.
- **Vehicles (car/motorcycle)**: make, model, year, mileage, transmission, fuel type, condition, previous owners.

The free-text description and the existing "Other details" custom fields stay. Property detail pages render whichever structured fields are present as a clean spec grid; nothing breaks for older listings, which keep showing what they already have.

Existing listings are untouched until their agent edits them.

## 2. Photo standards

- A listing cannot be saved as **Active** with fewer than 3 photos (agents can still save it, it just stays a draft-style inactive status until photos are added). Live counter: "2 / 3 minimum photos".
- Category-aware photo checklist beside the uploader (daylight, wide shots, exterior, land boundaries, vehicle four angles + odometer, no clutter, one portrait shot). Each item shows a tick when we can detect it was met (count, orientation mix, resolution) and a cross otherwise — informational only, never blocking.
- Low-resolution / tiny-file images get a soft warning badge on the tile.

## 3. Agent profile enhancement + lightbox

Profile gains: social handles (WhatsApp business, Instagram, Facebook, TikTok, LinkedIn — icons render only when filled), "Member since", independent vs agency affiliation, specialization tags (filterable on /agents), verified badge (already exists), and live counts of active vs closed (sold/rented) listings.

New full-screen **lightbox** used on listing galleries and agent photos: swipe/arrow navigation, zoom, "3 / 12" counter, thumbnail strip above 5 images, lazy loading.

Editing of the new fields lives in the existing agent profile dashboard page.

## 4. Client -> Agent reviews

- New **client** account tier, created only through Google sign-in. Clients get: saved properties, reviews, profile menu. Clients never see the agent dashboard, listings, billing, or verification.
- A client may review an agent only after a recorded inquiry (WhatsApp/contact click is logged against that agent + listing).
- Review form collects communication, accuracy, professionalism (1-5 each), a would-recommend yes/no, and an optional 300-char comment.
- Public display is deliberately minimal: a single star rating (weighted average of the three scores), review count, and recommend percentage. Individual scores are not shown, to keep profiles clean. Comments show under "Reviewed after inquiring about [Property]".
- Reviews publish immediately but pass a profanity/spam filter first; flagged ones wait for admin review in the admin dashboard.

## 5. Google Sign-In + One Tap

- "Sign in with Google" button on login/register, plus the Google One Tap corner prompt on the homepage and login page only (with Google's own dismissal cooldown).
- Google sign-in always creates a **client** account, never an agent. Becoming an agent stays a separate, deliberate registration.
- If the Google email matches an existing account, the accounts link instead of duplicating.

## Technical notes

- **Schema**: add `attributes jsonb` + `province/district/sector`, `negotiable`, and extend `property_status` with `under_negotiation` on `properties`; add social/specialization/member fields to `profiles`; new `app_role` value `client`; new tables `agent_reviews`, `agent_inquiries`, `saved_properties`, all with GRANTs and RLS (client writes own rows, public reads aggregate rating only via a view/function, agents cannot edit reviews about them).
- `handle_new_user` becomes provider-aware: Google sign-ups get `client` role and `active` status; the existing email/password agent path is unchanged.
- Google auth via the Lovable auth broker (`lovable.auth.signInWithOAuth("google")`) plus `configure_social_auth`; GIS script loaded client-side only for the One Tap prompt, token exchanged through the same Supabase session.
- Category field config lives in one `src/lib/listing-schema.ts` map so form, detail page, and filters share a single source of truth.
- Lightbox is a new `src/components/Lightbox.tsx` built on the existing carousel + dialog primitives, matching current styling.
- Moderation filter runs in a server function on review submit.
