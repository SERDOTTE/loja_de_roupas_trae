'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase.server";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log de debug
  useEffect(() => {
    console.log("URL Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Key existe:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log("Supabase client disponível:", !!supabase);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setError("Supabase não está configurado. Verifique as variáveis de ambiente.");
      return;
    }

    if (!email || !password) {
      setError("Preencha email e senha");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor. Tente novamente.");
      console.error("Erro de login:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 p-2 sm:p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Loja de Roupas</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Sistema de Gestão</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-md border border-gray-300 px-3 sm:px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-black mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-3 sm:px-4 py-2 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-xs sm:text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm sm:text-base text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-600">
          <p>Credenciais de acesso via Supabase Authentication</p>
        </div>
      </div>
    </div>
  );
}
