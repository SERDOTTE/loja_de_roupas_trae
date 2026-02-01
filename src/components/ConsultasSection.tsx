"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface VendasMes {
  total_vendas: number;
  total_entrada: number;
  total_venda: number;
  lucro: number;
}

export function ConsultasSection() {
  const supabase = getSupabaseClient();
  const [mes, setMes] = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [ano, setAno] = useState<string>(String(new Date().getFullYear()));
  const [resultado, setResultado] = useState<VendasMes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase não configurado");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const { data, error: funcError } = await supabase.rpc("get_total_vendas_mes", {
        p_mes: parseInt(mes),
        p_ano: parseInt(ano),
      });

      if (funcError) {
        setError(`Erro ao consultar: ${funcError.message}`);
      } else {
        setResultado(data);
      }
    } catch (err: any) {
      setError(`Erro: ${err.message}`);
    }
    setLoading(false);
  };

  function formatCurrency(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const meses = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Consultas</h2>

      <form className="space-y-4" onSubmit={handleConsultar}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              {meses.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ano</label>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              min="2020"
              max={new Date().getFullYear() + 1}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Consultando..." : "Consultar Vendas"}
        </button>
      </form>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-red-600 text-sm">{error}</div>}

      {resultado && (
        <div className="mt-6 space-y-3 border-t pt-6">
          <h3 className="font-semibold text-gray-800">
            Resultado - {meses.find((m) => m.value === mes)?.label} de {ano}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-xs text-gray-600">Total de Vendas</p>
              <p className="text-lg font-bold text-blue-600">{resultado.total_vendas}</p>
            </div>
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-xs text-gray-600">Total de Entrada</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(resultado.total_entrada)}</p>
            </div>
            <div className="rounded-md bg-amber-50 p-3">
              <p className="text-xs text-gray-600">Total de Venda</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(resultado.total_venda)}</p>
            </div>
            <div className="rounded-md bg-purple-50 p-3">
              <p className="text-xs text-gray-600">Lucro</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(resultado.lucro)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
