"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase.server";
import { Fornecedor, Produto } from "@/types/db";

export function SalesForm({ onCreated }: { onCreated?: () => void }) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedFornecedor, setSelectedFornecedor] = useState("");
  const [selectedProduto, setSelectedProduto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    valor_venda: "",
    data_venda: "",
    data_recebimento: "",
  });

  useEffect(() => {
    (async () => {
      const { data: fData } = await supabase.from("fornecedores").select("*").order("nome");
      setFornecedores(fData || []);
    })();
  }, []);

  useEffect(() => {
    if (!selectedFornecedor) {
      setProdutos([]);
      return;
    }
    (async () => {
      const { data: pData } = await supabase
        .from("produtos")
        .select("*")
        .eq("fornecedor_id", selectedFornecedor)
        .eq("vendido", false)
        .order("data_entrada", { ascending: false });
      setProdutos(pData || []);
      setSelectedProduto("");
      setForm({ valor_venda: "", data_venda: "", data_recebimento: "" });
    })();
  }, [supabase, selectedFornecedor]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase não configurado.");
      return;
    }
    if (!selectedProduto || !form.valor_venda || !form.data_venda || !form.data_recebimento) {
      setError("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("produtos")
      .update({
        vendido: true,
        valor_venda: parseFloat(form.valor_venda),
        data_venda: form.data_venda,
        data_recebimento: form.data_recebimento,
      })
      .eq("id", selectedProduto);

    if (error) {
      setError(error.message);
    } else {
      setSelectedFornecedor("");
      setSelectedProduto("");
      setForm({ valor_venda: "", data_venda: "", data_recebimento: "" });
      onCreated?.();
    }
    setLoading(false);
  }

  const selectedProductData = produtos.find((p) => p.id === selectedProduto);

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block text-xs sm:text-sm font-medium text-black mb-2">Fornecedor</label>
        <select
          className="w-full rounded-md border px-3 py-2 text-black"
          value={selectedFornecedor}
          onChange={(e) => setSelectedFornecedor(e.target.value)}
        >
          <option value="">Selecione um fornecedor</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </div>

      {selectedFornecedor && (
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black mb-2">Produtos não vendidos</label>
          {produtos.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500 text-center py-4">Nenhum produto não vendido para este fornecedor.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
              {produtos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProduto(p.id)}
                  className={`w-full text-left p-2 sm:p-3 rounded-md border-2 transition-colors text-black ${
                    selectedProduto === p.id
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm">{p.produto}</p>
                      <p className="text-xs text-gray-600">Entrada: {p.data_entrada}</p>
                    </div>
                    <p className="font-semibold text-xs sm:text-sm whitespace-nowrap">R$ {p.valor_entrada?.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedProductData && (
        <div className="rounded-md bg-blue-50 p-3 sm:p-4 border border-blue-200">
          <p className="text-xs sm:text-sm text-black">
            <strong>Produto:</strong> {selectedProductData.produto}
          </p>
          <p className="text-xs sm:text-sm text-black">
            <strong>Valor de entrada:</strong> R$ {selectedProductData.valor_entrada?.toFixed(2)}
          </p>
          <p className="text-xs sm:text-sm text-black">
            <strong>Data de entrada:</strong> {selectedProductData.data_entrada}
          </p>
        </div>
      )}

      {selectedProduto && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 pt-4 border-t">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black">Valor de venda *</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-md border px-3 py-2 text-black"
              placeholder="0,00"
              value={form.valor_venda}
              onChange={(e) => setForm((f) => ({ ...f, valor_venda: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black">Data da venda *</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2 text-black"
              value={form.data_venda}
              onChange={(e) => setForm((f) => ({ ...f, data_venda: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black">Data do recebimento *</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2 text-black"
              value={form.data_recebimento}
              onChange={(e) => setForm((f) => ({ ...f, data_recebimento: e.target.value }))}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading || !selectedProduto}
          className="flex-1 rounded-md bg-purple-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Registrar Venda"}
        </button>
      </div>
    </form>
  );
}
