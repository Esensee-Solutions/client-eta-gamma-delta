# [Business name]

This is the website of [business name], [what it does] in [town], Puerto Rico. The site is for
`[domain]`, in [Spanish and English / Spanish / English].

*Client:* [Business name] is an Estable **Client** on the [Starter / Business / Custom] Plan.
*Founding Partner:* [Business name] is an Estable **Founding Partner**: Estable runs its site and
email for free in exchange for promotion. It is not a Client and never pays.

Read `docs/brief.md` (the Design brief) before changing anything. Every change is checked against it.

## Words

Use these in code, commits and pull requests.

- **Estable**: the business that builds and runs this site. The owner, working with AI assistants.
- **Client** (or **Founding Partner**): [business name]. Never "customer" or "user" for them.
- **Customer**: someone who buys from [business name]. The people this site is for.
- **Design brief**: `docs/brief.md`. The business, its Customers, the site's one job, and the one detail only this business has.
- **Site kit**: the invisible parts every Client site has (SEO, language switch, contact buttons, build and deploy). Never the look. Here they are plain files, listed in `README.md`; they become a private package later.
- **Update**: a small content change [business name] asks for (text, prices, hours, photos).
- **Change request**: anything bigger than an Update (a new page or section, a new feature).
- **Launch**: the day the site is live on `[domain]` and the Mailboxes work.

## How the site works

- Astro, static output: `npm run dev` to work, `npm run build` to make `dist/`. Details in `README.md`.
- All copy lives in `src/content/site.ts`, under each language with the same keys. Components look text up with `t('key')`.
- The business's facts (name, domain, languages, phone, address, brand color) are in `src/settings.ts`.
- Every page is listed once in `src/pages.ts`.
- Cloudflare serves `dist/` from the Worker `[worker]` (`wrangler.jsonc`). There is no Worker code.

## From pull request to live

Every change reaches the site the same way. The pull request is the unit of approval.

1. **Pull request.** GitHub Actions (`.github/workflows/site.yml`) checks and builds it, uploads
   it as a preview version and comments its link on the pull request:
   `https://pr-<number>-[worker].<account>.workers.dev`.
2. **Approval.** Estable opens the preview link on a phone. For a Design direction or a Change
   request, Estable sends the link to [business name] and waits for their yes. The link only
   shows the change; approving is the yes, and nothing goes live from it.
3. **Merge into `main`.** GitHub Actions deploys it: the change is live within a minute.

Where "live" is:

- **Before Launch**: the Worker's own address, `https://[worker].<account>.workers.dev`.
- **From Launch**: `https://[domain]` only, with `www` forwarding to it. At Launch, the pull
  request that connects the domain adds the `routes` custom domain in `wrangler.jsonc` and sets
  `"workers_dev": false`, so the site answers on one address. `"preview_urls": true` stays
  written out, which keeps step 1's preview links working.
- **Going back**: `npx wrangler rollback` returns to the previous version. A Paused site is a new
  version (the Paused site page), and restoring is a rollback to the version before it.

Links sent to [business name] or anyone outside Estable are preview links (for a yes) or
`https://[domain]` (after Launch).

## Rules

- **Update or Change request.** If a request is more than text, prices, hours, photos or links,
  stop and say it's a Change request. *Client:* Estable quotes it first. *Founding Partner:*
  Estable decides on it first. Build it after the yes.
- **The look belongs to this site.** [Palette, fonts, the one visual detail] (see `README.md`).
  The brand color is `BRAND` in `src/settings.ts`, which sets `--brand` on `:root` and
  `<meta name="theme-color">`; the Credit in the footer takes its mark's color from there.
  Every design choice comes from the brief, never from another site.
- **Every language together.** Every text change is made in [Spanish and English] in the same pull request.
- **What the site never says** (from the brief): [the brief's Avoid list]. The same list is `NEVER_SAY` in `check.mjs`.
- **Sitemap, robots and llms.** The site always answers with `/sitemap.xml`, `/robots.txt` and
  `/llms.txt`, made from `src/pages.ts`. A new page is added there in the same pull request, and
  `robots.txt` never blocks AI crawlers. If a page or fact changes (hours, phone, address,
  services), check `llms.txt` says the same.
- **Legal pages.** If the site starts setting cookies or tracking, including Cloudflare Web
  Analytics, the Privacy Policy changes in the same pull request.
- **Phone first.** No horizontal scroll at 390px. WCAG AA contrast, and the reduced-motion setting respected.
- **Secrets live in GitHub.** The Cloudflare token and account ID are organization secrets; the
  repository holds none.

## Working

- Work on a branch and open a pull request into `main`. Merging puts the site live.
- Before every pull request: `npm run check` and `npm run build`, then the change in a
  browser at phone width, in every language.
