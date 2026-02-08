export type Fornecedor = {
  id: string;
  cod_fornecedor?: string | null;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  created_at?: string;
};

export type Cliente = {
  id: string;
  cliente_nome: string;
  cliente_cpf_cnpj: string;
  cliente_fone?: string | null;
  cliente_email?: string | null;
  created_at?: string;
};

export type Produto = {
  id: string;
  fornecedor_id: string;
  cod_produto?: string | null;
  produto: string;
  valor_entrada: number;
  data_entrada: string; // ISO date
  vendido: boolean;
  cliente_id?: string | null;
  valor_venda?: number | null;
  data_venda?: string | null; // ISO date
  quantidade_parcelas?: number | null;
  created_at?: string;
};

export type Parcela = {
  id: string;
  produto_id: string;
  numero_parcela: number;
  valor_parcela: number;
  data_recebimento: string; // ISO date
  recebido: boolean;
  created_at?: string;
};