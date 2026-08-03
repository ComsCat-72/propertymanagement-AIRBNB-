# Monetization: free tier, verified badge, agent subscriptions

Adds a business model layer on top of the existing agent dashboard: a free plan capped at 10 listings, a paid verified badge, and two paid subscription tiers. Payments are handled **manually for now** — agents request an upgrade, an admin confirms payment and activates it. No payment processor is wired up in this phase.

## Pricing (all in Rwandan francs)


| Plan           | Price              | Listings         | Extras                              |
| -------------- | ------------------ | ---------------- | ----------------------------------- |
| Free           | RWF 0              | up to 10         | standard listing features           |
| Tier 1         | RWF 10,000 / month | up to 50         | analytics dashboard                 |
| Tier 2         | RWF 25,000 / month | unlimited        | analytics + priority support        |
| Verified badge | RWF 10,000 / month | add-on, any plan | verified check on profile and cards |


Tier 1's cap is set to 50 listings and the badge add-on to RWF 10,000 — both easy to change if you want different numbers.

## What agents see

- **Dashboard → Billing tab**: current plan, renewal date, listings used vs. allowed, verified badge status, and plan cards with a "Request upgrade" button. Requesting opens a short form (plan choice, badge add-on, payment reference) and creates a pending request.
- **Listing limit**: when an agent at their cap opens "New listing", saving is blocked with a clear message and an upgrade link. Existing listings are never hidden or deleted.
- **Lapse handling**: when a subscription expires the plan falls back to Free and a persistent banner asks them to subscribe again. Their listings stay publicly visible; they just can't add new ones past 10.
- **Analytics dashboard** (Tier 1 and 2 only): views per listing from a new view counter, plus totals by status, category and city (also use different charts to view their analytics well). Free agents see a locked preview card.
- **Verified badge**: shown on the agent profile page, agent cards in Find an Agent, and property cards and agents with this badge their properties should be listed first(create an algorithm to pop first properties of the agents with this badge).

## What admins see

- **Admin → Billing tab**: pending upgrade requests with agent, requested plan, amount and reference. Approve activates the plan for 30 days and stamps the expiry; reject closes it with a note.
- **Admin → Agents**: each row gains plan, expiry and a verified toggle for manual grant/revoke.
- Overview gains "Active subscriptions" and "Pending upgrade requests" cards.
- I want admin to controll and see everything happening on the website(all data flow, all activities)

## Technical notes

Database migration:

- Enum `subscription_plan` (`free`, `tier1`, `tier2`).
- `profiles` gains `plan` (default `free`), `plan_expires_at`, `is_verified`, `verified_expires_at`. Only admins can change these, so agents cannot self-upgrade.
- `public.plan_limits` seeded from the pricing table (plan, price_rwf, max_listings with NULL = unlimited, perks) so pricing is data-driven; public read.
- `public.upgrade_requests` (agent_id, requested_plan, wants_badge, amount_rwf, payment_reference, status, admin_note, reviewed_by, reviewed_at). RLS: agents insert/read own, admins read/update all. GRANTs for authenticated and service_role.
- `public.listing_views` (property_id, viewed_at, viewer hash) with anon insert and reads limited to the owning agent and admins — feeds analytics.
- Security-definer helpers `current_plan(uid)` (falls back to `free` when expired) and `listing_quota_reached(uid)`. The `properties` insert policy is extended to reject inserts past the quota, so the cap is enforced server-side, not just in the UI.
- Admin-only security-definer `approve_upgrade_request(request_id)` sets plan/expiry and marks the request approved in one transaction.

Frontend:

Apply the same design of the website.

- `src/lib/auth.tsx` profile type extended with plan and verified fields.
- New routes: `dashboard.billing.tsx`, `dashboard.analytics.tsx`, `admin.billing.tsx`, plus tabs in the dashboard and admin layouts.
- New `src/components/VerifiedBadge.tsx` used by `PropertyCard`, `agents.index.tsx` and `agents.$id.tsx`.
- `dashboard.listings.tsx` gains the quota guard and upgrade prompt; the property detail route records a view.