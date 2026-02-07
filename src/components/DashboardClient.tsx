"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase.server";
import { SalesForm } from "./SalesForm";
import { SalesListModal } from "./SalesListModal";

export default function DashboardClient() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showSalesListModal, setShowSalesListModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<string>("");

  const meses = [
    { valor: 1, label: "Janeiro" },
    { valor: 2, label: "Fevereiro" },
    { valor: 3, label: "Março" },
    { valor: 4, label: "Abril" },
    { valor: 5, label: "Maio" },
    { valor: 6, label: "Junho" },
    { valor: 7, label: "Julho" },
    { valor: 8, label: "Agosto" },
    { valor: 9, label: "Setembro" },
    { valor: 10, label: "Outubro" },
    { valor: 11, label: "Novembro" },
    { valor: 12, label: "Dezembro" },
  ];

  const loadProdutos = useCallback(async (mes: number, ano: number) => {
    // Formatar datas como YYYY-MM-DD para comparação exata
    const monthStart = new Date(ano, mes - 1, 1);
    const monthEnd = new Date(ano, mes, 1);

    const startDate = monthStart.toISOString().split('T')[0]; // YYYY-MM-DD
    const endDate = monthEnd.toISOString().split('T')[0];     // YYYY-MM-DD

    console.log(`Filtrando vendas de ${startDate} a ${endDate}`);

    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("vendido", true)
      .gte("data_venda", startDate)
      .lt("data_venda", endDate);
    
    if (error) {
      console.error("Erro ao carregar produtos:", error);
    }
    
    console.log(`Produtos encontrados: ${data?.length || 0}`);
    setProdutos(data || []);
  }, [supabase]);

  useEffect(() => {
    loadProdutos(selectedMonth, selectedYear);
    
    const monthName = meses.find(m => m.valor === selectedMonth)?.label || "";
    setCurrentMonth(`${monthName} de ${selectedYear}`);
  }, [selectedMonth, selectedYear, loadProdutos, meses]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

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
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
      <div className="rounded-lg border bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-black">Resumo do mês</h2>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-black mb-1">Mês</label>
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black text-xs sm:text-sm"
              >
                {meses.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-black mb-1">Ano</label>
              <input
                type="number"
                value={selectedYear}
                onChange={handleYearChange}
                min="2020"
                max={new Date().getFullYear() + 1}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black text-xs sm:text-sm"
              />
            </div>
          </div>

          <p className="text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-md">{currentMonth}</p>
        </div>

        {!supabase && (
          <p className="mt-2 text-xs sm:text-sm text-red-600">Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => {
              console.log(`[Dashboard Button Click] Abrindo modal para Mês: ${selectedMonth}, Ano: ${selectedYear}`);
              setShowSalesListModal(true);
            }}
            className="rounded-md bg-blue-50 p-3 sm:p-4 hover:bg-blue-100 transition-colors text-left cursor-pointer"
          >
            <p className="text-xs sm:text-sm text-black">Total de Vendas</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1">{totals.totalVendas}</p>
            <p className="text-xs text-blue-500 mt-1">Clique para visualizar</p>
          </button>
          <div className="rounded-md bg-green-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-black">Total Valor de Entrada</p>
            <p className="text-lg sm:text-2xl font-bold text-black mt-1">{formatCurrency(totals.totalEntrada)}</p>
          </div>
          <div className="rounded-md bg-amber-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-black">Total Valor de Venda</p>
            <p className="text-lg sm:text-2xl font-bold text-black mt-1">{formatCurrency(totals.totalVenda)}</p>
          </div>
          <div className="rounded-md bg-purple-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-black">Lucro (Venda - Entrada)</p>
            <p className="text-lg sm:text-2xl font-bold text-black mt-1">{formatCurrency(totals.lucro)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-3 sm:p-4 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-black">Ações rápidas</h2>
        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <a href="/fornecedores" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-blue-700">Cadastrar Fornecedor</a>
          <a href="/produtos" className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-green-700">Cadastrar Produto</a>
          <button onClick={() => setShowSalesModal(true)} className="inline-flex items-center justify-center rounded-md bg-purple-600 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-purple-700">Cadastrar Venda</button>
        </div>

        {showSalesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white p-4 sm:p-6 shadow-lg overflow-y-auto">
              <div className="mb-4 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-lg sm:text-xl font-semibold text-black">Registrar Venda</h3>
                <button onClick={() => setShowSalesModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
              </div>
              <SalesForm onCreated={() => {
                setShowSalesModal(false);
                loadProdutos(selectedMonth, selectedYear);
              }} />
            </div>
          </div>
        )}
      </div>

      {showSalesListModal && <SalesListModal onClose={() => setShowSalesListModal(false)} selectedMonth={selectedMonth} selectedYear={selectedYear} />}
    </div>
  );
}