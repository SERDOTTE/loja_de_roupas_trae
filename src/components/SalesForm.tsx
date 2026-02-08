"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase.server";
import { Fornecedor, Produto, Cliente } from "@/types/db";
import { formatDateToBR } from "@/lib/dateUtils";

type ParcelaForm = {
  valor_parcela: string;
  data_recebimento: string;
};

export function SalesForm({ onCreated }: { onCreated?: () => void }) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
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
    { valor_parcela: "", data_recebimento: "" },
  ]);

  useEffect(() => {
    (async () => {
      const { data: fData } = await supabase.from("fornecedores").select("*").order("nome");
      const { data: cData } = await supabase.from("clientes").select("*").order("cliente_nome");
      setFornecedores(fData || []);
      setClientes(cData || []);
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
      setSelectedCliente("");
      setForm({ valor_venda: "", data_venda: "" });
      setQuantidadeParcelas(1);
      setParcelas([{ valor_parcela: "", data_recebimento: "" }]);
    })();
  }, [supabase, selectedFornecedor]);

  useEffect(() => {
    // Atualiza o array de parcelas quando a quantidade muda
    const novasParcelas = Array.from({ length: quantidadeParcelas }, (_, i) => 
      parcelas[i] || { valor_parcela: "", data_recebimento: "" }
    );
    setParcelas(novasParcelas);
  }, [quantidadeParcelas]);

  const updateParcela = (index: number, field: keyof ParcelaForm, value: string) => {
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

      // 2. Inserir as parcelas na tabela parcelas
      const parcelasInsert = parcelas.map((parcela, index) => ({
        produto_id: selectedProduto,
        numero_parcela: index + 1,
        valor_parcela: parseFloat(parcela.valor_parcela),
        data_recebimento: parcela.data_recebimento,
        recebido: false,
      }));

      const { error: parcelasError } = await supabase
        .from("parcelas")
        .insert(parcelasInsert);

      if (parcelasError) throw parcelasError;

      // Reset do formulário
      setSelectedFornecedor("");
      setSelectedProduto("");
      setSelectedCliente("");
      setForm({ valor_venda: "", data_venda: "" });
      setQuantidadeParcelas(1);
      setParcelas([{ valor_parcela: "", data_recebimento: "" }]);
      onCreated?.();
    } catch (err: any) {
      setError(err.message || "Erro ao registrar venda");
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
            <select
              className="w-full rounded-md border px-3 py-2 text-black"
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
                    <input
                      type="date"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black text-sm"
                      value={parcelas[index]?.data_recebimento || ""}
                      onChange={(e) => updateParcela(index, "data_recebimento", e.target.value)}
                    />
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
    </form>
  );
}
