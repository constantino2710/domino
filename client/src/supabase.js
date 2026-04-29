import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;

if (!supabase) {
  // eslint-disable-next-line no-console
  console.warn('Supabase não configurado — Auth indisponível, só modo visitante.');
}
