import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validação segura que evita erros durante build estático
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Variáveis de ambiente não configuradas. Funcionará apenas no client-side.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any