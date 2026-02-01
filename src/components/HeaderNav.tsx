"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function HeaderNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Não mostrar header na página de login
  if (!user) {
    return null;
  }

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Loja de Roupas - Madame</h1>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm hover:text-blue-600">Dashboard</Link>
          <Link href="/fornecedores" className="text-sm hover:text-blue-600">Fornecedores</Link>
          <Link href="/produtos" className="text-sm hover:text-blue-600">Produtos</Link>
          <div className="flex items-center gap-3 pl-6 border-l">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
