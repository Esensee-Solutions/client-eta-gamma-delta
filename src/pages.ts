/* Every page of the site, once. The sitemap, llms.txt and the hreflang tags
   are built from this list, so a new page is in all of them once it's here.

   path:   the page's address without the language prefix ('' is the homepage,
           'menu/' is /menu/ and /en/menu/).
   key:    where its name and one-line description live in src/content/site.ts
           (pages.<key> and pages.<key>.desc).
   hidden: true keeps a page out of the sitemap, llms.txt and Google
           (a thank-you page). */
export const pages: { path: string; key: string; hidden?: boolean }[] = [
  { path: '', key: 'home' },
  { path: 'entrar/', key: 'entrar', hidden: true },
  { path: 'directorio/', key: 'directorio', hidden: true },
  { path: 'directorio/hermana/', key: 'hermana', hidden: true },
  { path: 'directorio/mi-perfil/', key: 'miperfil', hidden: true },
  { path: 'directorio/administrar/', key: 'administrar', hidden: true },
];
