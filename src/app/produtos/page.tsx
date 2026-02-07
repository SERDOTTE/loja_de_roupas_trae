"use client";
export const dynamic = 'force-dynamic';
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.server";
import { Produto, Fornecedor } from "@/types/db";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function ProductForm({ fornecedores, onCreated }: { fornecedores: Fornecedor[]; onCreated?: () => void }) {
  const [form, setForm] = useState({
    fornecedor_id: "",
    produto: "",
    valor_entrada: "",
    data_entrada: "",
    valor_venda: "",
    data_venda: "",
    data_recebimento: "",
  });
  const [vendido, setVendido] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { fornecedor_id, produto, valor_entrada, data_entrada, valor_venda, data_venda, data_recebimento } = form;
    if (!fornecedor_id || !produto || !valor_entrada || !data_entrada) {
      setError("Fornecedor, produto, valor de entrada e data de entrada são obrigatórios.");
      setLoading(false);
      return;
    }
    if (vendido && (!valor_venda || !data_venda || !data_recebimento)) {
      setError("Para vendido, informe valor de venda, data da venda e data do recebimento.");
      setLoading(false);
      return;
    }

    const payload: any = {
      fornecedor_id,
      produto,
      valor_entrada: parseFloat(valor_entrada),
      data_entrada,
      vendido,
    };
    if (vendido) {
      payload.valor_venda = parseFloat(valor_venda);
      payload.data_venda = data_venda;
      payload.data_recebimento = data_recebimento;
    } else {
      payload.valor_venda = null;
      payload.data_venda = null;
      payload.data_recebimento = null;
    }

    const { error } = await supabase.from("produtos").insert(payload);
    if (error) {
      setError(error.message);
    } else {
      setForm({ fornecedor_id: "", produto: "", valor_entrada: "", data_entrada: "", valor_venda: "", data_venda: "", data_recebimento: "" });
      setVendido(false);
      onCreated?.();
    }
    setLoading(false);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Fornecedor</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            value={form.fornecedor_id}
            onChange={(e) => setForm((f) => ({ ...f, fornecedor_id: e.target.value }))}
          >
            <option value="">Selecione</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Produto</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="Nome do produto"
            value={form.produto}
            onChange={(e) => setForm((f) => ({ ...f, produto: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Valor de entrada</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="0,00"
            value={form.valor_entrada}
            onChange={(e) => setForm((f) => ({ ...f, valor_entrada: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Data de entrada</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            value={form.data_entrada}
            onChange={(e) => setForm((f) => ({ ...f, data_entrada: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input id="vendido" type="checkbox" checked={vendido} onChange={(e) => setVendido(e.target.checked)} />
        <label htmlFor="vendido" className="text-xs sm:text-sm text-black">Vendido</label>
      </div>

      {vendido && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black">Valor de venda</label>
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
            <label className="block text-xs sm:text-sm font-medium text-black">Data da venda</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2 text-black"
              value={form.data_venda}
              onChange={(e) => setForm((f) => ({ ...f, data_venda: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-black">Data do recebimento</label>
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
      <button type="submit" disabled={loading} className="w-full sm:w-auto rounded-md bg-green-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-green-700 disabled:opacity-60">
        {loading ? "Salvando..." : "Salvar produto"}
      </button>
    </form>
  );
}

export default function ProdutosPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [editForm, setEditForm] = useState({ valor_venda: "", data_venda: "", data_recebimento: "" });
  const [editLoading, setEditLoading] = useState(false);

  const handleProductCreated = useCallback(async () => {
    const { data: pData } = await supabase.from("produtos").select("*").order("data_entrada", { ascending: false });
    setProdutos(pData || []);
  }, []);

  const handleEditProduct = (produto: Produto) => {
    setEditingProduct(produto);
    setEditForm({
      valor_venda: produto.valor_venda?.toString() || "",
      data_venda: produto.data_venda || "",
      data_recebimento: produto.data_recebimento || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editForm.valor_venda || !editForm.data_venda || !editForm.data_recebimento) {
      alert("Preencha todos os campos");
      return;
    }

    setEditLoading(true);
    const { error: updateError } = await supabase
      .from("produtos")
      .update({
        vendido: true,
        valor_venda: parseFloat(editForm.valor_venda),
        data_venda: editForm.data_venda,
        data_recebimento: editForm.data_recebimento,
      })
      .eq("id", editingProduct.id);

    if (updateError) {
      alert("Erro ao salvar: " + updateError.message);
    } else {
      setEditingProduct(null);
      handleProductCreated();
    }
    setEditLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: fData, error: fError } = await supabase.from("fornecedores").select("*").order("created_at", { ascending: false });
        if (fError) {
          setError(`Erro ao carregar fornecedores: ${fError.message}`);
          return;
        }
        setFornecedores(fData || []);

        const { data: pData, error: pError } = await supabase.from("produtos").select("*").order("data_entrada", { ascending: false });
        if (pError) {
          setError(`Erro ao carregar produtos: ${pError.message}`);
          return;
        }
        setProdutos(pData || []);
        setError(null);
      } catch (err: any) {
        setError(`Erro: ${err.message}`);
      }
    })();
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-black">Produtos</h2>
        </div>

        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-medium text-black">Cadastrar produto</h3>
          <div className="mt-4">
            <ProductForm fornecedores={fornecedores} onCreated={handleProductCreated} />
          </div>
        </div>

        <div className="rounded-lg border bg-white">
          <div className="p-3 sm:p-4 border-b">
            <h3 className="text-base sm:text-lg font-medium text-black">Lista de produtos</h3>
          </div>
          {error && <div className="p-3 sm:p-4 text-xs sm:text-sm text-red-600">{error}</div>}
          <div className="p-3 sm:p-4 overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left bg-gray-50 border-b-2 border-gray-200">
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Produto</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Fornecedor</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Entrada</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Data entrada</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Vendido</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Venda</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Data venda</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Recebimento</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p, index) => (
                  <tr
                    key={p.id}
                    className={`border-b cursor-pointer ${index % 2 === 0 ? 'bg-green-50' : 'bg-white'} hover:bg-green-100 transition-colors ${!p.vendido ? "cursor-pointer" : ""}`}
                    onClick={() => !p.vendido && handleEditProduct(p)}
                  >
                    <td className="py-3 px-4 sm:px-6 text-black">{p.produto}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{fornecedores.find(f => f.id === p.fornecedor_id)?.nome || "-"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">R$ {p.valor_entrada?.toFixed(2)}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.data_entrada}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.vendido ? "✓ Sim" : "✗ Não"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.valor_venda ? `R$ ${p.valor_venda.toFixed(2)}` : "-"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.data_venda || "-"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.data_recebimento || "-"}</td>
                  </tr>
                ))}
                {produtos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 px-4 sm:px-6 text-center text-black">Nenhum produto cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-4 sm:p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-black">Registrar Venda</h3>
                <button onClick={() => setEditingProduct(null)} className="text-black hover:text-gray-700">✕</button>
              </div>

              <div className="mb-4 rounded-md bg-blue-50 p-3 border border-blue-200">
                <p className="text-xs sm:text-sm text-black"><strong>Produto:</strong> {editingProduct.produto}</p>
                <p className="text-xs sm:text-sm text-black"><strong>Fornecedor:</strong> {fornecedores.find(f => f.id === editingProduct.fornecedor_id)?.nome}</p>
                <p className="text-xs sm:text-sm text-black"><strong>Valor de entrada:</strong> R$ {editingProduct.valor_entrada?.toFixed(2)}</p>
                <p className="text-xs sm:text-sm text-black"><strong>Data de entrada:</strong> {editingProduct.data_entrada}</p>
              </div>

              <form className="space-y-4" onSubmit={handleSaveEdit}>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black">Valor de venda *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                    placeholder="0,00"
                    value={editForm.valor_venda}
                    onChange={(e) => setEditForm((f) => ({ ...f, valor_venda: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black">Data da venda *</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                    value={editForm.data_venda}
                    onChange={(e) => setEditForm((f) => ({ ...f, data_venda: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black">Data do recebimento *</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                    value={editForm.data_recebimento}
                    onChange={(e) => setEditForm((f) => ({ ...f, data_recebimento: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 rounded-md border px-4 py-2 text-xs sm:text-sm text-black hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 rounded-md bg-purple-600 px-4 py-2 text-xs sm:text-sm text-white hover:bg-purple-700 disabled:opacity-60"
                  >
                    {editLoading ? "Salvando..." : "Registrar Venda"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}