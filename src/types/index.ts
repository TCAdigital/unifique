export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  segmento: string;
  porte?: 'Pequeno' | 'Médio' | 'Grande';
  cidade?: string;
  faturamento: number;
  colaboradores: number;
  setor: 'Privado' | 'Público' | 'Misto';
  status: 'Ativo' | 'Negociando' | 'Lead';
  funil?: string;
  consultor_nome?: string;
  especialista_nome?: string;
  pre_venda_nome?: string;
  consultor_id?: string;
  pre_venda_id?: string;
  contato?: string;
  email_contato?: string;
  tel?: string;
  created_at: string;
}

export interface Negocio {
  id: string;
  nome: string;
  empresa_id: string;
  curva?: 'A' | 'B' | 'C';
  valor: number;
  fase: 'Prospecção' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Contrato';
  funil?: string;
  probabilidade: number;
  investimento: number;
  leads: number;
  prev_fechamento?: string;
  flag?: boolean;
  sinais?: Record<string, boolean>;
  responsavel?: string;
  especialista_nome?: string;
  created_at: string;
  updated_at?: string;
  empresas?: { nome: string };
}

export interface Tarefa {
  id: string;
  titulo: string;
  empresa_id?: string;
  empresa_nome?: string;
  negocio_id?: string;
  tipo: 'Call' | 'Reunião' | 'E-mail' | 'WhatsApp' | 'Proposta' | 'Outro';
  prazo: string;
  status: 'Pendente' | 'Concluída' | 'Vencida' | 'Futura';
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  created_at: string;
}

export interface OkrLancamento {
  id: string;
  mes_idx: number;
  ano: number;
  eventos: number;
  leads: number;
  mqls: number;
  sqls: number;
  presencial: number;
  online: number;
  custo: number;
  clientes: number;
  ltv: number;
  saved: boolean;
  created_by?: string;
}

export interface Orcamento {
  id: string;
  consultor_id: string;
  periodo: string;
  categoria: 'Eventos' | 'Visitas' | 'Almoço/Jantar' | 'Ferramentas' | 'Marketing Digital' | 'Brindes' | 'Outros';
  descricao: string;
  orcamento: number;
  gasto: number;
  status: 'Planejado' | 'Executado' | 'Pendente' | 'Cancelado';
  empresa_id?: string;
  empresa_nome?: string;
  created_at: string;
}

export interface Nota {
  id: string;
  entidade_tipo: string;
  entidade_id: string;
  conteudo: string;
  autor?: string;
  created_at: string;
}

export interface Concorrente {
  id: string;
  negocio_id: string;
  nome: string;
  site?: string;
  forcas?: string;
  fraquezas?: string;
  created_at: string;
}
