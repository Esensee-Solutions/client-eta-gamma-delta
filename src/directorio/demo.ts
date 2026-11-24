/* DEMO ONLY. The three made-up sisters the demo signs in as, so the Client can see each level
   of access on the call without waiting for an email. Their password is public on purpose:
   everything they can reach is invented. Delete this file, the demo buttons and the demo
   sign-ins before real sisters are added. */

export const DEMO = true;
export const DEMO_PASSWORD = 'eta-demo-1928';

export const DEMO_USERS = [
  {
    role: 'hermana',
    email: 'demo-hermana@example.com',
    first: 'Camila',
    last: 'Rivera Ortiz',
    group: 'beta',
    status: 'activa',
    position: null,
    hidden: ['birthday'],
  },
  {
    role: 'directiva',
    email: 'demo-directiva@example.com',
    first: 'Andrea',
    last: 'Torres Medina',
    group: 'beta',
    status: 'activa',
    position: 'Presidenta',
    board: 'beta',
  },
  {
    role: 'general',
    email: 'demo-general@example.com',
    first: 'Marisol',
    last: 'Vélez Santiago',
    group: 'zona-alpha',
    status: 'alumna',
    position: 'Presidenta, Directiva General',
    board: null,
  },
] as const;
