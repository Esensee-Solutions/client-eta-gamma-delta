/* ==========================================================================
   The business's facts that aren't copy: its name, domain, languages and how
   Customers reach it. Copy lives in src/content/site.ts.

   Fill in every '[bracket]' from the Design brief (docs/brief.md). Leave a
   fact the business doesn't have as '' and the site leaves it out.
   `npm run check` lists what's still to fill in.
   ========================================================================== */

export const NAME = '[Business name]';

/* The bare domain, without https:// or www. */
export const DOMAIN = 'example.com';

/* The site's languages, the main one first. The main language is at /, any
   other at /<language>/. For one language, keep one and delete the other's
   folder in src/pages/. */
export const LANGUAGES = ['es', 'en'] as const;

/* Ten digits, no spaces or dashes: '7875550100'. */
export const PHONE = '[phone]';
export const WHATSAPP = '[whatsapp]';
export const EMAIL = '[email]';

export const ADDRESS = {
  street: '[street]',
  town: '[town]',
  zip: '[zip]',
};

/* The business's Google Maps link (Share → Copy link on its Business Profile). */
export const MAPS_URL = '[maps link]';

/* schema.org's type for the business: 'Restaurant', 'AutoRepair', 'HairSalon',
   'Dentist'… ('LocalBusiness' when nothing closer fits). */
export const BUSINESS_TYPE = 'LocalBusiness';

/* The Client's brand color. Layout.astro puts it in --brand on :root and in
   <meta name="theme-color">; the Credit's mark takes its color from there. */
export const BRAND = '#000000';

/* Estable builds and runs the site; the footer's Credit links here. */
export const ESTABLE_URL = 'https://estable.studio/';
