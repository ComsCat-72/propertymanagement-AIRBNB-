# Ibyungura Agent Growth Features

Four features from the research paper: featured listing boosts, deal certificates and commission invoices, the Pro Agent Page, and the Leads Club. Payments stay manual (agent submits a payment reference, admin approves) exactly like today's upgrade requests. Alerts are in-app plus email; WhatsApp can be plugged in later.

Rental management (idea 3) and profile ad space (idea 4) are deliberately left for a later phase.

## 1. Featured / promoted listings

- Agents get a "Boost this listing" action on each of their listings in the dashboard. They pick a duration (7 / 14 / 30 days), see the fee, and submit a payment reference.
- Admin sees boost requests in a new tab of the admin dashboard and approves or rejects them. Approving sets the listing featured until the end date.
- Boosts expire automatically — a listing stops being featured once its window ends, no admin cleanup needed.
- The homepage Featured section and the properties grid show boosted listings first, with a subtle "Featured" ribbon. Ordering inside the featured block is by boost start date so nobody permanently owns the top slot.
- Agent's billing page gains a "Boosts" section listing active and past boosts with their end dates.

## 2. Deal certificates + commission invoices

- New "Deals" tab in the agent dashboard. An agent records a closed deal: property (picked from their listings), buyer/tenant name, final price, close date, and their commission percentage.
- Recording a deal optionally flips the listing to Sold or Rented.
- Two documents generated from a deal, both rendered as clean print-ready pages the agent opens and saves as PDF from the browser:
  - **Deal closing certificate** — property, price, agent name + photo, agency, date, and a short transaction reference.
  - **Commission invoice** — deal value, commission %, amount due in RWF, agent's payment details, invoice number, and issue date.
- Both carry Ibyungura branding (logo, emerald/gold palette) and the agent's verified badge when they have one.
- Deals are private to the agent and admins. Closed-deal count feeds the agent's public profile as "Deals closed" only when the agent opts in.

## 3. Pro Agent Page (branded mini-site)

- Each agent gets a shareable URL at `/agent/<their-slug>` (slug auto-generated from name or agency, editable once and checked for uniqueness). The existing `/agents/<id>` page keeps working and redirects to the slug.
- The page shows: banner image + logo, tagline, review score, listing count, deals closed, specializations, social icons, and all active listings grouped by category with filters.
- **Subscribe to this agent** — a signed-in visitor subscribes and receives a notification whenever that agent posts a new listing. Delivery: in-app notification bell plus an email. Subscribers can set a simple preference filter (category, city, max price) so they only hear about relevant listings. Unsubscribe from the same button or the email.
- **Book a viewing** — the agent defines weekly availability (days + time windows and a slot length). Visitors pick a free slot on a listing or the agent page, leave name/phone/note; the agent confirms or declines from the dashboard. Both sides see it in-app and by email, plus a reminder the day before. Agents can optionally mark viewings as requiring a fee, shown as a note to the client (collected off-platform for now).
- **Ask this agent** — an AI chat widget on the agent page answering questions from that agent's listing data (price, bedrooms, location, amenities, attributes). It answers only from listings, says "ask the agent directly" when it doesn't know, and never invents details. Unanswered questions are captured as leads in the agent's inbox.
- Branding, slug, availability, and the chat on/off switch are edited in the existing agent profile dashboard.

## 4. Leads Club

- The site quietly scores visitor intent from behaviour already tracked (listing views, saves, repeat visits, filter use) and builds an anonymised lead card: requirement summary, category, area, budget range, listing type, and how recently it was active. No name, phone, or email is exposed before purchase.
- A "Leads" tab in the agent dashboard shows matching lead cards with the price per lead. The agent requests a lead with a payment reference; on admin approval the contact details unlock for that agent only.
- A lead can be sold to a limited number of agents (default 3), then it's marked exhausted.
- Visitors are told plainly in the cookie/consent copy and privacy note that their enquiry may be shared with matching agents, and they can opt out from their account page. Only opted-in visitors ever become leads.
- Admin gets a Leads overview: pending purchase requests, sold counts, and the ability to retire a lead.

## Technical notes

- **New tables** (all with GRANTs + RLS): `listing_boosts`, `deals`, `agent_pages` (slug, branding, chat toggle), `agent_subscriptions` (+ preference filters), `viewing_slots` / `viewing_bookings`, `notifications`, `buyer_leads`, `lead_purchases`. Boost/lead purchase approval reuses the existing admin-approval pattern (`SECURITY DEFINER` functions mirroring `approve_upgrade_request`).
- Featured ordering uses an `is_featured`-compatible view driven by active boost windows so existing queries keep working; expiry handled by comparing `ends_at` to `now()` rather than a cron job.
- Certificates/invoices render as dedicated print-styled routes (`/deals/$id/certificate`, `/deals/$id/invoice`) — no PDF library needed in the Worker runtime; the browser's print-to-PDF produces the file.
- Emails go out through server functions; the AI chat uses the Lovable AI gateway with the agent's listings passed as grounded context.
- Lead scoring runs in a server function over existing `listing_views`, `saved_properties`, and `agent_inquiries` data — no new tracking scripts.
- Agent slug route is a new `/agent/$slug` file; existing `/agents/$id` stays and redirects so shared links and SEO are preserved.
