/* /directorio/hermana/?id=…: one page that fills itself in with whichever sister was chosen. */
import { app, avatar, base, db, groupName, groups, h, header, run, say, showDate, showPhone, signedIn } from './app';

run(async () => {
  const me = await signedIn();
  header(me, 'none');
  const id = new URLSearchParams(location.search).get('id');
  const [all, { data, error }] = await Promise.all([groups(), db.rpc('directory')]);
  if (error) throw error;
  const s = (data as any[]).find((r) => r.id === id);
  const back = h('a', { class: 'back', href: `${base}directorio/` }, say('dir.profile.back'));
  if (!s) return app().replaceChildren(back, h('p', { class: 'notice' }, say('dir.profile.notfound')));

  document.title = `${s.first_name} ${s.last_name} | Eta Gamma Delta`;
  const digits = s.phone ? s.phone.replace(/\D/g, '').slice(-10) : '';
  const row = (key: string, value: Node | string | null) =>
    value ? h('div', { class: 'fact' }, h('dt', {}, say(key)), h('dd', {}, value)) : null;
  const facts = [
    row('dir.f.pledge_class', s.pledge_class),
    row('dir.f.major', s.major),
    row('dir.f.grad_year', s.grad_year && String(s.grad_year)),
    row('dir.f.employer', s.employer),
    row('dir.f.city', s.city),
    row('dir.f.birthday', s.birthday && showDate(s.birthday)),
    row('dir.f.phone', s.phone && h('a', { href: `tel:+1${digits}` }, showPhone(s.phone))),
    row('dir.f.email', s.email && h('a', { href: `mailto:${s.email}` }, s.email)),
    row('dir.f.instagram', s.instagram && h('a', { href: `https://instagram.com/${s.instagram.replace(/^@/, '')}`, rel: 'noopener', target: '_blank' }, s.instagram)),
  ];
  // Fields come back empty when she hid them; say so, so nobody thinks the directory is broken.
  const someHidden = !s.can_edit && ['phone', 'email', 'city', 'birthday'].some((k) => s[k] === null);

  app().replaceChildren(
    back,
    h('article', { class: 'profile' },
      h('div', { class: 'profile-banner' }),
      h('div', { class: 'profile-body' },
      h('header', { class: 'profile-head' },
        avatar(s.first_name, s.last_name, true),
        h('div', {},
          h('h1', {}, `${s.first_name} ${s.last_name}`),
          h('span', { class: 'pills' },
            h('span', { class: s.group_id.startsWith('zona-') ? 'pill zona' : 'pill' }, groupName(all, s.group_id)),
            h('span', { class: 'pill' }, say(`dir.status.${s.status}`)),
            s.position && h('span', { class: 'pill role' }, s.position),
          ),
        ),
      ),
      digits && h('div', { class: 'actions' },
        h('a', { class: 'button', href: `tel:+1${digits}` }, say('dir.profile.call')),
        h('a', { class: 'button ghost', href: `https://wa.me/1${digits}`, rel: 'noopener', target: '_blank' }, say('dir.profile.whatsapp')),
      ),
      s.bio && h('p', { class: 'bio' }, s.bio),
      h('dl', { class: 'facts' }, ...facts),
      someHidden && h('p', { class: 'muted small' }, say('dir.profile.hidden')),
      s.can_edit && h('a', { class: 'button ghost', href: `${base}directorio/mi-perfil/${s.is_me ? '' : `?id=${s.id}`}` }, say('dir.profile.edit')),
      ),
    ),
  );
});
