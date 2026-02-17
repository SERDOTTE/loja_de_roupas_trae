"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase.server";
import { Fornecedor, Produto, Cliente } from "@/types/db";
import { formatDateToBR } from "@/lib/dateUtils";

type ParcelaForm = {
  valor_parcela: string;
  data_recebimento: string;
  recebido: boolean;
};

export function SalesForm({ onCreated, initialProdutoId }: { onCreated?: () => void; initialProdutoId?: string }) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoInicial, setProdutoInicial] = useState<Produto | null>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState("");
  const [selectedProduto, setSelectedProduto] = useState("");
  const [selectedCliente, setSelectedCliente] = useState("");
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    valor_venda: "",
    data_venda: "",
  });
  const [parcelas, setParcelas] = useState<ParcelaForm[]>([
    { valor_parcela: "", data_recebimento: "", recebido: false },
  ]);
  const [showNewClienteModal, setShowNewClienteModal] = useState(false);
  const [newClienteForm, setNewClienteForm] = useState({
    cliente_nome: "",
    cliente_cpf_cnpj: "",
    cliente_fone: "",
    cliente_email: "",
  });
  const [loadingNewCliente, setLoadingNewCliente] = useState(false);
  const showProductPicker = !initialProdutoId;

  useEffect(() => {
    const loadData = async () => {
      const { data: fData } = await supabase
        .from("fornecedores")
        .select("*")
        .order("cod_fornecedor", { ascending: true, nullsFirst: false });
      const { data: cData } = await supabase.from("clientes").select("*").order("cliente_nome");
      setFornecedores(fData || []);
      setClientes(cData || []);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!initialProdutoId) return;
    
    const loadInitialProduto = async () => {
      const { data: produtoData } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", initialProdutoId)
        .single();
      
      if (produtoData) {
        setProdutoInicial(produtoData);
        setSelectedFornecedor(produtoData.fornecedor_id);
        setSelectedProduto(initialProdutoId);
        setSelectedCliente(produtoData.cliente_id || "");
        setForm({
          valor_venda: produtoData.valor_venda?.toString() || "",
          data_venda: produtoData.data_venda || "",
        });
        setQuantidadeParcelas(produtoData.quantidade_parcelas || 1);

        const { data: parcelasData } = await supabase
          .from("parcelas")
          .select("valor_parcela, data_recebimento, numero_parcela, recebido")
          .eq("produto_id", initialProdutoId)
          .order("numero_parcela", { ascending: true });

        if (parcelasData && parcelasData.length > 0) {
          setParcelas(
            parcelasData.map((parcela: { valor_parcela: number | null; data_recebimento: string | null; recebido: boolean | null }) => ({
              valor_parcela: parcela.valor_parcela?.toString() || "",
              data_recebimento: parcela.data_recebimento || "",
              recebido: parcela.recebido ?? false,
            }))
          );
          setQuantidadeParcelas(parcelasData.length);
        }
      }
    };
    loadInitialProduto();
  }, [initialProdutoId]);

  useEffect(() => {
    if (!selectedFornecedor) {
      setProdutos([]);
      return;
    }
    const loadProdutos = async () => {
      const { data: pData } = await supabase
        .from("produtos")
        .select("*")
        .eq("fornecedor_id", selectedFornecedor)
        .eq("vendido", false)
        .order("cod_produto", { ascending: true, nullsFirst: false });
      setProdutos(pData || []);
      if (!initialProdutoId) {
        setSelectedProduto("");
        setSelectedCliente("");
        setForm({ valor_venda: "", data_venda: "" });
        setQuantidadeParcelas(1);
        setParcelas([{ valor_parcela: "", data_recebimento: "", recebido: false }]);
      }
    };
    loadProdutos();
  }, [selectedFornecedor, initialProdutoId]);

  useEffect(() => {
    // Atualiza o array de parcelas quando a quantidade muda
    const novasParcelas = Array.from({ length: quantidadeParcelas }, (_, i) => 
      parcelas[i] || { valor_parcela: "", data_recebimento: "", recebido: false }
    );
    setParcelas(novasParcelas);
  }, [quantidadeParcelas]);

  const updateParcela = (index: number, field: keyof ParcelaForm, value: string | boolean) => {
    setParcelas(prev => {
      const newParcelas = [...prev];
      newParcelas[index] = { ...newParcelas[index], [field]: value };
      return newParcelas;
    });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase não configurado.");
      return;
    }
    
    // Validações
    if (!selectedProduto || !selectedCliente) {
      setError("Selecione um produto e um cliente.");
      return;
    }
    
    if (!form.valor_venda || !form.data_venda) {
      setError("Preencha o valor de venda e a data da venda.");
      return;
    }

    // Validar parcelas
    for (let i = 0; i < quantidadeParcelas; i++) {
      if (!parcelas[i]?.valor_parcela || !parcelas[i]?.data_recebimento) {
        setError(`Preencha todos os campos da parcela ${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Atualizar o produto com os dados da venda
      const { error: updateError } = await supabase
        .from("produtos")
        .update({
          vendido: true,
          cliente_id: selectedCliente,
          valor_venda: parseFloat(form.valor_venda),
          data_venda: form.data_venda,
          quantidade_parcelas: quantidadeParcelas, 
        })
        .eq("id", selectedProduto);

      if (updateError) throw updateError;

      // 2. Remover parcelas existentes e inserir as novas
      const { error: deleteError } = await supabase
        .from("parcelas")
        .delete()
        .eq("produto_id", selectedProduto);

      if (deleteError) throw deleteError;

      const parcelasInsert = parcelas.map((parcela, index) => ({
        produto_id: selectedProduto,
        fornecedor_id: selectedFornecedor,
        cliente_id: selectedCliente,
        numero_parcela: index + 1, 
        valor_parcela: parseFloat(parcela.valor_parcela),
        data_recebimento: parcela.data_recebimento,
        recebido: parcela.recebido,
      }));

      const { error: parcelasError } = await supabase
        .from("parcelas")
        .insert(parcelasInsert);

      if (parcelasError) throw parcelasError;

      // Reset do formulário
      setSelectedFornecedor("");
      setSelectedProduto("");
      setSelectedCliente("");
      setProdutoInicial(null);
      setForm({ valor_venda: "", data_venda: "" });
      setQuantidadeParcelas(1);
      setParcelas([{ valor_parcela: "", data_recebimento: "", recebido: false }]);
      onCreated?.();
    } catch (err: any) {
      setError(err.message || "Erro ao registrar venda");
    }
    
    setLoading(false);
  }

  const selectedProductData = produtos.find((p) => p.id === selectedProduto) ||
    (produtoInicial && produtoInicial.id === selectedProduto ? produtoInicial : undefined);

  const handleCreateCliente = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault?.();
    const { cliente_nome, cliente_cpf_cnpj, cliente_fone, cliente_email } = newClienteForm;
    
    if (!cliente_nome) {
      setError("Nome do cliente é obrigatório.");
      return;
    }

    setLoadingNewCliente(true);
    setError(null);

    try {
      const { data: newCliente, error: insertError } = await supabase
        .from("clientes")
        .insert([
          {
            cliente_nome,
            cliente_cpf_cnpj: cliente_cpf_cnpj || null,
            cliente_fone: cliente_fone || null,
            cliente_email: cliente_email || null,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setClientes([...clientes, newCliente]);
      setSelectedCliente(newCliente.id);
      
      setNewClienteForm({
        cliente_nome: "",
        cliente_cpf_cnpj: "",
        cliente_fone: "",
        cliente_email: "",
      });
      setShowNewClienteModal(false);
    } catch (err: any) {
      setError(err.message || "Erro ao criar cliente");
    }
    setLoadingNewCliente(false);
  };

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
              {f.cod_fornecedor ? `${f.cod_fornecedor} - ${f.nome}` : f.nome}
            </option>
          ))}
        </select>
      </div>

      {showProductPicker && selectedFornecedor && (
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black mb-2">Produtos não vendidos</label>
          {produtos.length === 0 ? (
            <p className="text-xs sm:text-sm text-black text-center py-4">Nenhum produto não vendido para este fornecedor.</p>
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
                      {p.cod_produto && (
                        <p className="text-xs text-gray-600">Cód: {p.cod_produto}</p>
                      )}
                      <p className="font-medium text-xs sm:text-sm">{p.produto}</p>
                      <p className="text-xs text-black">Entrada: {formatDateToBR(p.data_entrada)}</p>
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
        <>
          <div className="rounded-md bg-blue-50 p-3 sm:p-4 border border-blue-200">
            {selectedProductData.cod_produto && (
              <p className="text-xs sm:text-sm text-black">
                <strong>Código:</strong> {selectedProductData.cod_produto}
              </p>
            )}
            <p className="text-xs sm:text-sm text-black">
              <strong>Produto:</strong> {selectedProductData.produto}
            </p>
            <p className="text-xs sm:text-sm text-black">
              <strong>Valor de entrada:</strong> R$ {selectedProductData.valor_entrada?.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-black">
              <strong>Data de entrada:</strong> {formatDateToBR(selectedProductData.data_entrada)}
            </p>
          </div>

          <div className="pt-4 border-t">
            <label className="block text-xs sm:text-sm font-medium text-black mb-2">Cliente *</label>
            <div className="flex gap-2">
              <select
                className="flex-1 rounded-md border px-3 py-2 text-black"
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cliente_nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewClienteModal(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 whitespace-nowrap"
              >
                + Cliente
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
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
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-black mb-2">
              Quantidade de Parcelas *
            </label>
            <select
              className="w-full rounded-md border px-3 py-2 text-black"
              value={quantidadeParcelas}
              onChange={(e) => setQuantidadeParcelas(parseInt(e.target.value))}
            >
              <option value={1}>1x (À vista)</option>
              <option value={2}>2x</option>
              <option value={3}>3x</option>
            </select>
          </div>

          <div className="space-y-3 bg-gray-50 p-3 rounded-md">
            <h4 className="text-xs sm:text-sm font-semibold text-black">Detalhes das Parcelas</h4>
            {Array.from({ length: quantidadeParcelas }).map((_, index) => (
              <div key={index} className="bg-white p-3 rounded-md border">
                <p className="text-xs font-medium text-gray-700 mb-2">Parcela {index + 1}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-black">Valor da parcela *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black text-sm"
                      placeholder="0,00"
                      value={parcelas[index]?.valor_parcela || ""}
                      onChange={(e) => updateParcela(index, "valor_parcela", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-black">Data de recebimento *</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="date"
                        className="w-full rounded-md border px-3 py-2 text-black text-sm"
                        value={parcelas[index]?.data_recebimento || ""}
                        onChange={(e) => updateParcela(index, "data_recebimento", e.target.value)}
                      />
                      <label className="flex items-center gap-2 text-xs text-black whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={parcelas[index]?.recebido || false}
                          onChange={(e) => updateParcela(index, "recebido", e.target.checked)}
                        />
                        Recebido
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
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

      {showNewClienteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 sm:p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-black">Cadastrar Cliente</h3>
              <button
                onClick={() => setShowNewClienteModal(false)}
                className="text-black hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">Nome *</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-black"
                  placeholder="Nome do cliente"
                  value={newClienteForm.cliente_nome}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, cliente_nome: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">CPF/CNPJ</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-black"
                  placeholder="CPF ou CNPJ"
                  value={newClienteForm.cliente_cpf_cnpj}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, cliente_cpf_cnpj: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">Telefone</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-black"
                  placeholder="Telefone"
                  value={newClienteForm.cliente_fone}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, cliente_fone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border px-3 py-2 text-black"
                  placeholder="Email"
                  value={newClienteForm.cliente_email}
                  onChange={(e) => setNewClienteForm((f) => ({ ...f, cliente_email: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  disabled={loadingNewCliente}
                  onClick={handleCreateCliente}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {loadingNewCliente ? "Salvando..." : "Salvar Cliente"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewClienteModal(false)}
                  className="flex-1 rounded-md bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
