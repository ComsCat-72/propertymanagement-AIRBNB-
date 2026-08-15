# SEO cleanup for ibyungura.com

The site's SEO metadata still points at the old Lovable preview domain and the old brand name. Search engines are currently told the canonical home of every page is `dwell-discover-dot.lovable.app`, which means the custom domain gets no credit, and every title/description says "LoyalityReal250" instead of Ibyungura.

Everything below is plain source-code change — no Lovable-only APIs — so it behaves identically on the GitHub/Vercel deployment.

## 1. One canonical domain

Replace every hardcoded `https://dwell-discover-dot.lovable.app` with `https://www.ibyungura.com` in:

- `src/routes/index.tsx` (canonical, og:url, WebSite + Organization JSON-LD, search action target)
- `src/routes/properties.index.tsx`, `src/routes/properties.$id.tsx`
- `src/routes/agents.index.tsx`, `src/routes/agents.$id.tsx`
- `src/routes/login.tsx`, `src/routes/register.tsx`, `src/routes/reset-password.tsx`
- `src/routes/sitemap[.]xml.ts` (`BASE_URL`)
- `public/robots.txt` (`Sitemap:` line)

Introduce a single shared `SITE_URL` constant (`src/lib/site.ts`) and use it everywhere so the domain is changed in one place in future.

## 2. Rebrand metadata to Ibyungura

Update titles, descriptions, og tags, author, twitter handle and JSON-LD `name` from "LoyalityReal250" to "Ibyungura" / "ibyungura.com" across:

- `src/routes/__root.tsx` defaults
- all route `head()` blocks listed above
- `public/llms.txt` heading and body
- MCP server description in `src/lib/mcp/index.ts` and the consent screen copy in `src/routes/[.]lovable.oauth.consent.tsx`

Titles stay under 60 characters and descriptions under 160.

## 3. Noindex on private/utility routes

Add `{ name: "robots", content: "noindex, nofollow" }` to `login`, `register`, `reset-password` and the dashboard/admin layout routes, so only public marketing/listing pages compete in search. Keep `robots.txt` disallows as a second layer.

## 4. Sitemap correctness

- Keep the dynamic server route (already correct approach).
- Drop `/login` from the sitemap (it will be noindex).
- Keep `/register` only if it should stay indexable; the plan keeps it out of the sitemap since it becomes noindex.
- No `<lastmod>` values are invented; entries stay without them.

## 5. Social preview image

Homepage and list pages currently have no `og:image`, so shared links show a bare card. Add an absolute `https://www.ibyungura.com/og-cover.jpg` image (generated branded cover placed in `public/`) on the home, properties and agents routes only — leaf routes, never `__root`. Property and agent detail pages keep using their own listing/profile photo.

## Technical notes

- All canonical/og values remain absolute literal strings built from a shared constant, so SSR on Vercel and Lovable both emit identical tags.
- No changes to data fetching, RLS, or app behaviour.
- Crawlers cache previews: after deploying, a changed og:image won't show in already-shared links until the platform re-scrapes.

## After the change

Republish/redeploy, then submit `https://www.ibyungura.com/sitemap.xml` in Google Search Console for the `www.ibyungura.com` property.
