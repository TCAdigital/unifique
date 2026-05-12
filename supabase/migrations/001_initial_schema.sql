-- ================================================================
-- UNIFIQUE — Supabase Schema (public)
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Reset completo (idempotente — seguro re-executar)
DROP TABLE IF EXISTS pipeline_snapshots, ai_execucoes, ai_agentes, mensagens,
  okr_dados, ti_vendas, ti_movimentacoes, ti_itens, orcamentos,
  tarefas, negocios, empresas, usuarios CASCADE;
DROP FUNCTION IF EXISTS fn_updated_at CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- TABELAS
-- ================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome          VARCHAR(120) NOT NULL,
    email         VARCHAR(200) NOT NULL UNIQUE,
    perfil        VARCHAR(30)  NOT NULL DEFAULT 'consultor'
                  CHECK (perfil IN ('admin','gerente','consultor','preVenda')),
    avatar        VARCHAR(5),
    cargo         VARCHAR(100),
    password_hash TEXT,
    ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_login  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empresas (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome           VARCHAR(200) NOT NULL,
    cnpj           VARCHAR(20),
    segmento       VARCHAR(100),
    porte          VARCHAR(50)  CHECK (porte IN ('Pequeno','Médio','Grande','Enterprise')),
    colaboradores  INT          DEFAULT 0,
    faturamento    NUMERIC(18,2) DEFAULT 0,
    cidade         VARCHAR(100),
    estado         CHAR(2),
    website        TEXT,
    contato        VARCHAR(120),
    email_contato  VARCHAR(200),
    tel            VARCHAR(30),
    whatsapp       VARCHAR(30),
    status         VARCHAR(50)  DEFAULT 'Lead'
                   CHECK (status IN ('Lead','Negociando','Ativo','Inativo','Churned')),
    setor          VARCHAR(50)  DEFAULT 'Privado'
                   CHECK (setor IN ('Privado','Público','Misto','Terceiro Setor')),
    funil          VARCHAR(100),
    curva          CHAR(1)      CHECK (curva IN ('A','B','C')),
    consultor_nome VARCHAR(120),
    pre_venda_nome VARCHAR(120),
    icp_score      SMALLINT     DEFAULT 0 CHECK (icp_score BETWEEN 0 AND 100),
    created_by     UUID         REFERENCES usuarios(id),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empresas_nome   ON empresas USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);

