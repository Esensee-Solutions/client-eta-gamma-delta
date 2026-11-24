/* ==========================================================================
   ALL SITE COPY LIVES HERE, once per language, with the same keys in each.
   Components look text up with t('key'). A key missing from one language
   fails `npm run check` and the build.

   The keys below are the ones the invisible parts need (the page's title and
   description, the language switch, the contact buttons, llms.txt). Add the
   site's own copy under them.
   ========================================================================== */

export const site = {
  es: {
    /* The homepage's <title> and description: what Google and a shared link show. */
    'meta.title': '[Nombre del negocio] | [qué hace] en [pueblo], Puerto Rico',
    'meta.desc': '[Una oración: qué hace el negocio, dónde y para quién.]',

    /* The facts a Customer asks for. They go into llms.txt as written. */
    'facts.hours': '[Horario: lunes a viernes de 8:00 a.m. a 5:00 p.m.]',
    'facts.area': '[Área de servicio: los pueblos o la zona que atiende.]',

    /* One line on each page, for llms.txt. One key per page in src/pages.ts. */
    'pages.home': 'Inicio',
    'pages.home.desc': '[Qué encuentra el cliente en esta página.]',

    'a11y.skip': 'Saltar al contenido',
    'lang.label': 'Idioma',
    'contact.call': 'Llamar',
    'contact.whatsapp': 'WhatsApp',
    'contact.email': 'Email',
    'contact.maps': 'Cómo llegar',
    'llms.hours': 'Horario',
    'llms.area': 'Área de servicio',
    'llms.phone': 'Teléfono',
    'llms.address': 'Dirección',
    'llms.facts': 'Datos',
    'llms.pages': 'Páginas',
  },
  en: {
    'meta.title': '[Business name] | [what it does] in [town], Puerto Rico',
    'meta.desc': '[One sentence: what the business does, where and for whom.]',

    'facts.hours': '[Hours: Monday to Friday, 8:00 a.m. to 5:00 p.m.]',
    'facts.area': '[Service area: the towns or region it serves.]',

    'pages.home': 'Home',
    'pages.home.desc': '[What a Customer finds on this page.]',

    'a11y.skip': 'Skip to content',
    'lang.label': 'Language',
    'contact.call': 'Call',
    'contact.whatsapp': 'WhatsApp',
    'contact.email': 'Email',
    'contact.maps': 'Directions',
    'llms.hours': 'Hours',
    'llms.area': 'Service area',
    'llms.phone': 'Phone',
    'llms.address': 'Address',
    'llms.facts': 'Facts',
    'llms.pages': 'Pages',
  },
} as const;
