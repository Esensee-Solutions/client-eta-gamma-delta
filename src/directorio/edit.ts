/* /directorio/mi-perfil/: her own profile. With ?id=…, a board editing one of its sisters,
   which also shows the fields only boards change. The database enforces both: this page only
   shows what it will accept. */
import { app, avatar, base, db, groups, h, header, isBoard, photoPath, photoUrls, run, say, signedIn, squareJpeg, toast } from './app';

const OWN = ['phone', 'city', 'major', 'grad_year', 'birthday', 'instagram', 'employer'] as const;
const HIDEABLE = ['phone', 'email', 'city', 'birthday', 'instagram', 'employer'];
const BOARD = ['first_name', 'last_name', 'email', 'pledge_class', 'position'] as const;
const TYPES: Record<string, string> = { phone: 'tel', grad_year: 'number', birthday: 'date', email: 'email' };

run(async () => {
  const me = await signedIn();
  const otherId = new URLSearchParams(location.search).get('id');
  const id = otherId ?? me.id;
  header(me, otherId ? 'admin' : 'me');
  const { data, error } = await db.from('members').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return app().replaceChildren(h('p', { class: 'notice' }, say('dir.profile.notfound')));
  const s = data as Record<string, any>;
  const board = isBoard(me) && me.boards.some((b) => b === null || b === s.group_id);
  const hidden = new Set<string>(s.hidden ?? []);

  const field = (name: string) => {
    const input = h(name === 'bio' ? 'textarea' : 'input', {
      id: name, name, type: name === 'bio' ? undefined : TYPES[name] ?? 'text',
      autocomplete: name === 'phone' ? 'tel' : name === 'email' ? 'email' : undefined,
      maxlength: name === 'bio' ? 400 : undefined, rows: name === 'bio' ? 4 : undefined,
      min: name === 'grad_year' ? 1928 : undefined, max: name === 'grad_year' ? 2100 : undefined,
    }) as HTMLInputElement;
    input.value = s[name] ?? '';
    const hide = HIDEABLE.includes(name) && h('label', { class: 'hide' },
      h('input', { type: 'checkbox', name: `hide-${name}`, checked: hidden.has(name) }),
      say('dir.me.hide'));
    return h('div', { class: 'field' }, h('label', { for: name }, say(`dir.f.${name}`)), input, hide);
  };

  const form = h('form', { class: 'card stack', onsubmit: async (e: Event) => {
    e.preventDefault();
    const f = new FormData(form as HTMLFormElement);
    const patch: Record<string, unknown> = {};
    for (const k of [...OWN, 'bio', ...(board ? BOARD : [])]) {
      const v = String(f.get(k) ?? '').trim();
      patch[k] = v === '' ? null : k === 'grad_year' ? Number(v) : v;
    }
    patch.hidden = HIDEABLE.filter((k) => f.get(`hide-${k}`));
    const { error } = await db.from('members').update(patch).eq('id', id).select('id').single();
    if (error) return toast(error.message.includes('directiva') ? error.message : say('dir.error'));
    toast(say('dir.me.saved'));
  } },
    ...OWN.map(field),
    field('bio'),
    h('p', { class: 'muted small' }, say('dir.me.hide.note')),
    board && h('fieldset', { class: 'stack' }, h('legend', {}, say('dir.me.board')), ...BOARD.map(field)),
    h('button', { type: 'submit', class: 'button' }, say('dir.me.save')),
  );

  // Her photo: chosen on the phone, squared and shrunk here, then saved as '<her id>.jpg'.
  const photoBox = h('div', { class: 'photo-edit card' });
  const drawPhoto = async () => {
    const url = (await photoUrls([s as { id: string; photo_at: string | null }])).get(s.id);
    const file = h('input', { type: 'file', accept: 'image/*', id: 'photo', class: 'visually-hidden', onchange: async (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      toast(say('dir.photo.saving'));
      try {
        const jpg = await squareJpeg(f);
        const { error } = await db.storage.from('fotos').upload(photoPath(s.id), jpg, { upsert: true, contentType: 'image/jpeg' });
        if (error) throw error;
        const at = new Date().toISOString();
        const { error: e2 } = await db.from('members').update({ photo_at: at }).eq('id', s.id);
        if (e2) throw e2;
        s.photo_at = at;
        toast(say('dir.photo.saved'));
      } catch (err) {
        console.error(err);
        toast(say('dir.error'));
      }
      drawPhoto();
    } });
    photoBox.replaceChildren(
      avatar(s.first_name, s.last_name, true, url),
      h('div', { class: 'stack' },
        h('p', { class: 'muted small' }, say('dir.photo.note')),
        h('div', { class: 'actions' },
          file,
          h('label', { for: 'photo', class: 'button' }, say(url ? 'dir.photo.change' : 'dir.photo.add')),
          url && h('button', { type: 'button', class: 'button ghost', onclick: async () => {
            await db.storage.from('fotos').remove([photoPath(s.id)]);
            await db.from('members').update({ photo_at: null }).eq('id', s.id);
            s.photo_at = null;
            toast(say('dir.photo.removed'));
            drawPhoto();
          } }, say('dir.photo.remove')),
        ),
      ),
    );
  };
  await drawPhoto();

  const all = await groups();
  app().replaceChildren(
    h('a', { class: 'back', href: `${base}directorio/hermana/?id=${id}` }, `← ${s.first_name} ${s.last_name}`),
    h('h1', {}, otherId ? say('dir.me.other', { name: `${s.first_name} ${s.last_name}` }) : say('dir.me.title')),
    h('p', { class: 'lead' }, say('dir.me.lead')),
    photoBox,
    !board && h('p', { class: 'muted small' }, `${all.find((g) => g.id === s.group_id)?.name ?? ''}${s.pledge_class ? ` · ${s.pledge_class}` : ''}${s.position ? ` · ${s.position}` : ''}`),
    form,
  );
});
