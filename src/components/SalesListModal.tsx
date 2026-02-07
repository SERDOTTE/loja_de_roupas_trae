"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase.server";
import { Fornecedor } from "@/types/db";

interface SaleData {
  id: string;
  produto: string;
  valor_entrada: number;
  valor_venda: number;
  data_venda: string;
  data_recebimento: string;
  fornecedor_id: string;
}

export function SalesListModal({ onClose, selectedMonth, selectedYear }: { onClose: () => void; selectedMonth: number; selectedYear: number }) {
  const [vendas, setVendas] = useState<SaleData[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Usar os parâmetros passados do dashboard
      const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
      const monthEnd = new Date(selectedYear, selectedMonth, 1);

      const startDate = monthStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDate = monthEnd.toISOString().split('T')[0];     // YYYY-MM-DD

      console.log(`[SalesListModal] Filtrando vendas de ${startDate} a ${endDate}`);
      console.log(`[SalesListModal] Mês: ${selectedMonth}, Ano: ${selectedYear}`);

      const { data: vData, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("vendido", true)
        .gte("data_venda", startDate)
        .lt("data_venda", endDate)
        .order("data_venda", { ascending: false });

      if (error) {
        console.error("[SalesListModal] Erro ao carregar vendas:", error);
      }

      console.log(`[SalesListModal] Vendas encontradas: ${vData?.length || 0}`);

      const { data: fData } = await supabase.from("fornecedores").select("*");

      setVendas(vData || []);
      setFornecedores(fData || []);
      setLoading(false);
    })();
  }, [selectedMonth, selectedYear, supabase]);

  const vendidosPorFornecedor = vendas.reduce(
    (acc, v) => {
      if (!acc[v.fornecedor_id]) {
        acc[v.fornecedor_id] = [];
      }
      acc[v.fornecedor_id].push(v);
      return acc;
    },
    {} as Record<string, SaleData[]>
  );

  function formatCurrency(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-white shadow-lg overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b p-3 sm:p-6 flex items-center justify-between">
          <h3 className="text-lg sm:text-2xl font-semibold text-black">Vendas do Mês</h3>
          <button onClick={onClose} className="text-black hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 sm:p-6">
          {loading ? (
            <p className="text-center text-black">Carregando...</p>
          ) : vendas.length === 0 ? (
            <p className="text-center text-black">Nenhuma venda registrada este mês.</p>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(vendidosPorFornecedor).map(([fornecedorId, vendas]) => {
                const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
                const totalVendas = vendas.reduce((acc, v) => acc + (v.valor_venda ?? 0), 0);
                const totalEntrada = vendas.reduce((acc, v) => acc + (v.valor_entrada ?? 0), 0);
                const lucro = totalVendas - totalEntrada;

                return (
                  <div key={fornecedorId} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="mb-4 pb-3 border-b">
                      <h4 className="text-base sm:text-lg font-semibold text-black">{fornecedor?.nome || "Desconhecido"}</h4>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-black">Total de Entrada</p>
                          <p className="font-semibold text-blue-600">{formatCurrency(totalEntrada)}</p>
                        </div>
                        <div>
                          <p className="text-black">Total de Vendas</p>
                          <p className="font-semibold text-green-600">{formatCurrency(totalVendas)}</p>
                        </div>
                        <div>
                          <p className="text-black">Lucro</p>
                          <p className="font-semibold text-purple-600">{formatCurrency(lucro)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {vendas.map((venda) => (
                        <div key={venda.id} className="bg-white p-2 sm:p-3 rounded border border-gray-200">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div>
                              <p className="text-black text-xs">Produto</p>
                              <p className="font-medium text-black">{venda.produto}</p>
                            </div>
                            <div>
                              <p className="text-black text-xs">Entrada</p>
                              <p className="font-medium text-blue-600">{formatCurrency(venda.valor_entrada)}</p>
                            </div>
                            <div>
                              <p className="text-black text-xs">Venda</p>
                              <p className="font-medium text-green-600">{formatCurrency(venda.valor_venda)}</p>
                            </div>
                            <div>
                              <p className="text-black text-xs">Lucro</p>
                              <p className="font-medium text-purple-600">{formatCurrency(venda.valor_venda - venda.valor_entrada)}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <p className="text-black text-xs">Data da Venda</p>
                              <p className="font-medium text-black">{formatDate(venda.data_venda)}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <p className="text-black text-xs">Data do Recebimento</p>
                              <p className="font-medium text-black">{formatDate(venda.data_recebimento)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
