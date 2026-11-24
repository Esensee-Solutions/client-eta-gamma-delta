/* The members' directory's database (Supabase). Both values are public by design: the key only
   lets a browser ask, and the database's own rules (supabase/migrations/) decide what each
   signed-in sister may see or change. Never put a secret key here. */

export const SUPABASE_URL = 'https://yetacbzysnzforfxobem.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_4Dx1ddZmDjeuH60oSW9P9Q_ES7YnB2I';
