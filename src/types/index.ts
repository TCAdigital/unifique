export interface Empresa {
  id: string;
  nome: string;
  segmento: string;
  faturamento: number;
  colaboradores: number;
  setor: 'Privado' | 'Público' | 'Misto';
  consultor_id?: string;
  pre_venda_id?: string;
  created_at: string;
}

export interface Negocio {
  id: string;
  nome: string;
  empresa_id: string;
  valor: number;
  fase: 'Prospecção' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Contrato';
  responsavel_id: string;
  investimento: number;
  leads: number;
  probabilidade: number;
  created_at: string;
  empresas?: Empresa;
}

export interface Tarefa {
  id: string;
  titulo: string;
  empresa_id?: string;
  negocio_id?: string;
  tipo: 'Call' | 'Reunião' | 'E-mail' | 'WhatsApp' | 'Proposta' | 'Outro';
  prazo: string;
  responsavel_id: string;
  status: 'Pendente' | 'Concluída' | 'Vencida';
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  created_at: string;
}
