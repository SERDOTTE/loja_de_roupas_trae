"use client";

import { Fornecedor } from "@/types/db";
import { useState } from "react";
import { supabase } from "@/lib/supabase.server";

export function SupplierForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState({ nome: "", cpf_cnpj: "", telefone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { nome, cpf_cnpj, telefone, email } = form;
    if (!nome || !cpf_cnpj) {
      setError("Nome e CPF/CNPJ são obrigatórios.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("fornecedores").insert({ nome, cpf_cnpj, telefone, email });
    if (error) {
      setError(error.message);
    } else {
      setForm({ nome: "", cpf_cnpj: "", telefone: "", email: "" });
      onCreated?.();
    }
    setLoading(false);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Nome</label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Nome do fornecedor"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">CPF/CNPJ</label>
          <input
            type="text"
            name="cpf_cnpj"
            value={form.cpf_cnpj}
            onChange={(e) => setForm((f) => ({ ...f, cpf_cnpj: e.target.value }))}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="000.000.000-00 ou 00.000.000/0001-00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Telefone</label>
          <input
            type="tel"
            name="telefone"
            value={form.telefone}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="email@exemplo.com"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Salvando..." : "Salvar fornecedor"}
      </button>
    </form>
  );
}