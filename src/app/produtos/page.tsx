"use client";
export const dynamic = 'force-dynamic';
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.server";
import { Produto, Fornecedor } from "@/types/db";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { formatDateToBR } from "@/lib/dateUtils";
import { SalesForm } from "@/components/SalesForm";

function ProductForm({
  fornecedores,
  onCreated,
  onEditClick,
  onDeleteClick,
}: {
  fornecedores: Fornecedor[];
  onCreated?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}) {
  const [form, setForm] = useState({
    fornecedor_id: "",
    cod_produto: "",
    produto: "",
    valor_entrada: "",
    data_entrada: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { fornecedor_id, produto, valor_entrada, data_entrada } = form;
    if (!fornecedor_id || !produto || !valor_entrada || !data_entrada) {
      setError("Fornecedor, produto, valor de entrada e data de entrada são obrigatórios.");
      setLoading(false);
      return;
    }

    const { cod_produto } = form;
    const payload: any = {
      fornecedor_id,
      cod_produto: cod_produto || null,
      produto,
      valor_entrada: parseFloat(valor_entrada),
      data_entrada,
      vendido: false,
      valor_venda: null,
      data_venda: null,
    }

    const { error } = await supabase.from("produtos").insert(payload);
    if (error) {
      setError(error.message);
    } else {
      setForm({ fornecedor_id: "", cod_produto: "", produto: "", valor_entrada: "", data_entrada: "" });
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
          <label className="block text-xs sm:text-sm font-medium text-black">Código do Produto</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="Código (opcional)"
            value={form.cod_produto}
            onChange={(e) => setForm((f) => ({ ...f, cod_produto: e.target.value }))}
          />
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

      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto rounded-md bg-green-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar produto"}
        </button>
        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="w-full sm:w-auto rounded-md bg-blue-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-blue-700"
          >
            Editar produto
          </button>
        )}
        {onDeleteClick && (
          <button
            type="button"
            onClick={onDeleteClick}
            className="w-full sm:w-auto rounded-md bg-red-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-red-700"
          >
            Excluir produto
          </button>
        )}
      </div>
    </form>
  );
}

