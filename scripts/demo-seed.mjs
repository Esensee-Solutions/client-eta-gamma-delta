// Writes supabase/seed-demo.sql: Eta Gamma Delta's chapters and Zonas, made-up sisters, and the
// three demo sign-ins. DEMO ONLY: every name, phone and email here is invented.
//
//   node scripts/demo-seed.mjs        then run supabase/seed-demo.sql on the demo project.
//
// Running the SQL again resets the demo: it deletes every sister and the demo sign-ins first.
import { writeFileSync } from 'node:fs';
import { DEMO_PASSWORD, DEMO_USERS } from '../src/directorio/demo.ts';

// The same made-up list every time.
let seed = 1928;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (list) => list[Math.floor(rand() * list.length)];

const groups = [
  ['alpha', 'Capítulo Alpha', 'activo', 'UPR Río Piedras', 1],
  ['beta', 'Capítulo Beta', 'activo', 'UPR Mayagüez', 2],
  ['gamma', 'Capítulo Gamma', 'activo', 'Inter, San Germán', 3],
  ['delta', 'Capítulo Delta', 'activo', 'PUCPR, Ponce', 4],
  ['zona-alpha', 'Zona Alpha', 'zona', 'San Juan', 10],
  ['zona-beta', 'Zona Beta', 'zona', 'Mayagüez', 11],
  ['zona-gamma', 'Zona Gamma', 'zona', 'San Germán', 12],
  ['zona-delta', 'Zona Delta', 'zona', 'Ponce', 13],
  ['zona-epsilon', 'Zona Epsilon', 'zona', 'Yauco', 14],
  ['zona-kappa', 'Zona Kappa', 'zona', 'Arecibo', 15],
  ['zona-omega', 'Zona Omega', 'zona', 'Orlando, Florida', 16],
  ['zona-tau', 'Zona Tau', 'zona', 'Tampa, Florida', 17],
];
const town = Object.fromEntries(groups.map(([id, , , place]) => [id, place.split(',')[0].replace(/^(UPR|Inter|PUCPR) ?/, '') || 'San Juan']));
Object.assign(town, { alpha: 'Río Piedras', beta: 'Mayagüez', gamma: 'San Germán', delta: 'Ponce' });

const first = ['Adriana', 'Alejandra', 'Ana Sofía', 'Andrea', 'Beatriz', 'Camila', 'Carla', 'Carmen', 'Cristina', 'Daniela', 'Elena', 'Gabriela', 'Isabel', 'Jimena', 'Laura', 'Lucía', 'Marisol', 'María José', 'Mariana', 'Mónica', 'Natalia', 'Paola', 'Patricia', 'Paula', 'Raquel', 'Rocío', 'Sofía', 'Valeria', 'Verónica', 'Yolanda'];
const last = ['Acevedo', 'Alicea', 'Báez', 'Colón', 'Cruz', 'Díaz', 'Feliciano', 'García', 'González', 'Irizarry', 'Laboy', 'López', 'Maldonado', 'Martínez', 'Medina', 'Méndez', 'Morales', 'Negrón', 'Ortiz', 'Pagán', 'Quiñones', 'Ramos', 'Rivera', 'Rodríguez', 'Rosado', 'Santiago', 'Soto', 'Torres', 'Vázquez', 'Vélez'];
const majors = ['Biología', 'Ingeniería Química', 'Ingeniería Industrial', 'Contabilidad', 'Comunicaciones', 'Psicología', 'Enfermería', 'Administración de Empresas', 'Ciencias Políticas', 'Arquitectura', 'Educación', 'Mercadeo'];
const employers = ['Banco Popular', 'Hospital Auxilio Mutuo', 'Departamento de Educación', 'Evertec', 'Lilly del Caribe', 'Oficina propia', 'AdventHealth', 'Universidad de Puerto Rico', 'Liberty', 'Triple-S'];
const positions = ['Presidenta', 'Vicepresidenta', 'Secretaria', 'Tesorera'];

