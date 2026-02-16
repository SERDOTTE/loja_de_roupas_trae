"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type AgendaSeriesItem = {
  dateLabel: string;
  dateKey: string | null;
  sortValue: number;
  total_total_parcelas: number;
  total_parcelas_recebidas: number;
};

type AgendaTooltip = {
  dateLabel: string;
  metricLabel: string;
  value: number;
  colorClass: string;
};

type AgendaParcelaItem = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  produtoNome: string;
  codProduto: string;
  valorParcela: number;
  dataRecebimento: string;
  recebido: boolean;
};

type ProdutoLookup = {
  id: string;
  produto: string;
  cod_produto?: string | null;
};

type ClienteLookup = {
  id: string;
  cliente_nome: string;
  cliente_fone?: string | null;
  cliente_email?: string | null;
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

function formatDateToDayMonthFullYear(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function formatDateToFullYear(dateValue: string) {
  const isoDatePrefix = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDatePrefix) {
    const [, year, month, day] = isoDatePrefix;
    return `${day}/${month}/${year}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return formatDateToDayMonthFullYear(dateValue);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
    return dateValue;
  }

  if (/^\d{2}\/\d{2}$/.test(dateValue)) {
    return `${dateValue}/${String(new Date().getFullYear())}`;
  }

  return dateValue;
}

function getAgendaDateInfo(rawValue: unknown, index: number) {
  const rawText = String(rawValue ?? "").trim();

  const isoDatePrefix = rawText.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDatePrefix) {
    const isoDate = isoDatePrefix[1];
    const [year, month, day] = isoDate.split("-").map(Number);
    return {
      dateKey: isoDate,
      sortValue: year * 10000 + month * 100 + day,
    };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawText)) {
    const [year, month, day] = rawText.split("-").map(Number);
    return {
      dateKey: rawText,
      sortValue: year * 10000 + month * 100 + day,
    };
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawText)) {
    const [day, month, year] = rawText.split("/").map(Number);
    const isoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return {
      dateKey: isoDate,
      sortValue: year * 10000 + month * 100 + day,
    };
  }

  return {
    dateKey: null,
    sortValue: index + 1,
  };
}

function formatAgendaDateLabel(rawValue: string) {
  const rawText = rawValue.trim();

  const isoDatePrefix = rawText.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDatePrefix) {
    const [, year, month, day] = isoDatePrefix;
    return `${day}/${month}/${year}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawText)) {
    return rawText;
  }

  return rawText;
}

function getAgendaRawDateFromRow(row: Record<string, unknown>) {
  const preferredKeys = [
    "mes_inicio",
    "mes_ano",
    "ano_mes",
    "competencia",
    "data_recebimento",
    "dia_mes",
    "data",
    "data_formatada",
    "data_label",
    "dt_recebimento",
    "dt",
  ];

  for (const key of preferredKeys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return { rawDate: String(value).trim(), keyUsed: key };
    }
  }

  const dynamicDateKey = Object.keys(row).find((key) => {
    if (/^total_/i.test(key) || /^valor_/i.test(key) || /parcelas/i.test(key)) return false;
    return /(data|dia|dt_|mes_ano|ano_mes|mes_inicio|competencia)/i.test(key);
  });

  if (dynamicDateKey) {
    const value = row[dynamicDateKey];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return { rawDate: String(value).trim(), keyUsed: dynamicDateKey };
    }
  }

  return { rawDate: "", keyUsed: null as string | null };
}

function sortAgendaParcelas(items: AgendaParcelaItem[]) {
  return [...items].sort((a, b) => {
    if (a.recebido !== b.recebido) return a.recebido ? 1 : -1;
    return a.clienteNome.localeCompare(b.clienteNome, "pt-BR", { sensitivity: "base" });
  });
}

