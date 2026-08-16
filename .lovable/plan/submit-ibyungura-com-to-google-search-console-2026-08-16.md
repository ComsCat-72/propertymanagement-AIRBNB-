# Submit Ibyungura.com to Google Search Console

Goal: verify the canonical domain `https://www.ibyungura.com` in Google Search Console and submit the dynamic sitemap so Google can discover, crawl, and index the public listing pages.

## What we will do

### 1. Connect Google Search Console

- Open the Google Search Console connector in this Lovable workspace so we can request verification tokens and submit the sitemap without leaving the editor.

### 2. Request a meta-tag verification token

- Ask Search Console for a `META` verification token for the exact URL-prefix property `https://www.ibyungura.com/`.
- The token looks like `<meta name="google-site-verification" content="...">` and must appear in the server-rendered HTML `<head>` of the site root.

### 3. Inject the verification tag into the site root

- Add a conditional or static `<meta name="google-site-verification" content="<TOKEN>" />` tag to `src/routes/__root.tsx` so it is emitted in the `<head>` of every page but specifically validated at the root URL.
- Preserve the existing favicon, fonts, and SEO tags.

### 4. Publish the site so the tag is live

- The tag must be visible in the server-rendered HTML at `https://www.ibyungura.com/` before Google can verify the property.
- Frontend changes require clicking **Update** in the Publish dialog to reach the custom domain.

### 5. Verify the property and add it to Search Console

- Tell Google to verify the live meta tag.
- Add `https://www.ibyungura.com/` to the project's Search Console property list.

### 6. Submit the sitemap

- Submit `https://www.ibyungura.com/sitemap.xml` to the verified `www.ibyungura.com` property.
- The sitemap is already dynamic and includes all public routes, active property detail pages, and active agent profile pages.

### 7. Confirm no regressions

- Ensure `robots.txt` still allows all public routes and points to the sitemap.
- Ensure the canonical domain remains `https://www.ibyungura.com` across routes, sitemap, and JSON-LD.

## Technical details

- Verification method: `META` tag (URL-prefix property).
- Canonical domain: `https://www.ibyungura.com` (already used in `src/lib/site.ts`, sitemap, robots.txt, and route metadata).
- Sitemap endpoint: dynamic TanStack Start server route at `src/routes/sitemap[.]xml.ts`.
- No robots.txt changes needed: `Sitemap: https://www.ibyungura.com/sitemap.xml` is already present.
- No code changes to data fetching, RLS, or app behavior.

## After the plan

- The site will appear in Google Search Console as a verified property.
- Google will receive the sitemap and can begin crawling and indexing the public pages.

Indexing and ranking still depend on Google's crawl schedule; this plan only completes the technical submission steps.  
  
NB: All these must work the same on my Github hosted project, so make sure not to work from lovable only