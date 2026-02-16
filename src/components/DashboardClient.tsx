"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase.server";
import { SalesForm } from "./SalesForm";
import { SalesListModal } from "./SalesListModal";

type MonthlySeriesItem = {
  monthLabel: string;
  monthSortValue: number;
  total_recebido_no_mes: number;
  total_valor_entrada: number;
  lucro_total: number;
};

type ChartTooltip = {
  monthLabel: string;
  metricLabel: string;
  value: number;
  colorClass: string;
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function getMonthInfo(rawValue: unknown, index: number) {
  if (typeof rawValue === "number") {
    const monthIndex = Math.max(1, Math.min(12, rawValue)) - 1;
    return { monthLabel: MONTHS[monthIndex], monthSortValue: monthIndex + 1 };
  }

  if (typeof rawValue === "string") {
    const numericMonth = Number(rawValue);
    if (!Number.isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
      return {
        monthLabel: MONTHS[numericMonth - 1],
        monthSortValue: numericMonth,
      };
    }

    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
      const monthNumber = parsed.getMonth() + 1;
      return {
        monthLabel: `${MONTHS[monthNumber - 1]}/${parsed.getFullYear()}`,
        monthSortValue: parsed.getFullYear() * 100 + monthNumber,
      };
    }

    return { monthLabel: rawValue, monthSortValue: index + 1 };
  }

  return { monthLabel: `Mês ${index + 1}`, monthSortValue: index + 1 };
}

