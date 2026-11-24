/* /sitemap.xml: every page in every language, each with its other-language
   versions, so search engines pair them. Hidden pages are left out. */
import type { APIRoute } from 'astro';
import { languages, localePath, mainLang, type Lang } from '../i18n';
import { pages } from '../pages';

export const GET: APIRoute = ({ site }) => {
  const url = (lang: Lang, page: string) => site!.origin + localePath(lang, page);
  const entries = pages
    .filter((page) => !page.hidden)
    .flatMap(({ path }) =>
      languages.map((lang) => {
        const alternates =
          languages.length > 1
            ? [
                ...languages.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l, path)}"/>`),
                `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(mainLang, path)}"/>`,
              ]
            : [];
        return ['  <url>', `    <loc>${url(lang, path)}</loc>`, ...alternates, '  </url>'].join('\n');
      }),
    );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
