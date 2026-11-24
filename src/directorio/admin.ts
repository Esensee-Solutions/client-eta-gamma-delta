/* /directorio/administrar/: the boards' tools. A chapter or Zona board sees its own sisters; the
   Directiva General sees everyone. The database refuses anything outside a board's reach, so
   this page only offers what it will accept. */
import { app, base, db, groupName, groups, h, header, isBoard, isGeneral, run, say, signedIn, toast, type Group, type Me } from './app';
import { DEMO } from './demo';

run(async () => {
  const me = await signedIn();
  header(me, 'admin');
  if (!isBoard(me)) return location.replace(`${base}directorio/`);
  const all = await groups();
  const mine: Group[] = isGeneral(me) ? all : all.filter((g) => me.boards.includes(g.id));
  let current = mine[0].id;

  const picker = h('select', { id: 'group', onchange: (e: Event) => { current = (e.target as HTMLSelectElement).value; draw(); } },
    ...mine.map((g) => h('option', { value: g.id }, `${g.name} · ${g.place}`))) as HTMLSelectElement;
  const list = h('div', { class: 'admin-list' });
  const addForm = addSister(() => current, draw);

  app().replaceChildren(
    h('h1', {}, say('dir.admin.title')),
    h('p', { class: 'lead' }, say('dir.admin.lead', { scope: isGeneral(me) ? say('dir.admin.everything') : mine.map((g) => g.name).join(', ') })),
    h('div', { class: 'filters' },
      h('label', { for: 'group' }, say('dir.admin.group')), picker,
      h('button', { type: 'button', class: 'button ghost', onclick: () => exportCsv(me, all) }, say('dir.admin.export'))),
    list,
    addForm,
  );

  async function draw() {
    const [{ data: people, error }, { data: boards }] = await Promise.all([
      db.from('members').select('id, first_name, last_name, email, position, user_id').eq('group_id', current).order('last_name'),
      db.from('admins').select('id, member_id, group_id').eq('group_id', current),
    ]);
    if (error) throw error;
    const boardOf = new Map((boards ?? []).map((b) => [b.member_id, b.id]));
    list.replaceChildren(h('ul', { class: 'rows' }, ...(people ?? []).map((p) => {
      const name = `${p.first_name} ${p.last_name}`;
      const move = h('select', { 'aria-label': `${say('dir.admin.move')}: ${name}`, onchange: async (e: Event) => {
        const to = (e.target as HTMLSelectElement).value;
        if (!to) return;
        const { error } = await db.rpc('move_member', { p_member: p.id, p_to: to });
        if (error) return toast(error.message);
        toast(say('dir.admin.moved', { name, group: groupName(all, to) }));
        draw();
      } }, h('option', { value: '' }, say('dir.admin.move.to')),
        ...all.filter((g) => g.id !== current).map((g) => h('option', { value: g.id }, g.name)));
      const boardId = boardOf.get(p.id);
      return h('li', { class: 'row' },
        h('div', { class: 'who' },
          h('a', { href: `${base}directorio/hermana/?id=${p.id}` }, h('strong', {}, name)),
          h('span', { class: 'muted small' }, [p.position, boardId && say('dir.admin.board'), !p.user_id && say('dir.admin.nologin')].filter(Boolean).join(' · '))),
        h('div', { class: 'row-actions' },
          h('a', { class: 'button small ghost', href: `${base}directorio/mi-perfil/?id=${p.id}` }, say('dir.admin.edit')),
          move,
          h('button', { type: 'button', class: 'button small ghost', onclick: async () => {
            const { error } = boardId
              ? await db.from('admins').delete().eq('id', boardId)
              : await db.from('admins').insert({ member_id: p.id, group_id: current });
            if (error) return toast(say('dir.error'));
            draw();
          } }, say(boardId ? 'dir.admin.unboard' : 'dir.admin.makeboard')),
          p.id !== me.id && h('button', { type: 'button', class: 'button small danger', onclick: async () => {
            if (!confirm(say('dir.admin.remove.confirm', { name }))) return;
            const { error } = await db.from('members').delete().eq('id', p.id);
            if (error) return toast(say('dir.error'));
            draw();
          } }, say('dir.admin.remove')),
        ),
      );
    })));
  }
  await draw();
});

function addSister(group: () => string, done: () => void) {
  const field = (name: string, type = 'text') =>
    h('div', { class: 'field' }, h('label', { for: `new-${name}` }, say(`dir.f.${name}`)), h('input', { id: `new-${name}`, name, type, required: true }));
  const form = h('form', { class: 'card stack', onsubmit: async (e: Event) => {
    e.preventDefault();
    const f = new FormData(form as HTMLFormElement);
    const { error } = await db.from('members').insert({
      first_name: String(f.get('first_name')).trim(),
      last_name: String(f.get('last_name')).trim(),
      email: String(f.get('email')).trim().toLowerCase(),
      group_id: group(),
      status: group().startsWith('zona-') ? 'alumna' : 'activa',
    });
    if (error) return toast(say('dir.error'));
    // The real directory sends her invitation here (a small server function with Supabase's
    // invite). The demo sends nothing.
    toast(DEMO ? say('dir.admin.added') : say('dir.me.saved'));
    (form as HTMLFormElement).reset();
    done();
  } },
    h('h2', {}, say('dir.admin.add')),
    h('p', { class: 'muted small' }, say('dir.admin.add.note')),
    field('first_name'), field('last_name'), field('email', 'email'),
    h('button', { type: 'submit', class: 'button' }, say('dir.admin.add.button')),
  );
  return form;
}

/** Everyone this board runs, as a file Excel opens. */
async function exportCsv(me: Me, all: Group[]) {
  const { data, error } = await db.from('members').select('*').order('group_id').order('last_name');
  if (error) return toast(say('dir.error'));
  const cols = ['first_name', 'last_name', 'group_id', 'status', 'pledge_class', 'position', 'email', 'phone', 'city', 'major', 'grad_year', 'birthday', 'instagram', 'employer'];
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    cols.map((c) => cell(c === 'group_id' ? say('dir.f.group') : say(`dir.f.${c}`) === `dir.f.${c}` ? c : say(`dir.f.${c}`))).join(','),
    ...(data ?? []).map((r) => cols.map((c) => cell(c === 'group_id' ? groupName(all, r.group_id) : r[c])).join(',')),
  ];
  // The BOM makes Excel read the accents correctly.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `directorio-eta-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
  void me;
}
