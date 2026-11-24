// Signs in as each demo role against the demo database and checks each one sees and changes
// only what she should. Every change it makes, it undoes.
//
//   npm test
//
// Needs the demo data (supabase/seed-demo.sql). These are the rules the proposal promises, so
// a failure here means the directory is not safe to show anyone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../src/directorio/config.ts';
import { DEMO_PASSWORD, DEMO_USERS } from '../src/directorio/demo.ts';

const client = () => createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const as = async (role) => {
  const c = client();
  const { email } = DEMO_USERS.find((u) => u.role === role);
  const { error } = await c.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  assert.ifError(error);
  return c;
};
const rows = async (q) => {
  const { data, error } = await q;
  assert.ifError(error);
  return data;
};
const fails = async (q, what) => {
  const { error } = await q;
  assert.ok(error, `${what} should have been refused`);
};

const anon = client();
const hermana = await as('hermana');
const directiva = await as('directiva');
const general = await as('general');

// Sisters the tests look at (from the demo data).
const general_ = await rows(general.from('members').select('id, email, group_id, phone, position, status'));
const byEmail = (e) => general_.find((m) => m.email === e);
const camila = byEmail('demo-hermana@example.com'); // the demo sister, Beta
const carmenBeta = byEmail('carmen.feliciano16@example.com'); // Beta, hides her phone
const isabelBeta = byEmail('isabel.colon12@example.com'); // Beta, shows her phone
const patriciaAlpha = byEmail('patricia.martinez7@example.com'); // Alpha, hides her phone
const paulaBeta = byEmail('paula.maldonado20@example.com'); // Beta, graduates in a test

test('the demo data is there', () => {
  assert.equal(general_.length, 71);
  for (const m of [camila, carmenBeta, isabelBeta, patriciaAlpha, paulaBeta]) assert.ok(m);
});

test('someone not signed in sees nothing', async () => {
  await fails(anon.rpc('directory'), 'the directory without signing in');
  assert.deepEqual(await rows(anon.from('members').select('id')), []);
  assert.deepEqual(await rows(anon.from('groups').select('id')), []);
});

test('a sister sees everyone, minus what others hid', async () => {
  const dir = await rows(hermana.rpc('directory'));
  assert.equal(dir.length, 71);
  assert.equal(dir.find((m) => m.id === carmenBeta.id).phone, null, 'a hidden phone stays hidden');
  assert.equal(dir.find((m) => m.id === isabelBeta.id).phone, isabelBeta.phone, 'a shown phone shows');
  assert.equal(dir.find((m) => m.id === camila.id).is_me, true);
  assert.ok(dir.find((m) => m.id === camila.id).birthday, 'she sees her own hidden birthday');
});

test('a sister reads only her own full row', async () => {
  const mine = await rows(hermana.from('members').select('id'));
  assert.deepEqual(mine.map((m) => m.id), [camila.id]);
});

test('a sister edits her own profile, not the board-only fields', async () => {
  await rows(hermana.from('members').update({ phone: '7870000000' }).eq('id', camila.id).select('id'));
  assert.equal(byId(await rows(general.from('members').select('id, phone')), camila.id).phone, '7870000000');
  await rows(hermana.from('members').update({ phone: camila.phone }).eq('id', camila.id).select('id'));

  await fails(hermana.from('members').update({ position: 'Presidenta' }).eq('id', camila.id), 'naming herself Presidenta');
  await fails(hermana.from('members').update({ group_id: 'alpha' }).eq('id', camila.id), 'moving herself');
  await fails(hermana.from('members').update({ status: 'alumna' }).eq('id', camila.id), 'changing her status');
});

test("a sister can't touch anyone else", async () => {
  const changed = await rows(hermana.from('members').update({ phone: '7871111111' }).eq('id', isabelBeta.id).select('id'));
  assert.deepEqual(changed, []);
  assert.equal(byId(await rows(general.from('members').select('id, phone')), isabelBeta.id).phone, isabelBeta.phone);
  await fails(hermana.from('members').insert({ first_name: 'X', last_name: 'Y', group_id: 'beta' }), 'adding a sister');
  assert.deepEqual(await rows(hermana.from('members').delete().eq('id', isabelBeta.id).select('id')), []);
  await fails(hermana.rpc('move_member', { p_member: isabelBeta.id, p_to: 'zona-beta' }), 'moving another sister');
  await fails(hermana.from('admins').insert({ member_id: camila.id, group_id: null }), 'making herself Directiva General');
  await fails(hermana.from('admins').insert({ member_id: camila.id, group_id: 'beta' }), 'making herself a board');
});

