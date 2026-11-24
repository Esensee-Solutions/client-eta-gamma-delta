/* What every page of the members' directory shares: the database client, the page's copy,
   a safe way to build HTML, and who is signed in.

   Everything shown about a sister comes from the database and is put on the page with
   textContent, never as HTML, so nothing a sister types can run on another sister's screen. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

export const db: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' },
});

/* The page's copy, put there by DirPage.astro from src/content/site.ts. */
const copy: Record<string, string> = JSON.parse(document.getElementById('dir-copy')?.textContent || '{}');
export const lang = document.documentElement.lang || 'es';
export const base = lang === 'es' ? '/' : `/${lang}/`;
export function say(key: string, vars: Record<string, string | number> = {}): string {
  const text = copy[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

type Child = Node | string | null | undefined | false;
/** h('a', { href: '/x', class: 'y' }, 'text', otherNode) */
export function h(tag: string, attrs: Record<string, unknown> = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

export type Group = { id: string; name: string; kind: 'activo' | 'zona'; place: string; sort: number };
export type Me = { id: string; first_name: string; last_name: string; group_id: string; boards: (string | null)[] };

/** Who is signed in. Sends anyone who isn't to the sign-in page. */
export async function signedIn(): Promise<Me> {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    location.replace(`${base}entrar/`);
    throw new Error('not signed in');
  }
  const { data: rows, error } = await db
    .from('members')
    .select('id, first_name, last_name, group_id')
    .eq('user_id', data.session.user.id);
  if (error) throw error;
  if (!rows?.length) {
    fail(say('dir.notmember'));
    throw new Error('not a member');
  }
  const me = rows[0];
  const { data: boards } = await db.from('admins').select('group_id').eq('member_id', me.id);
  return { ...me, boards: (boards ?? []).map((b) => b.group_id) };
}

export const isGeneral = (me: Me) => me.boards.includes(null);
export const isBoard = (me: Me) => me.boards.length > 0;

let groupsCache: Group[] | null = null;
export async function groups(): Promise<Group[]> {
  if (groupsCache) return groupsCache;
  const { data, error } = await db.from('groups').select('*').order('sort');
  if (error) throw error;
  return (groupsCache = data as Group[]);
}
export const groupName = (list: Group[], id: string) => list.find((g) => g.id === id)?.name ?? id;

/** The directory's header: the brand, the menu, and who is signed in. */
export function header(me: Me, current: 'list' | 'me' | 'admin' | 'none') {
  const link = (key: string, path: string, here: boolean) =>
    h('a', { href: `${base}${path}`, 'aria-current': here ? 'page' : undefined }, say(key));
  const nav = h(
    'nav',
    { class: 'dir-nav', 'aria-label': say('dir.brand') },
    link('dir.nav.list', 'directorio/', current === 'list'),
    link('dir.nav.me', 'directorio/mi-perfil/', current === 'me'),
    isBoard(me) && link('dir.nav.admin', 'directorio/administrar/', current === 'admin'),
    h('button', { type: 'button', class: 'link', onclick: signOut }, say('dir.nav.out')),
  );
  const bar = document.getElementById('dir-header')!;
  bar.replaceChildren(
    h('a', { class: 'dir-brand', href: `${base}directorio/` }, say('dir.brand')),
    nav,
  );
}

export async function signOut() {
  await db.auth.signOut();
  location.href = `${base}entrar/`;
}

export function initials(first: string, last: string) {
  return (first[0] + (last[0] ?? '')).toUpperCase();
}

/** A sister's round initials, coloured from her name so each looks different. */
export function avatar(first: string, last: string, big = false) {
  let n = 0;
  for (const c of first + last) n = (n * 31 + c.charCodeAt(0)) % 360;
  return h('span', { class: big ? 'avatar big' : 'avatar', style: `--hue:${n}`, 'aria-hidden': 'true' }, initials(first, last));
}

export function showPhone(p: string) {
  const d = p.replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

export function showDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'es' ? 'es-PR' : 'en-US', { day: 'numeric', month: 'long' });
}

export const app = () => document.getElementById('app')!;

export function fail(message = say('dir.error')) {
  app().replaceChildren(h('p', { class: 'notice error', role: 'alert' }, message));
}

let toastTimer = 0;
export function toast(message: string) {
  const el = document.getElementById('toast')!;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), 4000);
}

/** Runs a page, and shows a plain error instead of a blank screen if anything goes wrong. */
export function run(page: () => Promise<void>) {
  page().catch((e) => {
    if (e?.message === 'not signed in' || e?.message === 'not a member') return;
    console.error(e);
    fail(e?.message && /[áéíóúñ]|directiva|hermana/i.test(e.message) ? e.message : undefined);
  });
}
