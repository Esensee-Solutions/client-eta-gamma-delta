// npm run check              the rules below; lists what's still to fill in
// npm run check -- --launch  the same, and fails while anything is still to fill in
//
// Checks the site against the rules in CLAUDE.md: every language has the same
// copy keys, every t('key') has copy, every page has its name and description,
// the Credit is on every page, nothing adds tracking the Privacy Policy doesn't
// cover, and the copy says nothing on the brief's Avoid list. Layout, contrast
// and reduced motion still need a look in a browser at phone width.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// What the site never says, from the Avoid row of docs/brief.md. One entry each:
//   { pattern: /\bcheap(est)?\b|\bbarat[oa]s?\b/i, what: '"cheap"' },
const NEVER_SAY = [];

const ROOT = import.meta.dirname;
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
// A file without its comments, which give examples that aren't the site's.
const code = (path) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
const walk = (dir) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { withFileTypes: true, recursive: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)))
    : [];

const { site } = await import('./src/content/site.ts');
const { LANGUAGES, DOMAIN } = await import('./src/settings.ts');
const { pages } = await import('./src/pages.ts');

const failures = [];
const toFill = [];
const main = LANGUAGES[0];
const source = walk('src').filter((path) => /\.(astro|ts)$/.test(path));

// Every language has the same keys.
for (const lang of LANGUAGES) {
  if (!site[lang]) {
    failures.push(`src/content/site.ts has no "${lang}" copy, but src/settings.ts lists it`);
    continue;
  }
  const missing = Object.keys(site[main]).filter((key) => !(key in site[lang]));
  const extra = Object.keys(site[lang]).filter((key) => !(key in site[main]));
  if (missing.length) failures.push(`copy in ${main} but not ${lang}: ${missing.join(', ')}`);
  if (extra.length) failures.push(`copy in ${lang} but not ${main}: ${extra.join(', ')}`);
}

// Every t('key') has copy, and every page has its name and one-line description.
const keys = site[main] ?? {};
for (const path of source) {
  for (const [, key] of code(path).matchAll(/\bt[l]?\(['`]([\w.-]+)['`]\)/g)) {
    if (!(key in keys)) failures.push(`${path}: t('${key}') has no copy`);
  }
}
for (const page of pages) {
  for (const key of [`pages.${page.key}`, `pages.${page.key}.desc`]) {
    if (!(key in keys)) failures.push(`src/pages.ts: the page "${page.path || '/'}" needs '${key}' in the copy`);
  }
}

// Every language has a page file for every page.
for (const page of pages) {
  for (const lang of LANGUAGES) {
    const base = join('src/pages', lang === main ? '' : lang, page.path);
    const file =
      page.path === '' ? [join(base, 'index.astro')] : [join(base, 'index.astro'), `${base.replace(/\/$/, '')}.astro`];
    if (!file.some((path) => existsSync(join(ROOT, path))))
      failures.push(`no ${lang} page for "${page.path || '/'}" (${file[0]})`);
  }
}

// The Credit is on every page.
if (!/<Credit\b/.test(read('src/layouts/Layout.astro')))
  failures.push("the Credit is no longer in the layout's footer");

// No tracking the Privacy Policy doesn't cover.
const tracking = /googletagmanager|google-analytics|gtag\(|fbq\(|plausible|hotjar|clarity\.ms/i;
for (const path of [...source, ...walk('public').filter((p) => p.endsWith('.html'))]) {
  if (tracking.test(read(path)))
    failures.push(`${path}: tracking script found; the Privacy Policy must change with it`);
}

// The brief's Avoid list.
const copyText = LANGUAGES.flatMap((lang) => Object.values(site[lang] ?? {})).join('\n');
for (const { pattern, what } of NEVER_SAY) {
  const found = copyText.match(pattern);
  if (found) failures.push(`the copy says ${what}: "${found[0]}"`);
}

// What a new Client repository still has to fill in.
const bracket = /\[[A-Za-zÁÉÍÓÚÑáéíóúñ][^\]\n]{2,}\](?!\()/g;
for (const path of ['src/settings.ts', 'src/content/site.ts', 'wrangler.jsonc', 'CLAUDE.md', 'docs/brief.md']) {
  if (!existsSync(join(ROOT, path))) {
    toFill.push(`${path} is missing`);
    continue;
  }
  // wrangler.jsonc keeps its commented-out "routes" line, with [domain], until Launch.
  const found = [...new Set(code(path).match(bracket) ?? [])];
  if (found.length)
    toFill.push(`${path}: ${found.slice(0, 6).join(' ')}${found.length > 6 ? ` and ${found.length - 6} more` : ''}`);
}
if (DOMAIN === 'example.com') toFill.push('src/settings.ts: DOMAIN is still example.com');
if (JSON.parse(read('package.json')).name === 'client-template')
  toFill.push('package.json: "name" is still client-template');
for (const file of ['favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png', 'og-image.jpg']) {
  if (!existsSync(join(ROOT, 'public', file))) toFill.push(`public/${file} is missing`);
}

if (toFill.length) console.log(`Still to fill in:\n${toFill.map((line) => `  - ${line}`).join('\n')}\n`);
if (process.argv.includes('--launch') && toFill.length)
  failures.push('not ready for Launch: see "Still to fill in" above');

if (failures.length) {
  console.error(failures.map((line) => `FAIL  ${line}`).join('\n'));
  process.exit(1);
}
console.log(
  `OK  ${Object.keys(keys).length} keys in ${LANGUAGES.join(' and ')}, ${source.length} source files checked`,
);
