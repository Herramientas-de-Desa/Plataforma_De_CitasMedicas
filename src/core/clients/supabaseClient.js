// ============================================================
// supabaseClient.js — Cliente único de Supabase (API reutilizada
// por todos los services). Supabase expone una API REST + Auth
// con JWT; este cliente centraliza la conexión.
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Faltan variables de entorno. Copia .env.example como .env y completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