export default function DashboardClient() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [monthlySeries, setMonthlySeries] = useState<MonthlySeriesItem[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartTooltip, setChartTooltip] = useState<ChartTooltip | null>(null);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showSalesListModal, setShowSalesListModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<string>("");

  const meses = MONTHS.map((label, index) => ({ valor: index + 1, label }));

  useEffect(() => {
    (async () => {
      setChartLoading(true);
      setChartError(null);

      const { data, error } = await supabase.from("vendas_recebidas_por_mes").select("*");

      if (error) {
        setChartError(`Erro ao carregar dados do gráfico: ${error.message}`);
        setMonthlySeries([]);
        setChartLoading(false);
        return;
      }

      const parsed: MonthlySeriesItem[] = (data || []).map((row: Record<string, unknown>, index: number) => {
        const rawMonth = row.mes ?? row.mes_referencia ?? row.ano_mes ?? row.data_referencia;
        const month = getMonthInfo(rawMonth, index);

        return {
          monthLabel: month.monthLabel,
          monthSortValue: month.monthSortValue,
          total_recebido_no_mes: toNumber(row.total_recebido_no_mes),
          total_valor_entrada: toNumber(row.total_valor_entrada),
          lucro_total: toNumber(row.lucro_total),
        };
      });

      parsed.sort((a: MonthlySeriesItem, b: MonthlySeriesItem) => a.monthSortValue - b.monthSortValue);
      setMonthlySeries(parsed);
      setChartLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // Formatar datas como YYYY-MM-DD para comparação exata
      const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
      const monthEnd = new Date(selectedYear, selectedMonth, 1);

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

      const monthName = meses.find(m => m.valor === selectedMonth)?.label || "";
      setCurrentMonth(`${monthName} de ${selectedYear}`);
    })();
  }, [selectedMonth, selectedYear]);

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

  const chartMetrics = useMemo(() => {
    if (monthlySeries.length === 0) return null;

    const maxY = Math.max(
      ...monthlySeries.flatMap((item) => [
        item.total_recebido_no_mes,
        item.total_valor_entrada,
        item.lucro_total,
      ]),
      1
    );

    const width = 760;
    const height = 320;
    const padding = { top: 20, right: 20, bottom: 56, left: 84 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const xForIndex = (index: number) => {
      if (monthlySeries.length === 1) return padding.left + plotWidth / 2;
      return padding.left + (index * plotWidth) / (monthlySeries.length - 1);
    };

    const yForValue = (value: number) => padding.top + plotHeight - (value / maxY) * plotHeight;

    const buildPath = (selector: (item: MonthlySeriesItem) => number) =>
      monthlySeries
        .map((item, index) => `${index === 0 ? "M" : "L"}${xForIndex(index)} ${yForValue(selector(item))}`)
        .join(" ");

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const value = (maxY / 4) * i;
      return {
        value,
        y: yForValue(value),
      };
    });

    const pointSeries = {
      recebido: monthlySeries.map((item, index) => ({
        x: xForIndex(index),
        y: yForValue(item.total_recebido_no_mes),
        monthLabel: item.monthLabel,
        value: item.total_recebido_no_mes,
      })),
      entrada: monthlySeries.map((item, index) => ({
        x: xForIndex(index),
        y: yForValue(item.total_valor_entrada),
        monthLabel: item.monthLabel,
        value: item.total_valor_entrada,
      })),
      lucro: monthlySeries.map((item, index) => ({
        x: xForIndex(index),
        y: yForValue(item.lucro_total),
        monthLabel: item.monthLabel,
        value: item.lucro_total,
      })),
    };

    return {
      width,
      height,
      padding,
      yTicks,
      pointSeries,
      points: monthlySeries.map((item, index) => ({ x: xForIndex(index), label: item.monthLabel })),
      pathRecebido: buildPath((item) => item.total_recebido_no_mes),
      pathEntrada: buildPath((item) => item.total_valor_entrada),
      pathLucro: buildPath((item) => item.lucro_total),
    };
  }, [monthlySeries]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2 items-stretch">
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
          <h2 className="text-base sm:text-lg font-semibold text-black">Evolução mensal</h2>
          <p className="mt-1 text-xs sm:text-sm text-black">Meses x valores em reais</p>

          {chartLoading ? (
            <p className="mt-6 text-xs sm:text-sm text-black">Carregando gráfico...</p>
          ) : chartError ? (
            <p className="mt-6 text-xs sm:text-sm text-red-600">{chartError}</p>
          ) : !chartMetrics ? (
            <p className="mt-6 text-xs sm:text-sm text-black">Sem dados para exibir no gráfico.</p>
          ) : (
            <div className="mt-4 overflow-x-auto relative">
              {chartTooltip && (
                <div className="absolute right-2 top-2 z-10 rounded-md border bg-white px-3 py-2 shadow-sm">
                  <p className="text-xs font-semibold text-black">{chartTooltip.monthLabel}</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-xs text-black">
                    <span className={`h-2.5 w-2.5 rounded-full ${chartTooltip.colorClass}`} />
                    {chartTooltip.metricLabel}: {formatCurrency(chartTooltip.value)}
                  </p>
                </div>
              )}
              <svg
                viewBox={`0 0 ${chartMetrics.width} ${chartMetrics.height}`}
                className="w-full min-w-175"
                role="img"
                aria-label="Gráfico de linha com total recebido, total de entrada e lucro por mês"
              >
                {chartMetrics.yTicks.map((tick, index) => (
                  <g key={`y-tick-${index}`}>
                    <line
                      x1={chartMetrics.padding.left}
                      y1={tick.y}
                      x2={chartMetrics.width - chartMetrics.padding.right}
                      y2={tick.y}
                      className="stroke-gray-200"
                    />
                    <text
                      x={chartMetrics.padding.left - 10}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="fill-black text-[10px]"
                    >
                      {formatCurrency(tick.value)}
                    </text>
                  </g>
                ))}

                {chartMetrics.points.map((point, index) => (
                  <text
                    key={`x-label-${index}`}
                    x={point.x}
                    y={chartMetrics.height - 20}
                    textAnchor="middle"
                    className="fill-black text-[10px]"
                  >
                    {point.label}
                  </text>
                ))}

                <path d={chartMetrics.pathRecebido} fill="none" strokeWidth={2} className="stroke-blue-600" />
                <path d={chartMetrics.pathEntrada} fill="none" strokeWidth={2} className="stroke-red-600" />
                <path d={chartMetrics.pathLucro} fill="none" strokeWidth={2} className="stroke-green-600" />

                {chartMetrics.pointSeries.recebido.map((point, index) => (
                  <circle
                    key={`recebido-point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    className="fill-blue-600 cursor-pointer"
                    onMouseEnter={() => setChartTooltip({
                      monthLabel: point.monthLabel,
                      metricLabel: "Vendas",
                      value: point.value,
                      colorClass: "bg-blue-600",
                    })}
                    onMouseLeave={() => setChartTooltip(null)}
                    onFocus={() => setChartTooltip({
                      monthLabel: point.monthLabel,
                      metricLabel: "Vendas",
                      value: point.value,
                      colorClass: "bg-blue-600",
                    })}
                    onBlur={() => setChartTooltip(null)}
                  />
                ))}
                {chartMetrics.pointSeries.entrada.map((point, index) => (
                  <circle
                    key={`entrada-point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    className="fill-red-600 cursor-pointer"
                    onMouseEnter={() => setChartTooltip({
                      monthLabel: point.monthLabel,
                      metricLabel: "Custo",
                      value: point.value,
                      colorClass: "bg-red-600",
                    })}
                    onMouseLeave={() => setChartTooltip(null)}
                    onFocus={() => setChartTooltip({
                      monthLabel: point.monthLabel,
                      metricLabel: "Custo",
                      value: point.value,
                      colorClass: "bg-red-600",
                    })}
                    onBlur={() => setChartTooltip(null)}
                  />
                ))}
                {chartMetrics.pointSeries.lucro.map((point, index) => (
                  <circle
                    key={`lucro-point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    className="fill-green-600 cursor-pointer"
                    onMouseEnter={() => setChartTooltip({
                      monthLabel: point.monthLabel,
                      metricLabel: "Lucro",
                      value: point.value,
                      colorClass: "bg-green-600",
                    })}
                    onMouseLeave={() => setChartTooltip(null)}
                    onFocus={() => setChartTooltip({
                      monthLabel: point.monthLabel,
                      metricLabel: "Lucro",
                      value: point.value,
                      colorClass: "bg-green-600",
                    })}
                    onBlur={() => setChartTooltip(null)}
                  />
                ))}
              </svg>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-2 text-black">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  Vendas
                </span>
                <span className="inline-flex items-center gap-2 text-black">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  Custo
                </span>
                <span className="inline-flex items-center gap-2 text-black">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                  Lucro
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-3 sm:p-4 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-black">Ações rápidas</h2>
        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <a href="/fornecedores" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-blue-700">Cadastrar Fornecedor</a>
          <a href="/clientes" className="inline-flex items-center justify-center rounded-md bg-teal-600 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-teal-700">Cadastrar Cliente</a>
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
                // Recarregar dados após nova venda
                (async () => {
                  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
                  const monthEnd = new Date(selectedYear, selectedMonth, 1);
                  const startDate = monthStart.toISOString().split('T')[0];
                  const endDate = monthEnd.toISOString().split('T')[0];
                  
                  const { data } = await supabase
                    .from("produtos")
                    .select("*")
                    .eq("vendido", true)
                    .gte("data_venda", startDate)
                    .lt("data_venda", endDate);
                  
                  setProdutos(data || []);
                })();
              }} />
            </div>
          </div>
        )}
      </div>

      {showSalesListModal && <SalesListModal onClose={() => setShowSalesListModal(false)} selectedMonth={selectedMonth} selectedYear={selectedYear} />}
    </div>
  );
}