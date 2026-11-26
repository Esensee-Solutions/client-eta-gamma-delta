// invitar: sends a sister the email that lets her into the directory.
//
//   POST { member: "<member id>", redirectTo: "https://…/directorio/" }
//
// Called by a board from /directorio/administrar/. It checks, with the caller's own sign-in,
// that she runs this sister's chapter or Zona (public.can_invite), then:
//   - a sister with no account yet gets an invitation (Supabase's "Invite user" email);
//   - a sister who already has one gets a sign-in link ("Magic Link" email).
// The secret key never leaves this function.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// The new keys come as JSON ({"default": "..."}); fall back to the legacy single keys.
function key(json: string, legacy: string): string {
  const raw = Deno.env.get(json);
  if (raw) {
    try {
      return JSON.parse(raw).default;
    } catch { /* fall through */ }
  }
  return Deno.env.get(legacy)!;
}

// Links only ever point back at the Eta's own site (the live demo, its previews, or a local build).
const ALLOWED = [
  /^https:\/\/eta-gamma-delta\.esensee\.workers\.dev\//,
  /^https:\/\/pr-\d+-eta-gamma-delta\.esensee\.workers\.dev\//,
  /^http:\/\/localhost:\d+\//,
];
const DEFAULT_REDIRECT = 'https://eta-gamma-delta.esensee.workers.dev/directorio/';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const publishable = key('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
  const secret = key('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

  let body: { member?: string; redirectTo?: string };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'body' });
  }
  if (!body.member) return reply(400, { error: 'member' });
  const redirectTo = ALLOWED.some((r) => r.test(body.redirectTo ?? '')) ? body.redirectTo! : DEFAULT_REDIRECT;

  // 1. Is the caller allowed? Asked as the caller, so the database's own rules decide.
  const caller = createClient(url, publishable, {
    ...noSession,
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: allowed, error: checkError } = await caller.rpc('can_invite', { p_member: body.member });
  if (checkError || allowed !== true) return reply(403, { error: 'forbidden' });

  // 2. Who is she?
  const admin = createClient(url, secret, noSession);
  const { data: sister, error: readError } = await admin
    .from('members')
    .select('email, first_name, user_id')
    .eq('id', body.member)
    .single();
  if (readError || !sister) return reply(404, { error: 'not_found' });
  if (!sister.email) return reply(400, { error: 'no_email' });

  // 3. Send it.
  const sendLink = async () => {
    const anon = createClient(url, publishable, noSession);
    const { error } = await anon.auth.signInWithOtp({
      email: sister.email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    return error;
  };
  if (sister.user_id) {
    const error = await sendLink();
    return error ? reply(502, { error: 'send', detail: error.message }) : reply(200, { sent: 'link', email: sister.email });
  }
  const { error } = await admin.auth.admin.inviteUserByEmail(sister.email, {
    redirectTo,
    data: { first_name: sister.first_name },
  });
  if (error && /already|registered|exists/i.test(error.message)) {
    const linkError = await sendLink();
    return linkError
      ? reply(502, { error: 'send', detail: linkError.message })
      : reply(200, { sent: 'link', email: sister.email });
  }
  return error ? reply(502, { error: 'send', detail: error.message }) : reply(200, { sent: 'invite', email: sister.email });
});
