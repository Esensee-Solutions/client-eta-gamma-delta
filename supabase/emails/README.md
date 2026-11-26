# The directory's emails

Supabase sends two emails, in Spanish, from these files. They live in Supabase's settings, not in
the site: paste each into **Authentication → Emails → Templates** in the Supabase dashboard.

| Template in Supabase | Subject | Body |
|---|---|---|
| **Invite user** (a board adds a sister) | `Te invitaron al directorio de la Eta` | `invitacion.html` |
| **Magic link** (she asks to sign in) | `Tu enlace para entrar al directorio` | `enlace.html` |

They go out through Supabase's custom SMTP (Authentication → Emails → SMTP settings). The demo
uses Estable's Resend account; the real directory will use GoHighLevel's LC Email.

The invitation is sent by the `invitar` function (`supabase/functions/invitar/`), which checks the
board may invite her first. Links come back to the site only if its address is in
**Authentication → URL Configuration → Redirect URLs**.