function ProductEditForm({
  produto,
  fornecedores,
  onSaved,
  onDeleted,
}: {
  produto: Produto;
  fornecedores: Fornecedor[];
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const [form, setForm] = useState({
    fornecedor_id: produto.fornecedor_id || "",
    cod_produto: produto.cod_produto || "",
    produto: produto.produto || "",
    valor_entrada: produto.valor_entrada?.toString() || "",
    data_entrada: produto.data_entrada || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      fornecedor_id: produto.fornecedor_id || "",
      cod_produto: produto.cod_produto || "",
      produto: produto.produto || "",
      valor_entrada: produto.valor_entrada?.toString() || "",
      data_entrada: produto.data_entrada || "",
    });
    setError(null);
  }, [produto]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { fornecedor_id, produto: nomeProduto, valor_entrada, data_entrada } = form;
    if (!fornecedor_id || !nomeProduto || !valor_entrada || !data_entrada) {
      setError("Fornecedor, produto, valor de entrada e data de entrada sao obrigatorios.");
      setLoading(false);
      return;
    }

    const payload: any = {
      fornecedor_id,
      cod_produto: form.cod_produto || null,
      produto: nomeProduto,
      valor_entrada: parseFloat(valor_entrada),
      data_entrada,
    }

    const { error } = await supabase.from("produtos").update(payload).eq("id", produto.id);
    if (error) {
      setError(error.message);
    } else {
      onSaved?.();
    }
    setLoading(false);
  }

  async function onDelete() {
    if (!window.confirm("Tem certeza que deseja deletar este registro?")) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("produtos").delete().eq("id", produto.id);
    if (error) {
      setError(error.message);
    } else {
      onDeleted?.();
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
          <label className="block text-xs sm:text-sm font-medium text-black">Codigo do Produto</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            value={form.cod_produto}
            onChange={(e) => setForm((f) => ({ ...f, cod_produto: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Produto</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
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

      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto rounded-md bg-green-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onDelete}
          className="w-full sm:w-auto rounded-md bg-red-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-red-700 disabled:opacity-60"
        >
          Deletar registro
        </button>
      </div>
    </form>
  );
}

export default function ProdutosPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [produtoParaVender, setProdutoParaVender] = useState<string | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState<string>("");
  const [editProdutoForm, setEditProdutoForm] = useState({ fornecedor_id: "", cod_produto: "", produto: "", valor_entrada: "", data_entrada: "" });
  const [loadingEditP, setLoadingEditP] = useState(false);
  const [loadingDeleteP, setLoadingDeleteP] = useState(false);

  const handleProductCreated = useCallback(async () => {
    const { data: pData } = await supabase.from("produtos").select("*").order("data_entrada", { ascending: false });
    setProdutos(pData || []);
  }, []);

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
            <ProductForm
              fornecedores={fornecedores}
              onCreated={handleProductCreated}
              onEditClick={() => setShowEditProductModal(true)}
              onDeleteClick={() => setShowDeleteProductModal(true)}
            />
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
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Código</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Produto</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Fornecedor</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Entrada</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Data entrada</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Vendido</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Venda</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Data venda</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Parcelas</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p, index) => (
                  <tr
                    key={p.id}
                    className={`border-b ${index % 2 === 0 ? 'bg-green-50' : 'bg-white'} cursor-pointer hover:bg-yellow-100`}
                    onClick={() => {
                      setProdutoSelecionado(p);
                      setShowActionModal(true);
                    }}
                  >
                    <td className="py-3 px-4 sm:px-6 text-black">{p.cod_produto || "-"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.produto}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{fornecedores.find(f => f.id === p.fornecedor_id)?.nome || "-"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">R$ {p.valor_entrada?.toFixed(2)}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{formatDateToBR(p.data_entrada)}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.vendido ? "✓ Sim" : "✗ Não"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.valor_venda ? `R$ ${p.valor_venda.toFixed(2)}` : "-"}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{formatDateToBR(p.data_venda)}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{p.quantidade_parcelas ? `${p.quantidade_parcelas}x` : "-"}</td>
                  </tr>
                ))}
                {produtos.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 sm:px-6 text-center text-black">Nenhum produto cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {produtoParaVender && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white p-4 sm:p-6 shadow-lg overflow-y-auto">
              <div className="mb-4 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-lg sm:text-xl font-semibold text-black">Registrar Venda</h3>
                <button onClick={() => setProdutoParaVender(null)} className="text-black hover:text-gray-700 text-2xl">✕</button>
              </div>
              <SalesForm 
                initialProdutoId={produtoParaVender}
                onCreated={() => {
                  setProdutoParaVender(null);
                  handleProductCreated();
                }}
              />
            </div>
          </div>
        )}

        {showActionModal && produtoSelecionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-4 sm:p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-black">Acoes do Produto</h3>
                <button onClick={() => setShowActionModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
              </div>
              <div className="space-y-2">
                <button
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-blue-700"
                  onClick={() => {
                    setShowActionModal(false);
                    setShowEditModal(true);
                  }}
                >
                  Editar
                </button>
                <button
                  className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-purple-700 disabled:opacity-60"
                  onClick={() => {
                    setShowActionModal(false);
                    setProdutoParaVender(produtoSelecionado.id);
                  }}
                >
                  Registrar venda
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && produtoSelecionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white p-4 sm:p-6 shadow-lg overflow-y-auto">
              <div className="mb-4 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-lg sm:text-xl font-semibold text-black">Editar Produto</h3>
                <button onClick={() => setShowEditModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
              </div>
              <ProductEditForm
                produto={produtoSelecionado}
                fornecedores={fornecedores}
                onSaved={() => {
                  setShowEditModal(false);
                  handleProductCreated();
                }}
                onDeleted={() => {
                  setShowEditModal(false);
                  setProdutoSelecionado(null);
                  handleProductCreated();
                }}
              />
            </div>
          </div>
        )}

        {showEditProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="w-full max-w-xl rounded-lg bg-white p-4 sm:p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-black">Editar produto</h3>
                <button onClick={() => setShowEditProductModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
              </div>

              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedProdutoId) return;
                setLoadingEditP(true);
                setError(null);

                const { fornecedor_id, produto: nomeProduto, valor_entrada, data_entrada } = editProdutoForm;
                if (!fornecedor_id || !nomeProduto || !valor_entrada || !data_entrada) {
                  setError("Fornecedor, produto, valor de entrada e data de entrada sao obrigatorios.");
                  setLoadingEditP(false);
                  return;
                }

                const payload: any = {
                  fornecedor_id,
                  cod_produto: editProdutoForm.cod_produto || null,
                  produto: nomeProduto,
                  valor_entrada: parseFloat(valor_entrada),
                  data_entrada,
                };

                const { error: updateError } = await supabase.from("produtos").update(payload).eq("id", selectedProdutoId);
                if (updateError) {
                  setError(updateError.message);
                } else {
                  await handleProductCreated();
                  setShowEditProductModal(false);
                  setSelectedProdutoId("");
                }
                setLoadingEditP(false);
              }}>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black">Produto</label>
                  <select
                    className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                    value={selectedProdutoId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      setSelectedProdutoId(pId);
                      const produto = produtos.find((p) => p.id === pId);
                      if (produto) {
                        setEditProdutoForm({
                          fornecedor_id: produto.fornecedor_id || "",
                          cod_produto: produto.cod_produto || "",
                          produto: produto.produto || "",
                          valor_entrada: produto.valor_entrada?.toString() || "",
                          data_entrada: produto.data_entrada || "",
                        });
                      }
                    }}
                  >
                    <option value="">Selecione</option>
                    {produtos.sort((a, b) => {
                      const codA = parseInt(a.cod_produto || "0", 10);
                      const codB = parseInt(b.cod_produto || "0", 10);
                      return codA - codB;
                    }).map((p) => (
                      <option key={p.id} value={p.id}>{p.cod_produto ? `${p.cod_produto} - ${p.produto}` : p.produto}</option>
                    ))}
                  </select>
                </div>

                {selectedProdutoId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-black">Fornecedor</label>
                      <select
                        className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                        value={editProdutoForm.fornecedor_id}
                        onChange={(e) => setEditProdutoForm((f) => ({ ...f, fornecedor_id: e.target.value }))}
                      >
                        <option value="">Selecione</option>
                        {fornecedores.map((f) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-black">Codigo do Produto</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                        value={editProdutoForm.cod_produto}
                        onChange={(e) => setEditProdutoForm((f) => ({ ...f, cod_produto: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-black">Produto</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                        value={editProdutoForm.produto}
                        onChange={(e) => setEditProdutoForm((f) => ({ ...f, produto: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-black">Valor de entrada</label>
                      <input
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                        value={editProdutoForm.valor_entrada}
                        onChange={(e) => setEditProdutoForm((f) => ({ ...f, valor_entrada: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-black">Data de entrada</label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                        value={editProdutoForm.data_entrada}
                        onChange={(e) => setEditProdutoForm((f) => ({ ...f, data_entrada: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!selectedProdutoId || loadingEditP}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {loadingEditP ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-4 sm:p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-black">Excluir produto</h3>
                <button onClick={() => setShowDeleteProductModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black">Produto</label>
                  <select
                    className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                    value={selectedProdutoId}
                    onChange={(e) => setSelectedProdutoId(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {produtos.sort((a, b) => {
                      const codA = parseInt(a.cod_produto || "0", 10);
                      const codB = parseInt(b.cod_produto || "0", 10);
                      return codA - codB;
                    }).map((p) => (
                      <option key={p.id} value={p.id}>{p.cod_produto ? `${p.cod_produto} - ${p.produto}` : p.produto}</option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedProdutoId || loadingDeleteP}
                    onClick={async () => {
                      if (!selectedProdutoId) return;
                      setLoadingDeleteP(true);
                      setError(null);
                      const { error: deleteError } = await supabase.from("produtos").delete().eq("id", selectedProdutoId);
                      if (deleteError) {
                        setError(deleteError.message);
                      } else {
                        await handleProductCreated();
                        setShowDeleteProductModal(false);
                        setSelectedProdutoId("");
                      }
                      setLoadingDeleteP(false);
                    }}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {loadingDeleteP ? "Excluindo..." : "Confirmar exclusao"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}