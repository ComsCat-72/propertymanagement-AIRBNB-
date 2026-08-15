# Ibyungura.com — QA fixes round

## 1. Mobile navbar + no horizontal scroll
Refine the hide-on-scroll logic so the header slides away on scroll down and returns immediately on scroll up (with a small threshold to stop jitter), and audit the shell/hero/grids for elements wider than the viewport, adding `overflow-x-hidden` on the page wrapper so nothing pans left/right on phones.

## 2. Property detail photo counter
Add a live "3 / 12" counter on the mobile carousel that updates as you swipe, and a photo count chip on the desktop gallery. Design stays exactly as it is — only the existing static "N photos" chip becomes a live index.

## 3. Phone numbers with country code (WhatsApp fix)
The WhatsApp error happens because numbers are stored locally (0780979872) with no country code.
- Add a country selector next to the phone field on signup and on the agent profile page (Rwanda +250 default, full country list).
- Store the number in international form (+250780979872) so WhatsApp links resolve.
- Add a shared normaliser used by all WhatsApp links: strips leading 0 and prefixes the country code, so existing saved numbers work immediately without any data migration.

## 4. Footer + logo + favicon
- Use the attached ibyungura.com logo as the site logo (navbar + footer) and generate a square favicon from it.
- Rebuild the footer: remove dead links (Newsroom, Investor relations, Refer a friend, New features, Safety, etc.) and keep only real destinations — Browse properties, For sale, For rent, Find an agent, Become an agent, Log in, Contact (WhatsApp/email), plus tagline and copyright.

## 5. Register page wording
"Become a LoyalityReal250 agent" becomes "Become Ibyungura.com agent".

## 6. Logout on mobile
The account menu (Dashboard / Profile / Admin / Sign out) only exists in the desktop top bar, which is hidden on phones. Add the same account menu to the mobile view (avatar/menu button in the mobile bar and a sign-out entry), so signing out and the redirect to login works on mobile.

## 7. Listing form: custom details + amenities
- Replace the fixed Bedrooms/Bathrooms-only detail block with an "Add detail" control: click it and a label + value input pair appears; agents can add as many as they want (e.g. Parking: 2, Floors: 3) and remove any row.
- Amenities become chips: type and press Add to append, click x to remove — no more comma-separated string.
- Stores the extra details in a new `features` JSON column on listings and renders them on the property detail page next to bedrooms/bathrooms.

## 8. Pricing changes
- Tier 1 renamed **Standard**, RWF 10,000 to RWF 7,000/month.
- Tier 2 renamed **Premium**, RWF 25,000 to RWF 10,000/month.
- Verified badge RWF 10,000 to RWF 5,000/month.
Applied in the database plan table and in the code constant so billing, upgrade dialogs and admin views all match.

## 9. Notifications
Restyle all toasts as a frosted-glass card (blur, soft border, brand-tinted icon) with a smooth slide-and-fade entrance, richer colours for success/error/info, and a subtle progress indicator. Applies app-wide since every notification already goes through one toaster.

## Technical notes
- `src/components/Navbar.tsx`, `BottomNav.tsx`, `SiteShell.tsx` — scroll behaviour, mobile account menu, overflow.
- New `src/lib/phone.ts` (country list + E.164 normaliser) used by `register.tsx`, `dashboard.profile.tsx`, `PropertyCard.tsx`, `properties.$id.tsx`, `agents.$id.tsx`.
- Migration: `alter table properties add column features jsonb not null default '[]'`; update `plan_limits` labels/prices; `BADGE_PRICE_RWF` in `src/lib/plans.ts`.
- Logo added as a CDN asset pointer; favicon written to `public/` and referenced from the root route.
- Toaster styling in `src/components/ui/sonner.tsx` + keyframes in `src/styles.css`.
