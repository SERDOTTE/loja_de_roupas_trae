export const dynamic = 'force-dynamic';
"use client";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Fornecedores</h2>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-lg font-medium">Cadastrar fornecedor</h3>
          <div className="mt-4">
            <SupplierForm onCreated={loadFornecedores} />
          </div>
        </div>

        <div className="rounded-lg border bg-white">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">Lista de fornecedores</h3>
          </div>
          <div className="p-4">
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2">Nome</th>
                  <th className="py-2">CPF/CNPJ</th>
                  <th className="py-2">Telefone</th>
                  <th className="py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((f) => (
                  <tr key={f.id} className="border-t">
                    <td className="py-2">{f.nome}</td>
                    <td className="py-2">{f.cpf_cnpj}</td>
                    <td className="py-2">{f.telefone}</td>
                    <td className="py-2">{f.email}</td>
                  </tr>
                ))}
                {fornecedores.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">Nenhum fornecedor cadastrado.</td>
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