test("Beta's board runs Beta and only Beta", async () => {
  const theirs = await rows(directiva.from('members').select('group_id'));
  assert.ok(theirs.length > 0 && theirs.every((m) => m.group_id === 'beta'));

  const dir = await rows(directiva.rpc('directory'));
  assert.equal(dir.find((m) => m.id === carmenBeta.id).phone, carmenBeta.phone, 'her board sees a hidden phone');
  assert.equal(dir.find((m) => m.id === patriciaAlpha.id).phone, null, "another chapter's hidden phone stays hidden");

  await rows(directiva.from('members').update({ position: 'Tesorera' }).eq('id', isabelBeta.id).select('id'));
  await rows(directiva.from('members').update({ position: isabelBeta.position }).eq('id', isabelBeta.id).select('id'));
  assert.deepEqual(await rows(directiva.from('members').update({ position: 'X' }).eq('id', patriciaAlpha.id).select('id')), []);
  await fails(directiva.from('members').update({ group_id: 'alpha' }).eq('id', isabelBeta.id), 'moving by a plain edit');
});

test("Beta's board adds and removes Beta sisters, and names Beta's next board", async () => {
  const [added] = await rows(directiva.from('members').insert({ first_name: 'Nueva', last_name: 'Prueba', email: 'nueva@example.com', group_id: 'beta' }).select('id, user_id'));
  assert.equal(added.user_id, null);
  await rows(directiva.from('members').delete().eq('id', added.id).select('id'));
  await fails(directiva.from('members').insert({ first_name: 'X', last_name: 'Y', group_id: 'alpha' }), 'adding to Alpha');

  const [board] = await rows(directiva.from('admins').insert({ member_id: isabelBeta.id, group_id: 'beta' }).select('id'));
  await rows(directiva.from('admins').delete().eq('id', board.id).select('id'));
  await fails(directiva.from('admins').insert({ member_id: isabelBeta.id, group_id: null }), 'naming a Directiva General');
  await fails(directiva.from('admins').insert({ member_id: patriciaAlpha.id, group_id: 'alpha' }), "naming Alpha's board");
  await fails(directiva.from('admins').insert({ member_id: patriciaAlpha.id, group_id: 'beta' }), 'putting an Alpha sister on Beta’s board');
});

test('a graduate moves to her Zona, and only the right people can move her', async () => {
  await rows(directiva.rpc('move_member', { p_member: paulaBeta.id, p_to: 'zona-beta' }));
  let paula = byId(await rows(general.from('members').select('id, group_id, status')), paulaBeta.id);
  assert.deepEqual([paula.group_id, paula.status], ['zona-beta', 'alumna']);
  await fails(directiva.rpc('move_member', { p_member: paulaBeta.id, p_to: 'beta' }), "moving a sister who's no longer Beta's");

  const log = await rows(general.from('moves').select('member_id, from_group, to_group').eq('member_id', paulaBeta.id));
  assert.deepEqual(log.at(-1), { member_id: paulaBeta.id, from_group: 'beta', to_group: 'zona-beta' });

  await rows(general.rpc('move_member', { p_member: paulaBeta.id, p_to: 'beta' }));
  await rows(general.from('members').update({ status: 'activa' }).eq('id', paulaBeta.id).select('id'));
  await rows(general.from('moves').delete().eq('member_id', paulaBeta.id).select('id'));
  paula = byId(await rows(general.from('members').select('id, group_id, status')), paulaBeta.id);
  assert.deepEqual([paula.group_id, paula.status], ['beta', 'activa']);
});

test('the Directiva General sees and runs everyone', async () => {
  const dir = await rows(general.rpc('directory'));
  assert.equal(dir.find((m) => m.id === patriciaAlpha.id).phone, patriciaAlpha.phone);
  assert.ok(dir.every((m) => m.can_edit));
});

function byId(list, id) {
  return list.find((m) => m.id === id);
}
