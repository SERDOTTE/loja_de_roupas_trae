"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function HeaderNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    router.push("/login");
  };

  // Não mostrar header na página de login
  if (!user) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-black">Loja de Roupas - Madame</h1>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-md border border-gray-300 px-2 py-1 text-black"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <div className="h-14 md:hidden" />

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 border-b border-gray-200 bg-white shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm text-black hover:text-blue-600">Dashboard</Link>
            <Link href="/fornecedores" onClick={() => setMobileMenuOpen(false)} className="text-sm text-black hover:text-blue-600">Fornecedores</Link>
            <Link href="/clientes" onClick={() => setMobileMenuOpen(false)} className="text-sm text-black hover:text-blue-600">Clientes</Link>
            <Link href="/produtos" onClick={() => setMobileMenuOpen(false)} className="text-sm text-black hover:text-blue-600">Produtos</Link>
            <Link href="/?openSalesModal=1" onClick={() => setMobileMenuOpen(false)} className="text-sm text-black hover:text-blue-600">Cadastrar Venda</Link>

            <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
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
      )}

      <div className="max-w-6xl mx-auto px-4 py-4 hidden md:block">
        <h1 className="text-xl font-semibold text-black mb-4">Loja de Roupas - Madame</h1>

        <nav className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <Link href="/" className="text-sm text-black hover:text-blue-600">Dashboard</Link>
            <Link href="/fornecedores" className="text-sm text-black hover:text-blue-600">Fornecedores</Link>
            <Link href="/clientes" className="text-sm text-black hover:text-blue-600">Clientes</Link>
            <Link href="/produtos" className="text-sm text-black hover:text-blue-600">Produtos</Link>
            <Link href="/?openSalesModal=1" className="text-sm text-black hover:text-blue-600">Cadastrar Venda</Link>
          </div>

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
