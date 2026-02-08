"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase.server";
import { Fornecedor } from "@/types/db";
import { SupplierForm } from "@/components/SupplierForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string>("");
  const [editForm, setEditForm] = useState({ nome: "", cpf_cnpj: "", cod_fornecedor: "", telefone: "", email: "" });
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  async function loadFornecedores() {
    const { data, error } = await supabase.from("fornecedores").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    setFornecedores(data || []);
  }

  useEffect(() => {
    loadFornecedores();
  }, [supabase]);

  useEffect(() => {
    const fornecedor = fornecedores.find((f) => f.id === selectedFornecedorId);
    if (!fornecedor) return;
    setEditForm({
      nome: fornecedor.nome || "",
      cpf_cnpj: fornecedor.cpf_cnpj || "",
      cod_fornecedor: fornecedor.cod_fornecedor || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
    });
  }, [selectedFornecedorId, fornecedores]);

  async function onSaveFornecedor(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFornecedorId) return;
    setLoadingEdit(true);
    setError(null);

    const payload = {
      nome: editForm.nome,
      cpf_cnpj: editForm.cpf_cnpj,
      cod_fornecedor: editForm.cod_fornecedor || null,
      telefone: editForm.telefone || null,
      email: editForm.email || null,
    };

    const { error } = await supabase
      .from("fornecedores")
      .update(payload)
      .eq("id", selectedFornecedorId);

    if (error) {
      setError(error.message);
    } else {
      await loadFornecedores();
      setShowEditModal(false);
      setSelectedFornecedorId("");
    }
    setLoadingEdit(false);
  }

  async function onDeleteFornecedor() {
    if (!selectedFornecedorId) return;
    setLoadingDelete(true);
    setError(null);

    const { error } = await supabase
      .from("fornecedores")
      .delete()
      .eq("id", selectedFornecedorId);

    if (error) {
      setError(error.message);
    } else {
      await loadFornecedores();
      setShowDeleteModal(false);
      setSelectedFornecedorId("");
    }
    setLoadingDelete(false);
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-black">Fornecedores</h2>
        </div>

        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-medium text-black">Cadastrar fornecedor</h3>
          <div className="mt-4">
            <SupplierForm
              onCreated={loadFornecedores}
              onEditClick={() => setShowEditModal(true)}
              onDeleteClick={() => setShowDeleteModal(true)}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white overflow-x-auto">
          <div className="p-3 sm:p-4 border-b">
            <h3 className="text-base sm:text-lg font-medium text-black">Lista de fornecedores:</h3>
          </div>
          <div className="p-3 sm:p-4">
            {error && <p className="text-xs sm:text-sm text-red-600 mb-3">{error}</p>}
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left bg-gray-50 border-b-2 border-gray-200">
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Codigo</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Nome</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">CPF/CNPJ</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Telefone</th>
                  <th className="py-3 px-4 sm:px-6 text-black font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((f, index) => (
                  <tr key={f.id} className={`border-b ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100 transition-colors`}>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.cod_fornecedor}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.nome}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.cpf_cnpj}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.telefone}</td>
                    <td className="py-3 px-4 sm:px-6 text-black">{f.email}</td>
                  </tr>
                ))}
                {fornecedores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 sm:px-6 text-center text-black">Nenhum fornecedor cadastrado.</td>
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
              <h3 className="text-lg sm:text-xl font-semibold text-black">Editar fornecedor</h3>
              <button onClick={() => setShowEditModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
            </div>

            <form className="space-y-4" onSubmit={onSaveFornecedor}>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black">Fornecedor</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                  value={selectedFornecedorId}
                  onChange={(e) => setSelectedFornecedorId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              {selectedFornecedorId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">Nome</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.nome}
                      onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">CPF/CNPJ</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.cpf_cnpj}
                      onChange={(e) => setEditForm((f) => ({ ...f, cpf_cnpj: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">Codigo</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.cod_fornecedor}
                      onChange={(e) => setEditForm((f) => ({ ...f, cod_fornecedor: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">Telefone</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.telefone}
                      onChange={(e) => setEditForm((f) => ({ ...f, telefone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black">Email</label>
                    <input
                      type="email"
                      className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedFornecedorId || loadingEdit}
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
              <h3 className="text-lg sm:text-xl font-semibold text-black">Deletar fornecedor</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-black hover:text-gray-700 text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black">Fornecedor</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-black"
                  value={selectedFornecedorId}
                  onChange={(e) => setSelectedFornecedorId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!selectedFornecedorId || loadingDelete}
                  onClick={onDeleteFornecedor}
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