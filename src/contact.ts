/* The links behind the call, WhatsApp, email and Maps buttons, from the facts
   in src/settings.ts. A fact left as '' gives no link. Ten-digit numbers get
   Puerto Rico's +1. */
import { EMAIL, MAPS_URL, PHONE, WHATSAPP } from './settings';

const digits = (n: string) => {
  const d = n.replace(/\D/g, '');
  return d.length === 10 ? `1${d}` : d;
};

/** '7875550100' → '787-555-0100', for showing a number. */
export const showPhone = (n: string) => n.replace(/\D/g, '').replace(/^1?(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');

export const links = {
  call: PHONE ? `tel:+${digits(PHONE)}` : '',
  whatsapp: WHATSAPP ? `https://wa.me/${digits(WHATSAPP)}` : '',
  email: EMAIL ? `mailto:${EMAIL}` : '',
  maps: MAPS_URL,
};
