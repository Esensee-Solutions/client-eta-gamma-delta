/* /llms.txt (llmstxt.org): a plain summary of the business for AI assistants,
   in the site's main language, built from the copy and settings so it never
   drifts from the pages: the name, one line on what it does and where, the
   facts a Customer asks for, and each page with one line on it. Add the
   business's own sections (services, menu) between the facts and the pages. */
import type { APIRoute } from 'astro';
import { languages, localePath, mainLang, useT } from '../i18n';
import { pages } from '../pages';
import { showPhone } from '../contact';
import { ADDRESS, EMAIL, NAME, PHONE, WHATSAPP } from '../settings';

export const GET: APIRoute = ({ site }) => {
  const t = useT(mainLang);
  const address = [ADDRESS.street, ADDRESS.town, ['PR', ADDRESS.zip].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  const facts = [
    `${t('llms.hours')}: ${t('facts.hours')}`,
    PHONE && `${t('llms.phone')}: ${showPhone(PHONE)}`,
    WHATSAPP && `WhatsApp: ${showPhone(WHATSAPP)}`,
    EMAIL && `Email: ${EMAIL}`,
    ADDRESS.town && `${t('llms.address')}: ${address}`,
    `${t('llms.area')}: ${t('facts.area')}`,
  ].filter(Boolean);
  const links = pages
    .filter((page) => !page.hidden)
    .flatMap((page) =>
      languages.map((lang) => {
        const tl = useT(lang);
        const name =
          languages.length > 1 ? `${tl(`pages.${page.key}`)} (${lang.toUpperCase()})` : tl(`pages.${page.key}`);
        return `- [${name}](${site!.origin + localePath(lang, page.path)}): ${tl(`pages.${page.key}.desc`)}`;
      }),
    );

  const text = `# ${NAME}

> ${t('meta.desc')}

## ${t('llms.facts')}

${facts.map((fact) => `- ${fact}`).join('\n')}

## ${t('llms.pages')}

${links.join('\n')}
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
