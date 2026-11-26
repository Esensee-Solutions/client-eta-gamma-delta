/* The members' directory's database (Supabase). Both values are public by design: the key only
   lets a browser ask, and the database's own rules (supabase/migrations/) decide what each
   signed-in sister may see or change. Never put a secret key here. */

export const SUPABASE_URL = 'https://impxoowvtpljoxbojdir.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_2cJpI3Bk9hI2rgz8GHr49A_F0QCY8kH';
