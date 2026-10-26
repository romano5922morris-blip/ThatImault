import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** null quand Supabase n'est pas configuré : l'interface affiche alors une erreur explicite, jamais de fausses données. */
export const supabase = url && key ? createClient(url, key) : null;
export const isConfigured = supabase !== null;

export function db() {
  if (!supabase) throw new Error('not_configured');
  return supabase;
}
