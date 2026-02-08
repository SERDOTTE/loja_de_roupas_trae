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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Logo/Title */}
        <h1 className="text-xl font-semibold text-black mb-4">Loja de Roupas - Madame</h1>
        
        {/* Navigation Menu */}
        <nav className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <Link href="/" className="text-sm text-black hover:text-blue-600">Dashboard</Link>
            <Link href="/fornecedores" className="text-sm text-black hover:text-blue-600">Fornecedores</Link>
            <Link href="/clientes" className="text-sm text-black hover:text-blue-600">Clientes</Link>
            <Link href="/produtos" className="text-sm text-black hover:text-blue-600">Produtos</Link>
          </div>
          
          {/* User Info and Logout */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:pl-6 md:border-l md:border-gray-300">
            <span className="text-sm text-black">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 w-fit"
            >
              Sair
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