CREATE TABLE IF NOT EXISTS negocios (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome            VARCHAR(200) NOT NULL,
    empresa_id      UUID         REFERENCES empresas(id) ON DELETE SET NULL,
    empresa_nome    VARCHAR(200),
    curva           CHAR(1)      DEFAULT 'B' CHECK (curva IN ('A','B','C')),
    valor           NUMERIC(18,2) DEFAULT 0,
    fase            VARCHAR(100) NOT NULL DEFAULT 'Prospecção',
    funil           VARCHAR(100) DEFAULT 'Comercial B2B',
    prev_fechamento DATE,
    probabilidade   SMALLINT     DEFAULT 50 CHECK (probabilidade BETWEEN 0 AND 100),
    responsavel     VARCHAR(120),
    responsavel_id  UUID         REFERENCES usuarios(id),
    investimento    NUMERIC(18,2) DEFAULT 0,
    leads           INT          DEFAULT 0,
    flagged         BOOLEAN      DEFAULT FALSE,
    budget_ok       BOOLEAN      DEFAULT FALSE,
    authority_ok    BOOLEAN      DEFAULT FALSE,
    need_ok         BOOLEAN      DEFAULT FALSE,
    timeline_ok     BOOLEAN      DEFAULT FALSE,
    score_ia        SMALLINT     DEFAULT 0 CHECK (score_ia BETWEEN 0 AND 100),
    risco_ia        VARCHAR(20)  DEFAULT 'médio' CHECK (risco_ia IN ('baixo','médio','alto','crítico')),
    prox_acao_ia    TEXT,
    sinais          JSONB        DEFAULT '{}',
    contrato        JSONB        DEFAULT '{}',
    projeto         JSONB,
    lost_motivo     TEXT,
    created_by      UUID         REFERENCES usuarios(id),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negocios_empresa     ON negocios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_negocios_fase        ON negocios(fase);
CREATE INDEX IF NOT EXISTS idx_negocios_responsavel ON negocios(responsavel_id);

CREATE TABLE IF NOT EXISTS tarefas (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo          VARCHAR(300) NOT NULL,
    empresa_nome    VARCHAR(200),
    empresa_id      UUID         REFERENCES empresas(id) ON DELETE SET NULL,
    negocio_nome    VARCHAR(200),
    negocio_id      UUID         REFERENCES negocios(id) ON DELETE SET NULL,
    tipo            VARCHAR(50)  DEFAULT 'Tarefa'
                    CHECK (tipo IN ('Tarefa','Email','WhatsApp','Ligacao','Teams','Reunião')),
    prazo           DATE,
    responsavel     VARCHAR(120),
    responsavel_id  UUID         REFERENCES usuarios(id),
    status          VARCHAR(30)  DEFAULT 'Pendente'
                    CHECK (status IN ('Pendente','Concluída','Vencida','Cancelada')),
    prioridade      VARCHAR(20)  DEFAULT 'Media'
                    CHECK (prioridade IN ('Alta','Media','Baixa')),
    descricao       TEXT,
    resultado       TEXT,
    is_ai_generated BOOLEAN      DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarefas_negocio     ON tarefas(negocio_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status      ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo       ON tarefas(prazo);

CREATE TABLE IF NOT EXISTS orcamentos (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultor    VARCHAR(120),
    consultor_id UUID         REFERENCES usuarios(id),
    categoria    VARCHAR(100),
    descricao    TEXT,
    orcamento    NUMERIC(18,2) DEFAULT 0,
    gasto        NUMERIC(18,2) DEFAULT 0,
    periodo      DATE,
    status       VARCHAR(30)  DEFAULT 'Ativo'
                 CHECK (status IN ('Ativo','Encerrado','Pendente')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ti_itens (
    id           VARCHAR(20)  PRIMARY KEY,
    tipo         VARCHAR(30)  NOT NULL CHECK (tipo IN ('Equipamento','Licenca','Acessorio')),
    nome         VARCHAR(200) NOT NULL,
    modelo       VARCHAR(200),
    serial       VARCHAR(100),
    fornecedor   VARCHAR(150),
    custo_unit   NUMERIC(12,2) DEFAULT 0,
    qtd_estoque  INT          DEFAULT 0,
    qtd_min      INT          DEFAULT 1,
    status       VARCHAR(30)  DEFAULT 'Disponivel'
                 CHECK (status IN ('Disponivel','Reservado','Vendido','Manutencao','Baixado')),
    data_entrada DATE,
    obs          TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ti_movimentacoes (
    id         VARCHAR(20)  PRIMARY KEY,
    data_mov   DATE         NOT NULL DEFAULT CURRENT_DATE,
    tipo       VARCHAR(30)  NOT NULL
               CHECK (tipo IN ('Compra','Venda','Transferencia','Devolucao','Baixa','Ajuste')),
    item_id    VARCHAR(20)  REFERENCES ti_itens(id),
    item_nome  VARCHAR(200),
    qtd        INT          NOT NULL DEFAULT 1,
    custo      NUMERIC(12,2) DEFAULT 0,
    usuario    VARCHAR(120),
    usuario_id UUID         REFERENCES usuarios(id),
    obs        TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ti_vendas (
    id                  VARCHAR(20)  PRIMARY KEY,
    cliente             VARCHAR(200),
    data_venda          DATE         NOT NULL DEFAULT CURRENT_DATE,
    status              VARCHAR(30)  DEFAULT 'Rascunho'
                        CHECK (status IN ('Rascunho','Confirmada','Faturada','Cancelada')),
    responsavel         VARCHAR(120),
    responsavel_id      UUID         REFERENCES usuarios(id),
    obs                 TEXT,
    itens               JSONB        NOT NULL DEFAULT '[]',
    despesas_adicionais NUMERIC(12,2) DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS okr_dados (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes        VARCHAR(10)  NOT NULL,
    mes_idx    SMALLINT     NOT NULL CHECK (mes_idx BETWEEN 0 AND 11),
    ano        SMALLINT     NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::SMALLINT,
    eventos    NUMERIC(8,1) DEFAULT 0,
    leads      NUMERIC(8,1) DEFAULT 0,
    mqls       NUMERIC(8,1) DEFAULT 0,
    sqls       NUMERIC(8,1) DEFAULT 0,
    presencial NUMERIC(8,1) DEFAULT 0,
    online     NUMERIC(8,1) DEFAULT 0,
    custo      NUMERIC(14,2) DEFAULT 0,
    clientes   NUMERIC(8,1) DEFAULT 0,
    ltv        NUMERIC(14,2) DEFAULT 0,
    saved      BOOLEAN      DEFAULT FALSE,
    updated_by UUID         REFERENCES usuarios(id),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (mes_idx, ano)
);

CREATE TABLE IF NOT EXISTS ai_agentes (
    id            VARCHAR(50)  PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    tipo          VARCHAR(50)  NOT NULL,
    icone         VARCHAR(10),
    cor           VARCHAR(20),
    grupo         VARCHAR(50),
    system_prompt TEXT,
    modelo        VARCHAR(100) DEFAULT 'claude-sonnet-4-6',
    temperatura   NUMERIC(3,2) DEFAULT 0.3,
    ativo         BOOLEAN      DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_execucoes (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    agente_id     VARCHAR(50)  REFERENCES ai_agentes(id),
    negocio_id    UUID         REFERENCES negocios(id) ON DELETE SET NULL,
    empresa_id    UUID         REFERENCES empresas(id) ON DELETE SET NULL,
    gatilho       VARCHAR(100),
    tarefa        TEXT,
    status        VARCHAR(20)  DEFAULT 'sucesso'
                  CHECK (status IN ('rodando','sucesso','falhou','pulado')),
    progresso     SMALLINT     DEFAULT 100,
    tokens_usados INT,
    custo_usd     NUMERIC(10,6),
    duracao_ms    INT,
    output        JSONB,
    erro          TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensagens (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    canal           VARCHAR(30)  NOT NULL CHECK (canal IN ('whatsapp','email','teams','linkedin','slack')),
    direcao         VARCHAR(10)  NOT NULL CHECK (direcao IN ('entrada','saida','sistema')),
    contato_nome    VARCHAR(120),
    contato_tel     VARCHAR(50),
    empresa_nome    VARCHAR(200),
    negocio_id      UUID         REFERENCES negocios(id) ON DELETE SET NULL,
    assunto         TEXT,
    corpo           TEXT         NOT NULL,
    status          VARCHAR(30)  DEFAULT 'enviado'
                    CHECK (status IN ('fila','enviado','entregue','lido','respondido','falhou')),
    is_ai_generated BOOLEAN      DEFAULT FALSE,
    agente_id       VARCHAR(50),
    lido            BOOLEAN      DEFAULT FALSE,
    enviado_em      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_snapshots (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_snap   DATE         NOT NULL DEFAULT CURRENT_DATE,
    fase        VARCHAR(100) NOT NULL,
    qtd_deals   INT          DEFAULT 0,
    valor_total NUMERIC(18,2) DEFAULT 0,
    score_medio NUMERIC(5,2),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (data_snap, fase)
);

-- ================================================================
-- TRIGGER updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_updated_at ON usuarios;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON empresas;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON negocios;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON negocios FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON tarefas;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON tarefas FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON orcamentos;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON orcamentos FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON ti_itens;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON ti_itens FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON ti_vendas;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON ti_vendas FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at ON okr_dados;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON okr_dados FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ================================================================
-- RLS — permissivo para chave anon (app interno)
-- ================================================================
ALTER TABLE usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE negocios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ti_itens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ti_movimentacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ti_vendas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_dados         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agentes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_execucoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_all ON usuarios;
CREATE POLICY anon_all ON usuarios FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON empresas;
CREATE POLICY anon_all ON empresas FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON negocios;
CREATE POLICY anon_all ON negocios FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON tarefas;
CREATE POLICY anon_all ON tarefas FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON orcamentos;
CREATE POLICY anon_all ON orcamentos FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON ti_itens;
CREATE POLICY anon_all ON ti_itens FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON ti_movimentacoes;
CREATE POLICY anon_all ON ti_movimentacoes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON ti_vendas;
CREATE POLICY anon_all ON ti_vendas FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON okr_dados;
CREATE POLICY anon_all ON okr_dados FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON ai_agentes;
CREATE POLICY anon_all ON ai_agentes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON ai_execucoes;
CREATE POLICY anon_all ON ai_execucoes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON mensagens;
CREATE POLICY anon_all ON mensagens FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all ON pipeline_snapshots;
CREATE POLICY anon_all ON pipeline_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);

-- ================================================================
-- SEED — AGENTES IA
-- ================================================================
INSERT INTO ai_agentes (id, nome, tipo, icone, cor, grupo, system_prompt) VALUES
('sdr',      'SDR-AI Outbound',   'prospecting',    '📡','#0057B8','Prospecção',   'Especialista em prospecção B2B. Gere sequências personalizadas por persona, pesquise decisores e crie mensagens de abertura relevantes. Nunca invente dados.'),
('icp',      'ICP Scorer AI',     'qualification',  '⬡', '#7C3AED','Triagem',      'Avalie o fit de leads com base em indústria, porte, cargo e comportamento. Gere score 0-100 com justificativa clara.'),
('bant',     'BANT Qualifier AI', 'qualification',  '🔍','#1D9E75','Qualificação', 'Conduza qualificação via WhatsApp/email com framework BANT. Faça perguntas abertas e registre resultados no CRM.'),
('routing',  'Routing AI',        'routing',        '↗', '#D97706','Roteamento',   'Analise fit, carga de trabalho e experiência dos consultores para atribuir oportunidades de forma otimizada.'),
('health',   'Deal Health AI',    'pipeline',       '💓','#DC2626','Pipeline',     'Monitore deals continuamente. Calcule health score, identifique estagnação e sugira próxima ação ao responsável.'),
('forecast', 'Forecast AI',       'analytics',      '📈','#0D9488','Previsão',     'Agregue dados CRM e histórico para gerar forecast rolling. Simule cenários e prepare resumos competitivos.'),
('proposal', 'Proposal AI',       'proposal',       '📋','#3A5A80','Fechamento',   'Gere propostas personalizadas por perfil de decisor (CFO/CTO/CEO) com ROI calculado e cases relevantes.'),
('comms',    'Comms AI',          'communications', '📨','#128C7E','Follow-up',    'Gerencie follow-ups por email e WhatsApp. Analise comportamento do lead e adapte o próximo contato.')
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SEED — USUÁRIOS
-- ================================================================
INSERT INTO usuarios (nome, email, perfil, avatar, cargo) VALUES
('Tadeu Alves', 'tadeu.alves@redeunifique.com.br', 'admin',     'TA', 'Administrador · Rede Unifique'),
('Maria Souza', 'maria.souza@redeunifique.com.br', 'gerente',   'MS', 'Gerente Comercial'),
('João Silva',  'joao.silva@redeunifique.com.br',  'consultor', 'JS', 'Consultor Senior'),
('Ana Paula',   'ana.paula@redeunifique.com.br',   'consultor', 'AP', 'Consultor Pleno'),
('Carlos Lima', 'carlos.lima@redeunifique.com.br', 'preVenda',  'CL', 'Pré Venda')
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- SEED — EMPRESAS
-- ================================================================
INSERT INTO empresas (nome, segmento, porte, colaboradores, faturamento, cidade, contato, email_contato, tel, status, funil, consultor_nome) VALUES
('GrupoMax',         'Indústria',    'Grande',  1800, 4200000, 'São Paulo',     'Roberto Alves', 'roberto@grupomax.com',   '(11) 9 9999-0001', 'Ativo',      'Comercial B2B', 'Maria Souza'),
('Retail Group SA',  'Varejo',       'Grande',  1200, 2800000, 'Campinas',      'Maria Souza',   'maria@retailgroup.com',  '(19) 9 9888-0002', 'Ativo',      'Varejo',        'João Silva'),
('TechSolutions',    'Tecnologia',   'Médio',    250, 1200000, 'São Paulo',     'João Silva',    'joao@techsolutions.com', '(11) 9 9777-0003', 'Ativo',      'SaaS',          'João Silva'),
('Distribuidora RS', 'Distribuição', 'Médio',    320,  680000, 'Porto Alegre',  'Ana Paula',     'ana@distribrs.com',      '(51) 9 9666-0004', 'Negociando', 'Comercial B2B', 'Ana Paula'),
('Startup XYZ',      'Fintech',      'Pequeno',   40,   95000, 'Rio de Janeiro','Carlos Lima',   'carlos@startupxyz.com',  '(21) 9 9333-0007', 'Lead',       'SaaS',          'Carlos Lima')
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED — NEGÓCIOS
-- ================================================================
INSERT INTO negocios (nome, empresa_nome, curva, valor, fase, funil, probabilidade, responsavel, score_ia, sinais, budget_ok, authority_ok, need_ok, timeline_ok) VALUES
('Implantação CRM',    'GrupoMax',        'A', 320000, 'Fechamento', 'Comercial B2B', 95, 'Maria Souza', 88, '{"urgencia":true,"orcamento":true,"decisor":true}',true, true, true,  true),
('Licença Enterprise', 'Retail Group SA', 'A', 230000, 'Negociação', 'Comercial B2B', 65, 'João Silva',  72, '{"orcamento":true,"decisor":true,"proposta":true}',true, true, false, false),
('Pedido Q2',          'Distribuidora RS','B',  78000, 'Fechamento', 'Varejo',        90, 'Ana Paula',   81, '{"urgencia":true,"prazo_curto":true}',              true, false,true,  true),
('Plano SaaS Pro',     'TechSolutions',   'B',  85000, 'Demo',       'SaaS',          50, 'Carlos Lima', 55, '{"resposta_rapida":true,"demo":true}',              false,false,true,  false)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED — TAREFAS
-- ================================================================
INSERT INTO tarefas (titulo, empresa_nome, negocio_nome, tipo, prazo, responsavel, status, prioridade) VALUES
('Enviar proposta revisada', 'GrupoMax',        'Implantação CRM',    'Tarefa', CURRENT_DATE + 2, 'Maria Souza', 'Pendente', 'Alta'),
('Follow-up sem resposta',   'Retail Group SA', 'Licença Enterprise', 'Email',  CURRENT_DATE - 1, 'João Silva',  'Vencida',  'Alta'),
('Agendar demo',             'Startup XYZ',     'Plano SaaS',         'Teams',  CURRENT_DATE + 7, 'Carlos Lima', 'Pendente', 'Media')
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED — TI ITENS
-- ================================================================
INSERT INTO ti_itens (id, tipo, nome, modelo, fornecedor, custo_unit, qtd_estoque, qtd_min, data_entrada) VALUES
('IT001','Equipamento','Notebook Dell Latitude 5540',    'Latitude 5540', 'Dell Brasil',   6800, 5, 2,'2024-01-10'),
('IT002','Equipamento','Notebook Lenovo ThinkPad E14',   'ThinkPad E14',  'Lenovo Brasil', 5500, 3, 1,'2024-03-01'),
('IT003','Licenca',    'Microsoft 365 Business Premium', 'M365 Premium',  'Microsoft',      230,80,10,'2024-01-01'),
('IT004','Licenca',    'Adobe Creative Cloud All Apps',  'CC All Apps',   'Adobe',          480,10, 3,'2025-01-01'),
('IT005','Equipamento','Headset Jabra Evolve2 55',        'Evolve2 55',    'Jabra',         1800, 8, 2,'2024-02-01'),
('IT006','Licenca',    'Kaspersky Endpoint Security',     'KES Cloud',     'Kaspersky',       50, 0, 5,'2024-04-01')
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SEED — OKR
-- ================================================================
INSERT INTO okr_dados (mes, mes_idx, ano, eventos, leads, mqls, sqls, custo) VALUES
('Jan', 0, 2025, 1, 22, 7, 1,  8500),
('Fev', 1, 2025, 1, 28, 8, 2,  9200),
('Mar', 2, 2025, 2, 35,11, 3, 14000),
('Abr', 3, 2025, 1, 30, 9, 2, 11000)
ON CONFLICT (mes_idx, ano) DO NOTHING;

-- ================================================================
-- FIM — Unifique Plataforma TIC v2.0
-- ================================================================
