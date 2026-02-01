"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { SalesForm } from "./SalesForm";
import { SalesListModal } from "./SalesListModal";

export default function DashboardClient() {
  const supabase = getSupabaseClient();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showSalesListModal, setShowSalesListModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>("");

  const loadProdutos = useCallback(async () => {
    if (!supabase) return;
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const nextMonthStart = new Date(currentMonthStart);
    nextMonthStart.setMonth(currentMonthStart.getMonth() + 1);

    const { data } = await supabase
      .from("produtos")
      .select("*")
      .gte("data_venda", currentMonthStart.toISOString())
      .lt("data_venda", nextMonthStart.toISOString());
    setProdutos(data || []);
  }, [supabase]);

  useEffect(() => {
    loadProdutos();
    
    // Definir o mês atual
    const now = new Date();
    const monthName = now.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    setCurrentMonth(monthName.charAt(0).toUpperCase() + monthName.slice(1));
  }, [supabase, loadProdutos]);

  const totals = useMemo(() => {
    const totalVendas = produtos.length;
    const totalEntrada = produtos.reduce((acc: number, p: any) => acc + Number(p.valor_entrada ?? 0), 0);
    const totalVenda = produtos.reduce((acc: number, p: any) => acc + Number(p.valor_venda ?? 0), 0);
    const lucro = totalVenda - totalEntrada;
    return { totalVendas, totalEntrada, totalVenda, lucro };
  }, [produtos]);

  function formatCurrency(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resumo do mês</h2>
          <p className="text-sm text-gray-600">{currentMonth}</p>
        </div>
        {!supabase && (
          <p className="mt-2 text-sm text-red-600">Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowSalesListModal(true)}
            className="rounded-md bg-blue-50 p-4 hover:bg-blue-100 transition-colors text-left cursor-pointer"
          >
            <p className="text-sm text-gray-600">Total de Vendas</p>
            <p className="text-2xl font-bold text-blue-600">{totals.totalVendas}</p>
            <p className="text-xs text-blue-500 mt-1">Clique para visualizar</p>
          </button>
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-gray-600">Total Valor de Entrada</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.totalEntrada)}</p>
          </div>
          <div className="rounded-md bg-amber-50 p-4">
            <p className="text-sm text-gray-600">Total Valor de Venda</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.totalVenda)}</p>
          </div>
          <div className="rounded-md bg-purple-50 p-4">
            <p className="text-sm text-gray-600">Lucro (Venda - Entrada)</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.lucro)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Ações rápidas</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/fornecedores" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Cadastrar Fornecedor</a>
          <a href="/produtos" className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">Cadastrar Produto</a>
          <button onClick={() => setShowSalesModal(true)} className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">Cadastrar Venda</button>
        </div>

        {showSalesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Registrar Venda</h3>
                <button onClick={() => setShowSalesModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <SalesForm onCreated={() => {
                setShowSalesModal(false);
                loadProdutos();
              }} />
            </div>
          </div>
        )}
      </div>

      {showSalesListModal && <SalesListModal onClose={() => setShowSalesListModal(false)} />}
    </div>
  );
}