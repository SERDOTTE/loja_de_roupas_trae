"use client";
export const dynamic = 'force-dynamic';
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.server";
import { Cliente } from "@/types/db";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function ClienteForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState({
    cliente_nome: "",
    cliente_cpf_cnpj: "",
    cliente_fone: "",
    cliente_email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { cliente_nome, cliente_cpf_cnpj } = form;
    if (!cliente_nome || !cliente_cpf_cnpj) {
      setError("Nome e CPF/CNPJ são obrigatórios.");
      setLoading(false);
      return;
    }

    const payload = {
      cliente_nome,
      cliente_cpf_cnpj,
      cliente_fone: form.cliente_fone || null,
      cliente_email: form.cliente_email || null,
    };

    const { error } = await supabase.from("clientes").insert(payload);
    if (error) {
      setError(error.message);
    } else {
      setForm({ cliente_nome: "", cliente_cpf_cnpj: "", cliente_fone: "", cliente_email: "" });
      onCreated?.();
    }
    setLoading(false);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Nome *</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="Nome do cliente"
            value={form.cliente_nome}
            onChange={(e) => setForm((f) => ({ ...f, cliente_nome: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">CPF/CNPJ *</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="000.000.000-00"
            value={form.cliente_cpf_cnpj}
            onChange={(e) => setForm((f) => ({ ...f, cliente_cpf_cnpj: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Telefone</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="(00) 00000-0000"
            value={form.cliente_fone}
            onChange={(e) => setForm((f) => ({ ...f, cliente_fone: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">E-mail</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="email@exemplo.com"
            value={form.cliente_email}
            onChange={(e) => setForm((f) => ({ ...f, cliente_email: e.target.value }))}
          />
        </div>
      </div>

      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full sm:w-auto rounded-md bg-blue-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Salvando..." : "Salvar cliente"}
      </button>
    </form>
  );
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadClientes = useCallback(async () => {
    const { data, error: fetchError } = await supabase.from("clientes").select("*").order("cliente_nome");
    if (fetchError) {
      setError(`Erro ao carregar clientes: ${fetchError.message}`);
    } else {
      setClientes(data || []);
      setError(null);
    }
  }, []);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  return (
    <ProtectedRoute>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-black">Clientes</h2>
        </div>

        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-medium text-black">Cadastrar cliente</h3>
          <div className="mt-4">
            <ClienteForm onCreated={loadClientes} />
          </div>
        </div>

        <div className="rounded-lg border bg-white">
          <div className="p-3 sm:p-4 border-b">
            <h3 className="text-base sm:text-lg font-medium text-black">Lista de clientes</h3>
          </div>
          {error && <div className="p-3 sm:p-4 text-xs sm:text-sm text-red-600">{error}</div>}
          <div className="p-3 sm:p-4 overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left bg-gray-50 border-b-2 border-gray-200">
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Nome</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">CPF/CNPJ</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Telefone</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">E-mail</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c, index) => (
                  <tr
                    key={c.id}
                    className={`border-b ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <td className="py-3 px-4 sm:px-6 text-black">{c.cliente_nome}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{c.cliente_cpf_cnpj}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{c.cliente_fone || "-"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{c.cliente_email || "-"}</td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 sm:px-6 text-center text-black">Nenhum cliente cadastrado.</td>
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