export default function DashboardClient() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [monthlySeries, setMonthlySeries] = useState<MonthlySeriesItem[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartTooltip, setChartTooltip] = useState<ChartTooltip | null>(null);
  const [agendaSeries, setAgendaSeries] = useState<AgendaSeriesItem[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [agendaTooltip, setAgendaTooltip] = useState<AgendaTooltip | null>(null);
  const [selectedAgendaDateKey, setSelectedAgendaDateKey] = useState<string | null>(null);
  const [selectedAgendaDateLabel, setSelectedAgendaDateLabel] = useState<string>("");
  const [agendaParcelas, setAgendaParcelas] = useState<AgendaParcelaItem[]>([]);
  const [agendaParcelasLoading, setAgendaParcelasLoading] = useState(false);
  const [agendaParcelasError, setAgendaParcelasError] = useState<string | null>(null);
  const [showAgendaParcelasModal, setShowAgendaParcelasModal] = useState(false);
  const [updatingParcelaId, setUpdatingParcelaId] = useState<string | null>(null);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showSalesListModal, setShowSalesListModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<string>("");

  const meses = MONTHS.map((label, index) => ({ valor: index + 1, label }));

  const loadAgendaSeries = useCallback(async () => {
    setAgendaLoading(true);
    setAgendaError(null);

    const { data, error } = await supabase.from("vendas_parcelas_por_mes").select("*");
    if (error) {
      setAgendaError(`Erro ao carregar agenda: ${error.message}`);
      setAgendaSeries([]);
      setAgendaLoading(false);
      return;
    }

    const parsed: AgendaSeriesItem[] = (data || []).map((row: Record<string, unknown>, index: number) => {
      const { rawDate } = getAgendaRawDateFromRow(row);
      const dateLabel = formatAgendaDateLabel(rawDate);
      
      const info = getAgendaDateInfo(rawDate, index);

      return {
        dateLabel,
      dateKey: info.dateKey,
      sortValue: info.sortValue,
      total_total_parcelas: toNumber(row.total_total_parcelas),
      total_parcelas_recebidas: toNumber(row.total_parcelas_recebidas),
    };
    });

    parsed.sort((a, b) => a.sortValue - b.sortValue);
    setAgendaSeries(parsed);
    setAgendaLoading(false);
  }, []);

  const loadAgendaParcelasByDate = useCallback(async (dateKey: string, dateLabel: string) => {
    setSelectedAgendaDateKey(dateKey);
    setSelectedAgendaDateLabel(dateLabel);
    setAgendaParcelasLoading(true);
    setAgendaParcelasError(null);

    const parcelasSelect = "id, produto_id, cliente_id, valor_parcela, data_recebimento, recebido";

    let parcelasData: any[] | null = null;
    let parcelasError: { message: string } | null = null;

    const orderedByNumeroParcela = await supabase
      .from("parcelas")
      .select(parcelasSelect)
      .eq("data_recebimento", dateKey)
      .order("numero_parcela", { ascending: true });

    parcelasData = orderedByNumeroParcela.data as any[] | null;
    parcelasError = orderedByNumeroParcela.error;

    if (parcelasError && /column\s+parcelas\.numero_parcela\s+does not exist/i.test(parcelasError.message)) {
      const fallbackQuery = await supabase
        .from("parcelas")
        .select(parcelasSelect)
        .eq("data_recebimento", dateKey);

      parcelasData = fallbackQuery.data as any[] | null;
      parcelasError = fallbackQuery.error;
    }

    if (parcelasError) {
      setAgendaParcelasError(
        `Erro ao carregar parcelas: ${parcelasError.message} | Consulta: from(\"parcelas\").select(\"${parcelasSelect}\").eq(\"data_recebimento\", \"${dateKey}\")`
      );
      setAgendaParcelas([]);
      setAgendaParcelasLoading(false);
      return;
    }

    const uniqueProdutoIds = Array.from(new Set((parcelasData || []).map((item: any) => item.produto_id).filter(Boolean)));
    const uniqueClienteIds = Array.from(new Set((parcelasData || []).map((item: any) => item.cliente_id).filter(Boolean)));

    const [{ data: produtosData }, { data: clientesData }] = await Promise.all([
      uniqueProdutoIds.length > 0
        ? supabase.from("produtos").select("id, produto, cod_produto").in("id", uniqueProdutoIds)
        : Promise.resolve({ data: [] as ProdutoLookup[] }),
      uniqueClienteIds.length > 0
        ? supabase.from("clientes").select("id, cliente_nome, cliente_fone, cliente_email").in("id", uniqueClienteIds)
        : Promise.resolve({ data: [] as ClienteLookup[] }),
    ]);

    const produtosMap = new Map((produtosData as ProdutoLookup[] | null || []).map((p) => [p.id, p]));
    const clientesMap = new Map((clientesData as ClienteLookup[] | null || []).map((c) => [c.id, c]));

    const parsedParcelas: AgendaParcelaItem[] = (parcelasData || []).map((item: any) => {
      const produto = produtosMap.get(item.produto_id);
      const cliente = clientesMap.get(item.cliente_id);
      return {
        id: item.id,
        clienteNome: cliente?.cliente_nome || "Cliente não informado",
        clienteTelefone: cliente?.cliente_fone || "-",
        clienteEmail: cliente?.cliente_email || "-",
        produtoNome: produto?.produto || "Produto não informado",
        codProduto: produto?.cod_produto || "-",
        valorParcela: toNumber(item.valor_parcela),
        dataRecebimento: formatDateToFullYear(item.data_recebimento),
        recebido: Boolean(item.recebido),
      };
    });

    setAgendaParcelas(sortAgendaParcelas(parsedParcelas));
    setAgendaParcelasLoading(false);
  }, []);

  const handleToggleRecebidoParcela = useCallback(async (parcelaId: string, recebido: boolean) => {
    setUpdatingParcelaId(parcelaId);
    const { error } = await supabase.from("parcelas").update({ recebido }).eq("id", parcelaId);

    if (error) {
      setAgendaParcelasError(`Erro ao atualizar parcela: ${error.message}`);
      setUpdatingParcelaId(null);
      return;
    }

    setAgendaParcelas((prev) => {
      const updated = prev.map((item) => (item.id === parcelaId ? { ...item, recebido } : item));
      return sortAgendaParcelas(updated);
    });
    setUpdatingParcelaId(null);
    await loadAgendaSeries();
  }, [loadAgendaSeries]);

  const handleOpenAgendaParcelasModal = useCallback((dateKey: string | null, dateLabel: string) => {
    if (!dateKey) return;
    setShowAgendaParcelasModal(true);
    loadAgendaParcelasByDate(dateKey, dateLabel);
  }, [loadAgendaParcelasByDate]);

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
    loadAgendaSeries();
  }, [loadAgendaSeries]);

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

  const agendaChartMetrics = useMemo(() => {
    if (agendaSeries.length === 0) return null;

    const maxY = Math.max(
      ...agendaSeries.flatMap((item) => [item.total_total_parcelas, item.total_parcelas_recebidas]),
      1
    );

    const width = Math.max(760, agendaSeries.length * 74);
    const height = 320;
    const padding = { top: 20, right: 20, bottom: 56, left: 84 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const slot = plotWidth / agendaSeries.length;
    const barWidth = Math.min(38, slot * 0.65);

    const yForValue = (value: number) => padding.top + plotHeight - (value / maxY) * plotHeight;

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const value = (maxY / 4) * i;
      return { value, y: yForValue(value) };
    });

    const bars = agendaSeries.map((item, index) => {
      const centerX = padding.left + slot * index + slot / 2;
      const x = centerX - barWidth / 2;
      const baseHeight = (item.total_total_parcelas / maxY) * plotHeight;
      const baseY = padding.top + plotHeight - baseHeight;
      const receivedHeight = (item.total_parcelas_recebidas / maxY) * plotHeight;
      const receivedY = padding.top + plotHeight - receivedHeight;
      return {
        ...item,
        centerX,
        x,
        barWidth,
        baseY,
        baseHeight,
        receivedY,
        receivedHeight,
      };
    });

    return {
      width,
      height,
      padding,
      slot,
      plotHeight,
      yTicks,
      bars,
    };
  }, [agendaSeries]);

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
                loadAgendaSeries();
              }} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-3 sm:p-4 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-black">Agenda de Recebimento</h2>

        {agendaLoading ? (
          <p className="mt-4 text-xs sm:text-sm text-black">Carregando agenda...</p>
        ) : agendaError ? (
          <p className="mt-4 text-xs sm:text-sm text-red-600">{agendaError}</p>
        ) : !agendaChartMetrics ? (
          <p className="mt-4 text-xs sm:text-sm text-black">Sem dados da agenda para exibir.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto relative">
              {agendaTooltip && (
                <div className="absolute right-2 top-2 z-10 rounded-md border bg-white px-3 py-2 shadow-sm">
                  <p className="text-xs font-semibold text-black">{agendaTooltip.dateLabel}</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-xs text-black">
                    <span className={`h-2.5 w-2.5 rounded-full ${agendaTooltip.colorClass}`} />
                    {agendaTooltip.metricLabel}: {formatCurrency(agendaTooltip.value)}
                  </p>
                </div>
              )}

              <svg
                viewBox={`0 0 ${agendaChartMetrics.width} ${agendaChartMetrics.height}`}
                className="w-full min-w-175"
                role="img"
                aria-label="Gráfico de colunas empilhadas da agenda de recebimento"
              >
                {agendaChartMetrics.yTicks.map((tick, index) => (
                  <g key={`agenda-y-${index}`}>
                    <line
                      x1={agendaChartMetrics.padding.left}
                      y1={tick.y}
                      x2={agendaChartMetrics.width - agendaChartMetrics.padding.right}
                      y2={tick.y}
                      className="stroke-gray-200"
                    />
                    <text
                      x={agendaChartMetrics.padding.left - 10}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="fill-black text-[10px]"
                    >
                      {formatCurrency(tick.value)}
                    </text>
                  </g>
                ))}

                {agendaChartMetrics.bars.map((bar, index) => (
                  <g key={`agenda-bar-${index}`}>
                    {selectedAgendaDateKey === bar.dateKey && (
                      <rect
                        x={bar.centerX - agendaChartMetrics.slot / 2}
                        y={agendaChartMetrics.padding.top}
                        width={agendaChartMetrics.slot}
                        height={agendaChartMetrics.plotHeight}
                        className="fill-blue-50"
                      />
                    )}

                    <text
                      x={bar.centerX}
                      y={agendaChartMetrics.height - 20}
                      textAnchor="middle"
                      className="fill-black text-[10px]"
                    >
                      {bar.dateLabel}
                    </text>

                    <rect
                      x={bar.x}
                      y={bar.baseY}
                      width={bar.barWidth}
                      height={bar.baseHeight}
                      className={`fill-yellow-400 cursor-pointer ${selectedAgendaDateKey === bar.dateKey ? "stroke-black stroke-2" : ""}`}
                      onMouseEnter={() => setAgendaTooltip({
                        dateLabel: bar.dateLabel,
                        metricLabel: "PREVISÃO",
                        value: bar.total_total_parcelas,
                        colorClass: "bg-yellow-400",
                      })}
                      onMouseLeave={() => setAgendaTooltip(null)}
                      onClick={() => {
                        handleOpenAgendaParcelasModal(bar.dateKey, bar.dateLabel);
                      }}
                    />

                    <rect
                      x={bar.x}
                      y={bar.receivedY}
                      width={bar.barWidth}
                      height={bar.receivedHeight}
                      className={`fill-blue-600 cursor-pointer ${selectedAgendaDateKey === bar.dateKey ? "stroke-black stroke-2" : ""}`}
                      onMouseEnter={() => setAgendaTooltip({
                        dateLabel: bar.dateLabel,
                        metricLabel: "RECEBIDO",
                        value: bar.total_parcelas_recebidas,
                        colorClass: "bg-blue-600",
                      })}
                      onMouseLeave={() => setAgendaTooltip(null)}
                      onClick={() => {
                        handleOpenAgendaParcelasModal(bar.dateKey, bar.dateLabel);
                      }}
                    />
                  </g>
                ))}
              </svg>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-2 text-black">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                PREVISÃO
              </span>
              <span className="inline-flex items-center gap-2 text-black">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                RECEBIDO
              </span>
            </div>

          </>
        )}
      </div>

      {showAgendaParcelasModal && selectedAgendaDateKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="w-full max-w-5xl max-h-[90vh] rounded-lg bg-white p-4 sm:p-6 shadow-lg overflow-y-auto">
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg sm:text-xl font-semibold text-black">Lista de recebimentos - {selectedAgendaDateLabel}</h3>
              <button
                onClick={() => setShowAgendaParcelasModal(false)}
                className="text-black hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {agendaParcelasError && <p className="mt-2 text-xs sm:text-sm text-red-600">{agendaParcelasError}</p>}

            {agendaParcelasLoading ? (
              <p className="mt-3 text-xs sm:text-sm text-black">Carregando parcelas...</p>
            ) : agendaParcelas.length === 0 ? (
              <p className="mt-3 text-xs sm:text-sm text-black">Nenhum item para esta data.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-3 text-black">Cliente</th>
                      <th className="py-2 px-3 text-black">Produto</th>
                      <th className="py-2 px-3 text-black">Código</th>
                      <th className="py-2 px-3 text-black">Valor</th>
                      <th className="py-2 px-3 text-black">Recebimento</th>
                      <th className="py-2 px-3 text-black">Recebido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendaParcelas.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b ${item.recebido ? "border-gray-100" : "border-amber-200 bg-amber-50"}`}
                      >
                        <td className="py-2 px-3 text-black">
                          <div className="flex flex-col">
                            <span>{item.clienteNome}</span>
                            <span className="text-[11px] text-gray-600">Tel: {item.clienteTelefone} | E-mail: {item.clienteEmail}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-black">{item.produtoNome}</td>
                        <td className="py-2 px-3 text-black">{item.codProduto}</td>
                        <td className="py-2 px-3 text-black">{formatCurrency(item.valorParcela)}</td>
                        <td className="py-2 px-3 text-black">{item.dataRecebimento}</td>
                        <td className="py-2 px-3 text-black">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.recebido}
                              disabled={updatingParcelaId === item.id}
                              onChange={(e) => handleToggleRecebidoParcela(item.id, e.target.checked)}
                            />
                            <span>{item.recebido ? "Sim" : "Não"}</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showSalesListModal && <SalesListModal onClose={() => setShowSalesListModal(false)} selectedMonth={selectedMonth} selectedYear={selectedYear} />}
    </div>
  );
}