const people = [];
const used = new Set();
const person = (group, status, extra = {}) => {
  let name;
  do name = `${pick(first)}|${pick(last)} ${pick(last)}`;
  while (used.has(name));
  used.add(name);
  const [fn, ln] = name.split('|');
  const year = status === 'activa' ? 2026 + Math.floor(rand() * 4) : 1975 + Math.floor(rand() * 50);
  const slug = `${fn}.${ln.split(' ')[0]}`.normalize('NFD').replace(/[^\w.]/g, '').toLowerCase();
  people.push({
    first_name: fn,
    last_name: ln,
    group_id: group,
    status,
    email: `${slug}${people.length}@example.com`,
    phone: `787${String(2000000 + Math.floor(rand() * 7999999))}`,
    city: group.startsWith('zona-omega') ? 'Orlando' : group.startsWith('zona-tau') ? 'Tampa' : town[group],
    major: pick(majors),
    grad_year: year,
    pledge_class: `${rand() < 0.5 ? 'Primavera' : 'Otoño'} ${year - 3}`,
    birthday: `${year - 22}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
    instagram: rand() < 0.6 ? `@${slug.replace('.', '_')}` : null,
    employer: status === 'alumna' ? pick(employers) : null,
    hidden: rand() < 0.25 ? ['phone', 'birthday'] : rand() < 0.15 ? ['city'] : [],
    position: null,
    ...extra,
  });
};

// The three demo sign-ins first, so they're easy to find.
for (const u of DEMO_USERS) person(u.group, u.status, { first_name: u.first, last_name: u.last, email: u.email, position: u.position, hidden: u.hidden ?? [], instagram: `@${u.first.toLowerCase()}_${u.last.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}` });
for (const [id, , kind] of groups) {
  const n = kind === 'activo' ? 9 : 4;
  for (let i = 0; i < n; i++) person(id, kind === 'activo' ? 'activa' : 'alumna', i < 2 && id !== 'beta' ? { position: positions[i] } : i === 0 ? { position: 'Secretaria' } : {});
}

const q = (v) => (v === null || v === undefined ? 'null' : Array.isArray(v) ? `array[${v.map(q).join(',')}]::text[]` : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const cols = ['first_name', 'last_name', 'group_id', 'status', 'email', 'phone', 'city', 'major', 'grad_year', 'pledge_class', 'birthday', 'instagram', 'employer', 'hidden', 'position'];

const sql = `-- DEMO DATA ONLY: generated by scripts/demo-seed.mjs. Every person here is made up.
-- Running it again resets the demo.
begin;
delete from public.moves;
delete from public.admins;
delete from public.members;
delete from auth.users where email in (${DEMO_USERS.map((u) => q(u.email)).join(', ')});

insert into public.groups (id, name, kind, place, sort) values
${groups.map((g) => `  (${g.map(q).join(', ')})`).join(',\n')}
on conflict (id) do update set name = excluded.name, kind = excluded.kind, place = excluded.place, sort = excluded.sort;

insert into public.members (${cols.join(', ')}) values
${people.map((p) => `  (${cols.map((c) => q(p[c])).join(', ')})`).join(',\n')};

-- Boards: the demo board runs Beta; the demo Directiva General runs everything.
${DEMO_USERS.filter((u) => u.board !== undefined)
  .map((u) => `insert into public.admins (member_id, group_id) select id, ${q(u.board)} from public.members where email = ${q(u.email)};`)
  .join('\n')}

-- The demo sign-ins (password ${q(DEMO_PASSWORD)}). Creating them ties each to her row above.
${DEMO_USERS.map(
  (u) => `with u as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    ${q(u.email)}, extensions.crypt(${q(DEMO_PASSWORD)}, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
  returning id, email)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', now(), now(), now() from u;`,
).join('\n\n')}
commit;
`;

writeFileSync(new URL('../supabase/seed-demo.sql', import.meta.url), sql);
console.log(`supabase/seed-demo.sql: ${groups.length} groups, ${people.length} sisters, ${DEMO_USERS.length} demo sign-ins`);
