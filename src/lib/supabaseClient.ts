import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  client = createClient(url, key);
  return client;
}

// Adicione isso antes de criar o cliente do supabase
console.log("Variável URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Variável KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Cadastrada (OK)" : "Vazia");