"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.server";
import { Fornecedor } from "@/types/db";
import { SupplierForm } from "@/components/SupplierForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadFornecedores() {
    const { data, error } = await supabase.from("fornecedores").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    setFornecedores(data || []);
  }

  useEffect(() => {
    loadFornecedores();
  }, [supabase]);

  return (
    <ProtectedRoute>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-black">Fornecedores</h2>
        </div>

        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-medium text-black">Cadastrar fornecedor</h3>
          <div className="mt-4">
            <SupplierForm onCreated={loadFornecedores} />
          </div>
        </div>

        <div className="rounded-lg border bg-white overflow-x-auto">
          <div className="p-3 sm:p-4 border-b">
            <h3 className="text-base sm:text-lg font-medium text-black">Lista de fornecedores:</h3>
          </div>
          <div className="p-3 sm:p-4">
            {error && <p className="text-xs sm:text-sm text-red-600 mb-3">{error}</p>}
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left bg-gray-50 border-b-2 border-gray-200">
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Codigo</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Nome</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">CPF/CNPJ</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Telefone</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((f, index) => (
                  <tr key={f.id} className={`border-b ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100 transition-colors`}>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.cod_fornecedor}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.nome}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.cpf_cnpj}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.telefone}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.email}</td>
                  </tr>
                ))}
                {fornecedores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 sm:px-6 text-center text-black">Nenhum fornecedor cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}