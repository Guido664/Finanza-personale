
import { createClient } from '@supabase/supabase-js';

// Helper per accedere in modo sicuro alle variabili d'ambiente
const getEnv = (key: string) => {
  // Controlla import.meta.env (Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  // Controlla process.env (Node, CRA, Webpack)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Mancano le variabili d'ambiente VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Assicurati di averle configurate.");
}

// Utilizza stringhe vuote come fallback per evitare che l'app vada in crash all'importazione
// Il client Supabase lancerà un errore specifico se usato senza URL valido
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
