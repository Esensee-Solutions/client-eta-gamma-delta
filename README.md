# Client repository template

The starting point for every Client repository (`client-<business>`). It holds the invisible
parts every Client site has, working, and nothing else: there is no layout, no theme and no
styles here, because each site's look is designed from its own Design brief
([ADR 0004](https://github.com/Esensee-Solutions/Esensee_Solutions/blob/main/docs/adr/0004-shared-site-kit-package.md)).

It was drawn from `client-molina-strategic-advisory`. Until the Site kit is a package, its parts
are plain files here; when it exists, they move into it and each site installs it.

## Starting a new Client's repository

1. **Create the repository** from this template: `client-<business>` (`client-cafe-luna`),
   private, in the `esensee-solutions` organization. Check the organization's
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are shared with it.
2. **Name it** in three places: `"name"` in `package.json` (`client-cafe-luna`), `"name"` in
   `wrangler.jsonc` (`cafe-luna`, the Worker), and the title of this `README.md`.
3. **Write the Design brief** in `docs/brief.md` from the Client's questionnaire answers.
4. **Fill in `CLAUDE.md`**: every `[bracket]`, from the brief and the quote. For a Founding
   Partner, keep the lines marked *Founding Partner* and drop the ones marked *Client*.
5. **Fill in `src/settings.ts`** (name, domain, languages, phone, WhatsApp, email, address, Maps
   link, brand color) and the copy in `src/content/site.ts`. For a one-language site, keep one
   language in `LANGUAGES`, delete the other from the copy and delete its folder in `src/pages/`.
6. **Add the icons and share card** to `public/`: `favicon.ico`, `favicon-96x96.png`,
   `apple-touch-icon.png` (180×180) and `og-image.jpg` (1200×630), made from the Client's logo.
7. **Put the brief's Avoid list** into `NEVER_SAY` in `check.mjs`.
8. **Design direction**: design the top of the page and one section in `src/components/Home.astro`
   and `src/layouts/Layout.astro`, open a pull request, and show its preview link to the Client
   on their phone. Build the rest after their yes.
9. Replace this section of the `README.md` with the site's own notes (its palette, fonts and
   brand assets).

`npm run check` lists what's still to fill in at any point. Before
[Launch](https://github.com/Esensee-Solutions/Esensee_Solutions/blob/main/docs/lifecycle/launch.md),
`npm run check -- --launch` must pass: it fails while anything is left.

## Running it

Needs Node 22.18 or newer (`.node-version`).

```
npm install
npm run dev        # http://localhost:4321, reloads as you edit
npm run build      # writes the finished site to dist/
npm run preview    # serves dist/ to check the build
npm run check      # the rules in CLAUDE.md, and what's still to fill in
```

## Files

```
├── CLAUDE.md                   Working rules for anyone (human or AI) changing the site.
├── docs/brief.md               The Design brief. Every change is checked against it.
├── check.mjs                   Checks the site against CLAUDE.md's rules. Run before every pull request.
├── astro.config.mjs            Takes the domain from src/settings.ts.
├── wrangler.jsonc              The Cloudflare Worker that serves dist/.
├── .github/workflows/site.yml  Checks, builds, previews and deploys.
├── public/                     Copied as-is to the site: icons, share card, photos.
└── src/
    ├── settings.ts             The business's facts: name, domain, languages, phone, address, brand color.
    ├── content/site.ts         ← ALL SITE COPY LIVES HERE, once per language.
    ├── pages.ts                Every page, once. The sitemap and llms.txt are built from it.
    ├── i18n.ts                 t('key') and page addresses per language.
    ├── contact.ts              The call, WhatsApp, email and Maps links.
    ├── layouts/Layout.astro    <head>, skip link, footer with the Credit. The site's header and footer go here.
    ├── components/
    │   ├── Seo.astro           Title, description, hreflang, share card, structured data.
    │   ├── LangSwitch.astro    The language switch (unstyled).
    │   ├── ContactButtons.astro  The contact buttons (unstyled).
    │   ├── Credit.astro        Estable's Credit, the footer's last line.
    │   └── Home.astro          A stand-in homepage. Replace it with the design.
    ├── pages/                  One file per address, and a folder per extra language (en/).
    │                           Also sitemap.xml, robots.txt and llms.txt.
    └── scripts/esensee-credit.js  The Credit's element (from Esensee_Solutions' kit/credit/).
```

## The invisible parts

- **SEO** (`Seo.astro`): each page's title and description from the copy (`meta.title`,
  `meta.desc`; another page uses its own prefix, `meta.menu.title`), its canonical address, each
  language's version, the share card and the business's structured data from `src/settings.ts`.
- **Sitemap, robots and llms**: `/sitemap.xml`, `/robots.txt` and `/llms.txt`, built from
  `src/pages.ts` and the copy. `robots.txt` allows everything, AI crawlers included.
- **Languages**: the main language (first in `LANGUAGES`) is at `/`, any other at `/en/`. A
  visitor whose browser is in the other language, arriving from another site, is sent to that
  language's page; the switch keeps whatever they pick. Nothing is stored in the browser.
- **Contact buttons** (`contact.ts`, `ContactButtons.astro`): call, WhatsApp, email and Maps, for
  whichever the business has.
- **Credit**: in the footer of every page, in the page's language.
- **Build and deploy**: a preview link on every pull request, live on merge into `main`
  (`CLAUDE.md` has the steps).

Not here yet, because no Client site has needed one: a contact form (it needs Worker code, with
Resend for sending and Turnstile against spam) and legal pages (Terms and Privacy are written per
business and reviewed by an attorney; `client-molina-strategic-advisory` has a working pair). The
Paused site page is made from `Esensee_Solutions` with `npm run paused-page`.

## Adding a page

1. Add it to `src/pages.ts`: `{ path: 'menu/', key: 'menu' }`.
2. Add its copy to every language in `src/content/site.ts`: `pages.menu`, `pages.menu.desc`,
   `meta.menu.title`, `meta.menu.desc` and its text.
3. Add its file for each language: `src/pages/menu.astro` and `src/pages/en/menu.astro`, each
   with `<Layout lang="…" page="menu/" metaPrefix="meta.menu">`.

`npm run check` fails if any of the three is missing.

## Keeping the template current

When an invisible part is fixed in one Client's repository, make the same fix here, so the next
repository starts with it. Existing repositories don't follow the template: until the Site kit
is a package, a fix is copied into each by hand.
