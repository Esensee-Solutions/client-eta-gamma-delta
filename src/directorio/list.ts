/* /directorio/: every sister, with search and filters. One list for 50 or 3,000 sisters. */
import { app, avatar, base, db, groupName, groups, h, header, photoUrls, run, say, signedIn } from './app';

type Row = {
  id: string; first_name: string; last_name: string; group_id: string; status: string;
  pledge_class: string | null; position: string | null; major: string | null; city: string | null;
  employer: string | null; grad_year: number | null; is_me: boolean; photo_at: string | null;
};

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

run(async () => {
  const me = await signedIn();
  header(me, 'list');
  const [all, { data, error }] = await Promise.all([groups(), db.rpc('directory')]);
  if (error) throw error;
  const rows = data as Row[];
  const photos = await photoUrls(rows);

  const search = h('input', { type: 'search', id: 'q', placeholder: say('dir.list.search'), 'aria-label': say('dir.list.search') }) as HTMLInputElement;
  const group = h(
    'select',
    { id: 'g', 'aria-label': say('dir.f.group') },
    h('option', { value: '' }, say('dir.list.all')),
    ...all.map((g) => h('option', { value: g.id }, `${g.name} · ${g.place}`)),
  ) as HTMLSelectElement;
  let status = '';
  const chips = h(
    'div',
    { class: 'chips', role: 'group' },
    ...[['', 'dir.list.everyone'], ['activa', 'dir.list.activas'], ['alumna', 'dir.list.alumnas']].map(([value, key]) =>
      h('button', { type: 'button', class: 'chip', 'aria-pressed': String(value === ''), 'data-v': value, onclick: (e: Event) => {
        status = value;
        chips.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
        draw();
      } }, say(key)),
    ),
  );
  const count = h('p', { class: 'count', role: 'status' });
  const list = h('ul', { class: 'cards' });

  const card = (r: Row) =>
    h('li', {},
      h('a', { class: 'card person', href: `${base}directorio/hermana/?id=${r.id}` },
        avatar(r.first_name, r.last_name, false, photos.get(r.id)),
        h('span', { class: 'who' },
          h('strong', {}, `${r.first_name} ${r.last_name}`, r.is_me && h('span', { class: 'tag' }, say('dir.list.you'))),
          h('span', { class: 'pills' },
            h('span', { class: r.group_id.startsWith('zona-') ? 'pill zona' : 'pill' }, groupName(all, r.group_id)),
            r.position && h('span', { class: 'pill cargo' }, r.position),
          ),
          h('span', { class: 'muted' }, [r.pledge_class, r.status === 'alumna' ? r.employer : r.major, r.city].filter(Boolean).join(' · ')),
        ),
      ),
    );

  const draw = () => {
    const words = fold(search.value).split(/\s+/).filter(Boolean);
    const shown = rows.filter((r) => {
      if (group.value && r.group_id !== group.value) return false;
      if (status && r.status !== status) return false;
      const text = fold([r.first_name, r.last_name, r.pledge_class, r.major, r.city, r.employer, r.position, groupName(all, r.group_id), r.grad_year].join(' '));
      return words.every((w) => text.includes(w));
    });
    count.textContent = say('dir.list.count', { n: shown.length });
    list.replaceChildren(...(shown.length ? shown.map(card) : [h('li', { class: 'notice' }, say('dir.list.none'))]));
  };
  search.addEventListener('input', draw);
  group.addEventListener('change', draw);

  app().replaceChildren(
    h('h1', { class: 'page-title' }, say('dir.list.title')),
    h('div', { class: 'filters' }, h('div', { class: 'search' }, search), group, chips),
    count,
    list,
  );
  draw();
});
