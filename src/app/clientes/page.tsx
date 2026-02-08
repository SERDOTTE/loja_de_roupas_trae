"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.server";
import { Cliente } from "@/types/db";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function ClienteForm({
  onCreated,
  onEditClick,
  onDeleteClick,
}: {
  onCreated?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}) {
  const [form, setForm] = useState({
    cliente_nome: "",
    cliente_cpf_cnpj: "",
    cliente_fone: "",
    cliente_email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { cliente_nome, cliente_cpf_cnpj } = form;
    if (!cliente_nome || !cliente_cpf_cnpj) {
      setError("Nome e CPF/CNPJ são obrigatórios.");
      setLoading(false);
      return;
    }

    const payload = {
      cliente_nome,
      cliente_cpf_cnpj,
      cliente_fone: form.cliente_fone || null,
      cliente_email: form.cliente_email || null,
    };

    const { error } = await supabase.from("clientes").insert(payload);
    if (error) {
      setError(error.message);
    } else {
      setForm({ cliente_nome: "", cliente_cpf_cnpj: "", cliente_fone: "", cliente_email: "" });
      onCreated?.();
    }
    setLoading(false);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Nome *</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="Nome do cliente"
            value={form.cliente_nome}
            onChange={(e) => setForm((f) => ({ ...f, cliente_nome: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">CPF/CNPJ *</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="000.000.000-00"
            value={form.cliente_cpf_cnpj}
            onChange={(e) => setForm((f) => ({ ...f, cliente_cpf_cnpj: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">Telefone</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="(00) 00000-0000"
            value={form.cliente_fone}
            onChange={(e) => setForm((f) => ({ ...f, cliente_fone: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-black">E-mail</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border px-3 py-2 text-black"
            placeholder="email@exemplo.com"
            value={form.cliente_email}
            onChange={(e) => setForm((f) => ({ ...f, cliente_email: e.target.value }))}
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
          {loading ? "Salvando..." : "Salvar cliente"}
        </button>
        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="w-full sm:w-auto rounded-md bg-blue-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-blue-700"
          >
            Editar cliente
          </button>
        )}
        {onDeleteClick && (
          <button
            type="button"
            onClick={onDeleteClick}
            className="w-full sm:w-auto rounded-md bg-red-600 px-4 py-2 text-sm sm:text-base text-white hover:bg-red-700"
          >
            Excluir cliente
          </button>
        )}
      </div>
    </form>
  );
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const [editForm, setEditForm] = useState({ cliente_nome: "", cliente_cpf_cnpj: "", cliente_fone: "", cliente_email: "" });
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Debug 1: Verificar variáveis de ambiente
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        const envDebug = `URL: ${url ? "✅" : "❌"} | Key: ${key ? "✅" : "❌"}`;
        setDebugInfo(`Env: ${envDebug}`);
        console.log("🔍 SUPABASE CONFIG:", envDebug);

        if (!url || !key) {
          setError("❌ Supabase não configurado! Verifique .env.local");
          return;
        }

        // Debug 1.5: Verificar usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        console.log("👤 Usuário autenticado:", user?.email);
        if (user?.email) {
          setUserEmail(user.email);
        }

        // Debug 2: Fazer query SEM order para testar RLS
        console.log("📡 Iniciando query simples (sem order)...");
        setDebugInfo("📡 Buscando dados (teste simples)...");
        
        const { data: simpleData, error: simpleError } = await supabase
          .from("clientes")
          .select("*");
        
        console.log("📊 QUERY SIMPLES:", {
          error: simpleError,
          dataLength: simpleData?.length,
          data: simpleData
        });

        if (simpleError) {
          console.error("❌ ERRO SUPABASE:", simpleError);
          setDebugInfo(`❌ ERRO RLS: ${simpleError.code}`);
          
          // Mensagem detalhada com instruções
          const instructions = `
🔒 ROW LEVEL SECURITY ESTÁ ATIVO (bloqueando leitura)

Erro: ${simpleError.message}

SOLUÇÃO RÁPIDA - Desabilitar RLS (para testes):
═══════════════════════════════════════════════════
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu esquerdo: "Authentication" → "Policies"
4. Procure a tabela "clientes"
5. Clique em "Disable RLS" (ou delete as policies)
6. Volte para cá e recarregue (F5)

SOLUÇÃO PERMANENTE - Criar política aberta:
═══════════════════════════════════════════════════
Se preferir manter RLS ativo:
1. Vá para "clientes" → "RLS Policies"
2. Clique "New Policy" → "For SELECT"
3. Use: USING (true)
4. Criar policy
5. Recarregue a página
`;
          
          setError(instructions);
          return;
        }

        // Se chegou aqui, não há erro RLS
        if (!simpleData || simpleData.length === 0) {
          console.warn("⚠️ Nenhum dado retornado - possível RLS ou tabela vazia");
          setDebugInfo("⚠️ Query OK mas nenhum cliente encontrado");
          
          // Verifique se há dados analisando sem filtros
          const allDataError = `
⚠️ NENHUM CLIENTE ENCONTRADO

A query foi bem-sucedida, mas retornou 0 clientes.

Possíveis causas:
1. ✅ RLS foi desabilitado/RESOLVIDO
   → Mas a tabela está realmente vazia
   
2. ❌ RLS ainda está ativo
   → Siga as instruções acima para desabilitar

PRÓXIMOS PASSOS:
═══════════════════════════════════════════════════
1. Verifique no Supabase Dashboard se há clientes
2. Vá para "clientes" table e veja os dados
3. Cheque os nomes das colunas:
   - cliente_nome ✓
   - cliente_cpf_cnpj ✓
   - cliente_fone ✓
   - cliente_email ✓
4. Recarregue a página (F5)
`;
          
          setError(allDataError);
          setClientes([]);
          return;
        }

        console.log(`✅ Sucesso! ${simpleData.length} clientes encontrados`);
        console.log("Dados:", JSON.stringify(simpleData, null, 2));
        
        // Agora tentar com order
        const { data: orderedData } = await supabase
          .from("clientes")
          .select("*")
          .order("cliente_nome");
        
        setClientes(orderedData || simpleData);
        setDebugInfo(`✅ ${(orderedData || simpleData)?.length} clientes carregados`);
        setError(null);
      } catch (err: any) {
        console.error("💥 ERRO INESPERADO:", err);
        setDebugInfo(`💥 ERRO: ${err.message}`);
        setError(`Erro inesperado: ${err.message}`);
      }
    })();
  }, []);

  const loadClientes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("clientes")
        .select("*")
        .order("cliente_nome");
      
      if (fetchError) {
        setError(`Erro ao carregar clientes: ${fetchError.message}`);
      } else {
        setClientes(data || []);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadEditForm = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return;
    setEditForm({
      cliente_nome: cliente.cliente_nome || "",
      cliente_cpf_cnpj: cliente.cliente_cpf_cnpj || "",
      cliente_fone: cliente.cliente_fone || "",
      cliente_email: cliente.cliente_email || "",
    });
  };

  const handleEditClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    loadEditForm(clienteId);
  };

  async function onSaveCliente(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClienteId) return;
    setLoadingEdit(true);
    setError(null);

    const { cliente_nome, cliente_cpf_cnpj } = editForm;
    if (!cliente_nome || !cliente_cpf_cnpj) {
      setError("Nome e CPF/CNPJ são obrigatórios.");
      setLoadingEdit(false);
      return;
    }

    const payload = {
      cliente_nome,
      cliente_cpf_cnpj,
      cliente_fone: editForm.cliente_fone || null,
      cliente_email: editForm.cliente_email || null,
    };

    const { error } = await supabase
      .from("clientes")
      .update(payload)
      .eq("id", selectedClienteId);

    if (error) {
      setError(error.message);
    } else {
      await loadClientes();
      setShowEditModal(false);
      setSelectedClienteId("");
    }
    setLoadingEdit(false);
  }

  async function onDeleteCliente() {
    if (!selectedClienteId) return;
    setLoadingDelete(true);
    setError(null);

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", selectedClienteId);

    if (error) {
      setError(error.message);
    } else {
      await loadClientes();
      setShowDeleteModal(false);
      setSelectedClienteId("");
    }
    setLoadingDelete(false);
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-black">Clientes</h2>
        </div>

        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-medium text-black">Cadastrar cliente</h3>
          <div className="mt-4">
            <ClienteForm
              onCreated={loadClientes}
              onEditClick={() => setShowEditModal(true)}
              onDeleteClick={() => setShowDeleteModal(true)}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white">
          <div className="p-3 sm:p-4 border-b flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-medium text-black">Lista de clientes</h3>
            <button
              onClick={loadClientes}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔄 Recarregar
            </button>
          </div>

          {debugInfo && (
            <div className="p-3 sm:p-4 bg-blue-50 border-b text-xs text-blue-700">
              <strong>Debug:</strong> {debugInfo}
            </div>
          )}
          
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border-b text-xs sm:text-sm text-red-700">
              <strong>❌ Erro:</strong> {error}
            </div>
          )}
          
          <div className="p-3 sm:p-4 overflow-x-auto">
            <p className="text-xs text-gray-600 mb-3">
              <strong>Total:</strong> {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
            </p>
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left bg-gray-50 border-b-2 border-gray-200">
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Nome</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">CPF/CNPJ</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Telefone</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">E-mail</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length > 0 ? (
                  clientes.map((c, index) => (
                    <tr
                      key={c.id}
                      className={`border-b ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}
                    >
                      <td className="py-3 px-4 sm:px-6 text-black">{c.cliente_nome}</td>
                      <td className="py-3 px-4 sm:px-6 text-black">{c.cliente_cpf_cnpj}</td>
                      <td className="py-3 px-4 sm:px-6 text-black">{c.cliente_fone || "-"}</td>
                      <td className="py-3 px-4 sm:px-6 text-black">{c.cliente_email || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 sm:px-6 text-center text-gray-500">
                      <p className="mb-2">📭 Nenhum cliente cadastrado</p>
                      <p className="text-xs">Verifique se há dados na tabela "clientes" do Supabase</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-4 sm:p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-black">Editar cliente</h3>
              <button onClick={() => setShowEditModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
            </div>

            <form className="space-y-4" onSubmit={onSaveCliente}>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black">Cliente</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                  value={selectedClienteId}
                  onChange={(e) => handleEditClienteChange(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.cliente_nome}</option>
                  ))}
                </select>
              </div>

              {selectedClienteId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">Nome</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.cliente_nome}
                      onChange={(e) => setEditForm((f) => ({ ...f, cliente_nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">CPF/CNPJ</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.cliente_cpf_cnpj}
                      onChange={(e) => setEditForm((f) => ({ ...f, cliente_cpf_cnpj: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">Telefone</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.cliente_fone}
                      onChange={(e) => setEditForm((f) => ({ ...f, cliente_fone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">Email</label>
                    <input
                      type="email"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.cliente_email}
                      onChange={(e) => setEditForm((f) => ({ ...f, cliente_email: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedClienteId || loadingEdit}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loadingEdit ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 sm:p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-black">Excluir cliente</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black">Cliente</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.cliente_nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!selectedClienteId || loadingDelete}
                  onClick={onDeleteCliente}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {loadingDelete ? "Excluindo..." : "Confirmar exclusao"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
