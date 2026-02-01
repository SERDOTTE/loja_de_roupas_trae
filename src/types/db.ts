export type Fornecedor = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  created_at?: string;
};

export type Produto = {
  id: string;
  fornecedor_id: string;
  produto: string;
  valor_entrada: number;
  data_entrada: string; // ISO date
  vendido: boolean;
  valor_venda?: number | null;
  data_venda?: string | null; // ISO date
  data_recebimento?: string | null; // ISO date
  created_at?: string;
};