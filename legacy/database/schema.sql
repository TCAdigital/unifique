-- ================================================================
-- UNIFIQUE — PostgreSQL Database Schema
-- Versão: 2.0 | Plataforma de Negócios TIC
-- Execute: psql -U postgres -d unifique -f schema.sql
-- ================================================================

-- Criação do banco (execute separadamente se necessário)
-- CREATE DATABASE unifique ENCODING 'UTF8' LC_COLLATE='pt_BR.UTF-8';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- SCHEMA
-- ================================================================
CREATE SCHEMA IF NOT EXISTS unifique;
SET search_path = unifique, public;

-- ================================================================
-- 1. USUÁRIOS E PERFIS
-- ================================================================
CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome            VARCHAR(120) NOT NULL,
    email           VARCHAR(200) NOT NULL UNIQUE,
    perfil          VARCHAR(30) NOT NULL DEFAULT 'consultor'
                    CHECK (perfil IN ('admin','gerente','consultor','preVenda')),
    avatar          VARCHAR(5),
    cargo           VARCHAR(100),
    password_hash   TEXT,
    o365_token      TEXT,
    o365_id         TEXT UNIQUE,
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_login    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE usuarios IS 'Usuários da plataforma — autenticação via Microsoft 365 ou senha local.';

-- ================================================================
-- 2. EMPRESAS (ACCOUNTS / CRM)
-- ================================================================
CREATE TABLE empresas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome            VARCHAR(200) NOT NULL,
    segmento        VARCHAR(100),
    porte           VARCHAR(50) CHECK (porte IN ('Pequeno','Médio','Grande','Enterprise')),
    funcionarios    INT DEFAULT 0,
    faturamento     NUMERIC(18,2) DEFAULT 0,
    cidade          VARCHAR(100),
    estado          CHAR(2),
    pais            CHAR(2) DEFAULT 'BR',
    website         TEXT,
    linkedin_url    TEXT,
    contato         VARCHAR(120),
    email           VARCHAR(200),
    tel             VARCHAR(30),
    whatsapp        VARCHAR(30),
    status          VARCHAR(50) DEFAULT 'Lead'
                    CHECK (status IN ('Lead','Negociando','Ativo','Inativo','Churned')),
    setor           VARCHAR(50) DEFAULT 'Privado'
                    CHECK (setor IN ('Privado','Público','Terceiro Setor')),
    funil           VARCHAR(100),
    curva           CHAR(1) CHECK (curva IN ('A','B','C')),
    consultor_nome  VARCHAR(120),
    pre_venda_nome  VARCHAR(120),
    icp_score       SMALLINT DEFAULT 0 CHECK (icp_score BETWEEN 0 AND 100),
    created_by      UUID REFERENCES usuarios(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empresas_nome ON empresas USING gin (nome gin_trgm_ops);
CREATE INDEX idx_empresas_status ON empresas(status);
CREATE INDEX idx_empresas_curva ON empresas(curva);

-- ================================================================
-- 3. NEGÓCIOS (DEALS / OPORTUNIDADES)
-- ================================================================
CREATE TABLE negocios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome            VARCHAR(200) NOT NULL,
    empresa_id      UUID REFERENCES empresas(id) ON DELETE SET NULL,
    empresa_nome    VARCHAR(200),
    curva           CHAR(1) DEFAULT 'B' CHECK (curva IN ('A','B','C')),
    valor           NUMERIC(18,2) DEFAULT 0,
    fase            VARCHAR(100) NOT NULL DEFAULT 'Prospecção',
    funil           VARCHAR(100) DEFAULT 'Comercial B2B',
    prev_fechamento DATE,
    probabilidade   SMALLINT DEFAULT 50 CHECK (probabilidade BETWEEN 0 AND 100),
    responsavel     VARCHAR(120),
    responsavel_id  UUID REFERENCES usuarios(id),
    investimento    NUMERIC(18,2) DEFAULT 0,
    leads           INT DEFAULT 0,
    flagged         BOOLEAN DEFAULT FALSE,

    -- Qualificação BANT
    budget_ok       BOOLEAN DEFAULT FALSE,
    authority_ok    BOOLEAN DEFAULT FALSE,
    need_ok         BOOLEAN DEFAULT FALSE,
    timeline_ok     BOOLEAN DEFAULT FALSE,

    -- Scores IA
    score_ia        SMALLINT DEFAULT 0 CHECK (score_ia BETWEEN 0 AND 100),
    risco_ia        VARCHAR(20) DEFAULT 'médio' CHECK (risco_ia IN ('baixo','médio','alto','crítico')),
    prox_acao_ia    TEXT,

    -- Sinais de compra (JSONB)
    sinais          JSONB DEFAULT '{}',

    -- Contrato
    contrato        JSONB DEFAULT '{}',

    -- Projeto
    projeto         JSONB,

    lost_motivo     TEXT,
    created_by      UUID REFERENCES usuarios(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_negocios_empresa ON negocios(empresa_id);
CREATE INDEX idx_negocios_fase ON negocios(fase);
CREATE INDEX idx_negocios_responsavel ON negocios(responsavel_id);
CREATE INDEX idx_negocios_score ON negocios(score_ia DESC);

-- ================================================================
-- 4. TAREFAS / ATIVIDADES
-- ================================================================
CREATE TABLE tarefas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo          VARCHAR(300) NOT NULL,
    empresa_nome    VARCHAR(200),
    empresa_id      UUID REFERENCES empresas(id) ON DELETE SET NULL,
    negocio_nome    VARCHAR(200),
    negocio_id      UUID REFERENCES negocios(id) ON DELETE SET NULL,
    tipo            VARCHAR(50) DEFAULT 'Tarefa'
                    CHECK (tipo IN ('Tarefa','Email','WhatsApp','Ligacao','Teams','Reunião')),
    prazo           DATE,
    responsavel     VARCHAR(120),
    responsavel_id  UUID REFERENCES usuarios(id),
    status          VARCHAR(30) DEFAULT 'Pendente'
                    CHECK (status IN ('Pendente','Concluída','Vencida','Cancelada')),
    prioridade      VARCHAR(20) DEFAULT 'Media'
                    CHECK (prioridade IN ('Alta','Media','Baixa')),
    descricao       TEXT,
    resultado       TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tarefas_negocio ON tarefas(negocio_id);
CREATE INDEX idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_prazo ON tarefas(prazo);

-- ================================================================
-- 5. ORÇAMENTOS
-- ================================================================
CREATE TABLE orcamentos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultor       VARCHAR(120),
    consultor_id    UUID REFERENCES usuarios(id),
    categoria       VARCHAR(100),
    descricao       TEXT,
    orcamento       NUMERIC(18,2) DEFAULT 0,
    gasto           NUMERIC(18,2) DEFAULT 0,
    periodo         DATE,
    status          VARCHAR(30) DEFAULT 'Ativo'
                    CHECK (status IN ('Ativo','Encerrado','Pendente')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 6. ITENS TI (ESTOQUE)
-- ================================================================
CREATE TABLE ti_itens (
    id              VARCHAR(20) PRIMARY KEY,
    tipo            VARCHAR(30) NOT NULL CHECK (tipo IN ('Equipamento','Licenca','Acessorio')),
    nome            VARCHAR(200) NOT NULL,
    modelo          VARCHAR(200),
    serial          VARCHAR(100),
    fornecedor      VARCHAR(150),
    custo_unit      NUMERIC(12,2) DEFAULT 0,
    qtd_estoque     INT DEFAULT 0,
    qtd_min         INT DEFAULT 1,
    status          VARCHAR(30) DEFAULT 'Disponivel'
                    CHECK (status IN ('Disponivel','Reservado','Vendido','Manutencao','Baixado')),
    data_entrada    DATE,
    obs             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 7. MOVIMENTAÇÕES TI
-- ================================================================
CREATE TABLE ti_movimentacoes (
    id              VARCHAR(20) PRIMARY KEY,
    data_mov        DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo            VARCHAR(30) NOT NULL
                    CHECK (tipo IN ('Compra','Venda','Transferencia','Devolucao','Baixa','Ajuste')),
    item_id         VARCHAR(20) REFERENCES ti_itens(id),
    item_nome       VARCHAR(200),
    qtd             INT NOT NULL DEFAULT 1,
    custo           NUMERIC(12,2) DEFAULT 0,
    usuario         VARCHAR(120),
    usuario_id      UUID REFERENCES usuarios(id),
    obs             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 8. VENDAS TI
-- ================================================================
CREATE TABLE ti_vendas (
    id              VARCHAR(20) PRIMARY KEY,
    cliente         VARCHAR(200),
    data_venda      DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(30) DEFAULT 'Rascunho'
                    CHECK (status IN ('Rascunho','Confirmada','Faturada','Cancelada')),
    responsavel     VARCHAR(120),
    responsavel_id  UUID REFERENCES usuarios(id),
    obs             TEXT,
    itens           JSONB NOT NULL DEFAULT '[]',
    despesas_adicionais NUMERIC(12,2) DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 9. OKR — EVENTOS TIC
-- ================================================================
CREATE TABLE okr_dados (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes             VARCHAR(10) NOT NULL,
    mes_idx         SMALLINT NOT NULL CHECK (mes_idx BETWEEN 0 AND 11),
    ano             SMALLINT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::SMALLINT,
    eventos         NUMERIC(8,1) DEFAULT 0,
    leads           NUMERIC(8,1) DEFAULT 0,
    mqls            NUMERIC(8,1) DEFAULT 0,
    sqls            NUMERIC(8,1) DEFAULT 0,
    presencial      NUMERIC(8,1) DEFAULT 0,
    online          NUMERIC(8,1) DEFAULT 0,
    custo           NUMERIC(14,2) DEFAULT 0,
    clientes        NUMERIC(8,1) DEFAULT 0,
    ltv             NUMERIC(14,2) DEFAULT 0,
    saved           BOOLEAN DEFAULT FALSE,
    updated_by      UUID REFERENCES usuarios(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (mes_idx, ano)
);

-- ================================================================
-- 10. MENSAGENS (WhatsApp / Teams / Email)
-- ================================================================
CREATE TABLE mensagens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canal           VARCHAR(30) NOT NULL CHECK (canal IN ('whatsapp','email','teams','linkedin','slack')),
    direcao         VARCHAR(10) NOT NULL CHECK (direcao IN ('entrada','saida','sistema')),
    contato_nome    VARCHAR(120),
    contato_tel     VARCHAR(50),
    empresa_nome    VARCHAR(200),
    negocio_id      UUID REFERENCES negocios(id) ON DELETE SET NULL,
    assunto         TEXT,
    corpo           TEXT NOT NULL,
    status          VARCHAR(30) DEFAULT 'enviado'
                    CHECK (status IN ('fila','enviado','entregue','lido','respondido','falhou')),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    agente_id       VARCHAR(50),
    external_id     TEXT,
    lido            BOOLEAN DEFAULT FALSE,
    enviado_em      TIMESTAMPTZ,
    lido_em         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mensagens_canal ON mensagens(canal);
CREATE INDEX idx_mensagens_negocio ON mensagens(negocio_id);

-- ================================================================
-- 11. AGENTES IA — REGISTRO E EXECUÇÕES
-- ================================================================
CREATE TABLE ai_agentes (
    id              VARCHAR(50) PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    tipo            VARCHAR(50) NOT NULL,
    icone           VARCHAR(10),
    cor             VARCHAR(20),
    grupo           VARCHAR(50),
    system_prompt   TEXT,
    modelo          VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
    temperatura     NUMERIC(3,2) DEFAULT 0.3,
    ativo           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_execucoes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agente_id       VARCHAR(50) REFERENCES ai_agentes(id),
    negocio_id      UUID REFERENCES negocios(id) ON DELETE SET NULL,
    empresa_id      UUID REFERENCES empresas(id) ON DELETE SET NULL,
    gatilho         VARCHAR(100),
    tarefa          TEXT,
    status          VARCHAR(20) DEFAULT 'sucesso'
                    CHECK (status IN ('rodando','sucesso','falhou','pulado')),
    progresso       SMALLINT DEFAULT 100,
    tokens_usados   INT,
    custo_usd       NUMERIC(10,6),
    duracao_ms      INT,
    output          JSONB,
    erro            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_execucoes_agente ON ai_execucoes(agente_id);
CREATE INDEX idx_execucoes_data ON ai_execucoes(created_at DESC);

-- ================================================================
-- 12. PIPELINE SNAPSHOTS (histórico diário)
-- ================================================================
CREATE TABLE pipeline_snapshots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_snap       DATE NOT NULL DEFAULT CURRENT_DATE,
    fase            VARCHAR(100) NOT NULL,
    qtd_deals       INT DEFAULT 0,
    valor_total     NUMERIC(18,2) DEFAULT 0,
    score_medio     NUMERIC(5,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (data_snap, fase)
);

-- ================================================================
-- 13. AUDITORIA
-- ================================================================
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  UUID REFERENCES usuarios(id),
    acao        VARCHAR(50) NOT NULL,
    entidade    VARCHAR(100) NOT NULL,
    entidade_id TEXT,
    dados_antes JSONB,
    dados_depois JSONB,
    ip          INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_log_2025 PARTITION OF audit_log
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE audit_log_2026 PARTITION OF audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE audit_log_2027 PARTITION OF audit_log
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE INDEX idx_audit_entidade ON audit_log(entidade, entidade_id);
CREATE INDEX idx_audit_usuario  ON audit_log(usuario_id, created_at DESC);

-- ================================================================
-- FUNÇÕES UTILITÁRIAS
-- ================================================================

-- Auto-updated_at trigger
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$ DECLARE t TEXT; BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'unifique' AND column_name = 'updated_at'
  LOOP
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON unifique.%I
      FOR EACH ROW EXECUTE FUNCTION unifique.fn_updated_at()', t);
  END LOOP;
END $$;

-- Calcula score deal
CREATE OR REPLACE FUNCTION fn_score_deal(p_id UUID)
RETURNS SMALLINT LANGUAGE plpgsql AS $$
DECLARE v INT := 0; n negocios%ROWTYPE; atividade_dias INT;
BEGIN
  SELECT * INTO n FROM negocios WHERE id = p_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  -- BANT (40 pts)
  IF n.budget_ok    THEN v := v + 10; END IF;
  IF n.authority_ok THEN v := v + 10; END IF;
  IF n.need_ok      THEN v := v + 10; END IF;
  IF n.timeline_ok  THEN v := v + 10; END IF;
  -- Probabilidade (30 pts)
  v := v + ROUND(n.probabilidade * 0.3);
  -- Valor (20 pts)
  IF n.valor >= 500000 THEN v := v + 20;
  ELSIF n.valor >= 100000 THEN v := v + 12;
  ELSIF n.valor >= 30000 THEN v := v + 6; END IF;
  -- Atividade recente (10 pts)
  SELECT EXTRACT(DAY FROM NOW() - MAX(created_at)) INTO atividade_dias
  FROM tarefas WHERE negocio_id = p_id;
  IF atividade_dias IS NULL OR atividade_dias > 14 THEN v := v + 0;
  ELSIF atividade_dias <= 3 THEN v := v + 10;
  ELSE v := v + GREATEST(10 - atividade_dias, 0); END IF;
  RETURN LEAST(v, 100)::SMALLINT;
END; $$;

-- Snapshot pipeline
CREATE OR REPLACE FUNCTION fn_snapshot_pipeline()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO pipeline_snapshots (data_snap, fase, qtd_deals, valor_total, score_medio)
  SELECT CURRENT_DATE, fase, COUNT(*), SUM(valor), AVG(score_ia)
  FROM negocios GROUP BY fase
  ON CONFLICT (data_snap, fase) DO UPDATE SET
    qtd_deals = EXCLUDED.qtd_deals,
    valor_total = EXCLUDED.valor_total,
    score_medio = EXCLUDED.score_medio;
END; $$;

-- ================================================================
-- VIEWS ANALÍTICAS
-- ================================================================
CREATE OR REPLACE VIEW vw_pipeline AS
SELECT fase, COUNT(*) deals, SUM(valor) valor_total,
       AVG(score_ia) score_medio,
       SUM(valor * probabilidade / 100) valor_ponderado
FROM negocios GROUP BY fase;

CREATE OR REPLACE VIEW vw_curva_abc AS
SELECT e.id, e.nome, e.faturamento,
       SUM(e.faturamento) OVER (ORDER BY e.faturamento DESC) acumulado,
       SUM(e.faturamento) OVER () total,
       CASE WHEN SUM(e.faturamento) OVER (ORDER BY e.faturamento DESC) /
                 NULLIF(SUM(e.faturamento) OVER (), 0) <= 0.8 THEN 'A'
            WHEN SUM(e.faturamento) OVER (ORDER BY e.faturamento DESC) /
                 NULLIF(SUM(e.faturamento) OVER (), 0) <= 0.95 THEN 'B'
            ELSE 'C' END curva
FROM empresas e WHERE e.faturamento > 0;

CREATE OR REPLACE VIEW vw_forecast AS
SELECT u.nome consultor,
       COUNT(n.id) total_deals,
       SUM(n.valor) pipeline_bruto,
       SUM(n.valor * n.probabilidade / 100) forecast_ponderado,
       AVG(n.score_ia) score_medio
FROM usuarios u LEFT JOIN negocios n ON n.responsavel_id = u.id
WHERE u.ativo = TRUE GROUP BY u.id, u.nome;

CREATE OR REPLACE VIEW vw_agentes_performance AS
SELECT a.nome, a.grupo, a.tipo,
       COUNT(e.id) total_execucoes,
       COUNT(e.id) FILTER (WHERE e.status = 'sucesso') sucessos,
       ROUND(COUNT(e.id) FILTER (WHERE e.status = 'sucesso')::NUMERIC /
             NULLIF(COUNT(e.id), 0) * 100, 1) taxa_sucesso,
       AVG(e.duracao_ms)::INT avg_duracao_ms,
       SUM(e.custo_usd) custo_total_usd
FROM ai_agentes a LEFT JOIN ai_execucoes e ON e.agente_id = a.id
WHERE a.ativo = TRUE GROUP BY a.id, a.nome, a.grupo, a.tipo;

-- ================================================================
-- SEED DATA — AGENTES IA
-- ================================================================
INSERT INTO ai_agentes (id, nome, tipo, icone, cor, grupo, system_prompt) VALUES
('sdr',      'SDR-AI Outbound',      'prospecting', '📡', '#0057B8', 'Prospecção',
 'Especialista em prospecção B2B. Gere sequências personalizadas por persona, pesquise decisores e crie mensagens de abertura relevantes. Nunca invente dados.'),
('icp',      'ICP Scorer AI',        'qualification','⬡',  '#7C3AED', 'Triagem',
 'Avalie o fit de leads com base em indústria, porte, cargo e comportamento. Gere score 0-100 com justificativa clara.'),
('bant',     'BANT Qualifier AI',    'qualification','🔍', '#1D9E75', 'Qualificação',
 'Conduza qualificação via WhatsApp/email com framework BANT. Faça perguntas abertas e registre resultados no CRM.'),
('routing',  'Routing AI',           'routing',      '↗',  '#D97706', 'Roteamento',
 'Analise fit, carga de trabalho e experiência dos consultores para atribuir oportunidades de forma otimizada.'),
('health',   'Deal Health AI',       'pipeline',     '💓', '#DC2626', 'Pipeline',
 'Monitore deals continuamente. Calcule health score, identifique estagnação e sugira próxima ação ao responsável.'),
('forecast', 'Forecast AI',          'analytics',    '📈', '#0D9488', 'Previsão',
 'Agregue dados CRM e histórico para gerar forecast rolling. Simule cenários e prepare resumos competitivos.'),
('proposal', 'Proposal AI',          'proposal',     '📋', '#3A5A80', 'Fechamento',
 'Gere propostas personalizadas por perfil de decisor (CFO/CTO/CEO) com ROI calculado e cases relevantes.'),
('comms',    'Comms AI',             'communications','📨','#128C7E', 'Follow-up',
 'Gerencie follow-ups por email e WhatsApp. Analise comportamento do lead e adapte o próximo contato.')
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SEED DATA — USUÁRIOS
-- ================================================================
INSERT INTO usuarios (nome, email, perfil, avatar, cargo) VALUES
('Tadeu Alves',  'tadeu.alves@redeunifique.com.br',  'admin',     'TA', 'Administrador · Rede Unifique'),
('Maria Souza',  'maria.souza@redeunifique.com.br',  'gerente',   'MS', 'Gerente Comercial'),
('João Silva',   'joao.silva@redeunifique.com.br',   'consultor', 'JS', 'Consultor Senior'),
('Ana Paula',    'ana.paula@redeunifique.com.br',    'consultor', 'AP', 'Consultor Pleno'),
('Carlos Lima',  'carlos.lima@redeunifique.com.br',  'preVenda',  'CL', 'Pré Venda')
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- SEED DATA — EMPRESAS
-- ================================================================
INSERT INTO empresas (nome, segmento, porte, funcionarios, faturamento, cidade, contato, email, tel, status, funil, consultor_nome) VALUES
('GrupoMax',        'Indústria',    'Grande', 1800, 4200000, 'São Paulo',    'Roberto Alves', 'roberto@grupomax.com',   '(11) 9 9999-0001', 'Ativo',      'Comercial B2B', 'Maria Souza'),
('Retail Group SA', 'Varejo',       'Grande', 1200, 2800000, 'Campinas',     'Maria Souza',   'maria@retailgroup.com',  '(19) 9 9888-0002', 'Ativo',      'Varejo',        'João Silva'),
('TechSolutions',   'Tecnologia',   'Médio',   250, 1200000, 'São Paulo',    'João Silva',    'joao@techsolutions.com', '(11) 9 9777-0003', 'Ativo',      'SaaS',          'João Silva'),
('Distribuidora RS','Distribuição', 'Médio',   320,  680000, 'Porto Alegre', 'Ana Paula',     'ana@distribrs.com',      '(51) 9 9666-0004', 'Negociando', 'Comercial B2B', 'Ana Paula'),
('Startup XYZ',     'Fintech',      'Pequeno',  40,   95000, 'Rio de Janeiro','Carlos Lima',  'carlos@startupxyz.com',  '(21) 9 9333-0007', 'Lead',       'SaaS',          'Carlos Lima')
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED DATA — NEGÓCIOS
-- ================================================================
INSERT INTO negocios (nome, empresa_nome, curva, valor, fase, funil, probabilidade, responsavel, score_ia, sinais, budget_ok, authority_ok, need_ok, timeline_ok) VALUES
('Implantação CRM',   'GrupoMax',        'A', 320000, 'Fechamento',  'Comercial B2B', 95, 'Maria Souza', 88,
 '{"urgencia":true,"prazo_curto":true,"orcamento":true,"decisor":true,"resposta_rapida":true,"proposta":true}', true, true, true, true),
('Licença Enterprise','Retail Group SA', 'A', 230000, 'Negociação',  'Comercial B2B', 65, 'João Silva',  72,
 '{"orcamento":true,"decisor":true,"resposta_rapida":true,"proposta":true,"reuniao":true}', true, true, false, false),
('Pedido Q2',         'Distribuidora RS','B',  78000, 'Fechamento',  'Varejo',        90, 'Ana Paula',   81,
 '{"urgencia":true,"prazo_curto":true,"proposta":true}', true, false, true, true),
('Plano SaaS Pro',    'TechSolutions',   'B',  85000, 'Demo',        'SaaS',          50, 'Carlos Lima', 55,
 '{"resposta_rapida":true,"reuniao":true,"demo":true}', false, false, true, false)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED DATA — TAREFAS
-- ================================================================
INSERT INTO tarefas (titulo, empresa_nome, negocio_nome, tipo, prazo, responsavel, status, prioridade) VALUES
('Enviar proposta revisada', 'GrupoMax',        'Implantação CRM',   'Tarefa', CURRENT_DATE + 2,  'Maria Souza', 'Pendente',  'Alta'),
('Follow-up sem resposta',   'Retail Group SA', 'Licença Enterprise','Email',  CURRENT_DATE - 1,  'João Silva',  'Vencida',   'Alta'),
('Agendar demo',             'Startup XYZ',     'Plano SaaS',        'Teams',  CURRENT_DATE + 7,  'Carlos Lima', 'Pendente',  'Media')
ON CONFLICT DO NOTHING;

-- ================================================================
-- SEED DATA — ITENS TI
-- ================================================================
INSERT INTO ti_itens (id, tipo, nome, modelo, serial, fornecedor, custo_unit, qtd_estoque, qtd_min, status, data_entrada) VALUES
('IT001','Equipamento','Notebook Dell Latitude 5540','Latitude 5540','DL001','Dell Brasil',    6800, 5, 2,'Disponivel','2024-01-10'),
('IT002','Equipamento','Notebook Lenovo ThinkPad E14','ThinkPad E14','LN002','Lenovo Brasil',  5500, 3, 1,'Disponivel','2024-03-01'),
('IT003','Licenca',    'Microsoft 365 Business Premium','M365 Premium','M365-KEY','Microsoft', 230, 80,10,'Disponivel','2024-01-01'),
('IT004','Licenca',    'Adobe Creative Cloud All Apps','CC All Apps','ADOBE-KEY','Adobe',      480, 10, 3,'Disponivel','2025-01-01'),
('IT005','Equipamento','Headset Jabra Evolve2 55','Evolve2 55','JB005','Jabra',                1800, 8, 2,'Disponivel','2024-02-01'),
('IT006','Licenca',    'Kaspersky Endpoint Security','KES Cloud','KAV-KEY','Kaspersky',          50, 0, 5,'Disponivel','2024-04-01')
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SEED DATA — OKR
-- ================================================================
INSERT INTO okr_dados (mes, mes_idx, ano, eventos, leads, mqls, sqls, custo) VALUES
('Jan', 0, 2025, 1, 22, 7, 1, 8500),
('Fev', 1, 2025, 1, 28, 8, 2, 9200),
('Mar', 2, 2025, 2, 35, 11, 3, 14000),
('Abr', 3, 2025, 1, 30, 9, 2, 11000)
ON CONFLICT (mes_idx, ano) DO NOTHING;

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE negocios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Admin e gerente vêem tudo
CREATE POLICY pol_negocios_admin ON negocios
  USING (current_setting('app.perfil', TRUE) IN ('admin','gerente'));
CREATE POLICY pol_negocios_consultor ON negocios
  USING (responsavel = current_setting('app.usuario', TRUE));

CREATE POLICY pol_tarefas_admin ON tarefas
  USING (current_setting('app.perfil', TRUE) IN ('admin','gerente'));
CREATE POLICY pol_tarefas_consultor ON tarefas
  USING (responsavel = current_setting('app.usuario', TRUE));

-- ================================================================
-- ÍNDICES ADICIONAIS DE PERFORMANCE
-- ================================================================
CREATE INDEX idx_negocios_created ON negocios(created_at DESC);
CREATE INDEX idx_execucoes_negocio ON ai_execucoes(negocio_id);
CREATE INDEX idx_mensagens_created ON mensagens(created_at DESC);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- Vacuum inicial
ANALYZE;

-- ================================================================
-- FIM DO SCHEMA
-- Versão: 2.0 | unifique.com.br
-- ================================================================
