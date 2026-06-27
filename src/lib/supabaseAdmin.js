import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en las variables de entorno.');
}

// Nota: No lanzamos error fatal aquí para evitar que falle el build de Next.js si la clave no está en tiempo de build,
// pero sí arrojamos error al intentar usar el cliente si falta la clave de servicio.
export const getSupabaseAdmin = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno (.env.local). Debe ser configurada para usar funciones administrativas.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
