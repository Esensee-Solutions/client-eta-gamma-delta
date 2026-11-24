/* /entrar/: the email link, and (demo only) a button for each role. */
import { app, base, db, h, run, say } from './app';
import { DEMO, DEMO_PASSWORD, DEMO_USERS } from './demo';

run(async () => {
  const { data } = await db.auth.getSession();
  if (data.session) return location.replace(`${base}directorio/`);

  const sent = h('p', { class: 'notice', role: 'status', hidden: true }, say('dir.login.sent'));
  const email = h('input', { type: 'email', name: 'email', id: 'email', required: true, autocomplete: 'email', inputmode: 'email' }) as HTMLInputElement;
  const form = h(
    'form',
    {
      class: 'card stack',
      onsubmit: async (e: Event) => {
        e.preventDefault();
        const { error } = await db.auth.signInWithOtp({
          email: email.value.trim(),
          // Only sisters a board already added can sign in; nobody signs herself up.
          options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}${base}directorio/` },
        });
        sent.textContent = error ? say('dir.notmember') : say('dir.login.sent');
        sent.hidden = false;
      },
    },
    h('label', { for: 'email' }, say('dir.login.email')),
    email,
    h('button', { type: 'submit', class: 'button' }, say('dir.login.send')),
    sent,
  );

  const demo =
    DEMO &&
    h(
      'section',
      { class: 'demo stack', 'aria-labelledby': 'demo-title' },
      h('h2', { id: 'demo-title' }, say('dir.login.demo')),
      h(
        'div',
        { class: 'demo-roles' },
        ...DEMO_USERS.map((u) =>
          h(
            'button',
            {
              type: 'button',
              class: 'role',
              onclick: async (e: Event) => {
                (e.currentTarget as HTMLButtonElement).disabled = true;
                const { error } = await db.auth.signInWithPassword({ email: u.email, password: DEMO_PASSWORD });
                if (error) throw error;
                location.href = `${base}directorio/`;
              },
            },
            h('strong', {}, say(`dir.login.demo.${u.role}`)),
            h('span', {}, say(`dir.login.demo.${u.role}.note`)),
          ),
        ),
      ),
    );

  app().replaceChildren(
    h('h1', {}, say('dir.login.title')),
    h('p', { class: 'lead' }, say('dir.login.lead')),
    form,
    demo,
  );
});
