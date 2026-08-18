-- ================================================================
-- 014 — Notificações do sistema
-- Execute no SQL Editor do Supabase
-- ================================================================

CREATE TABLE IF NOT EXISTS notificacoes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo     VARCHAR(200) NOT NULL,
  mensagem   TEXT        NOT NULL,
  tipo       VARCHAR(30) NOT NULL DEFAULT 'info',  -- info | novidade | alerta | manutencao
  autor      VARCHAR(100),
  ativo      BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all ON notificacoes;
CREATE POLICY anon_all ON notificacoes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Seed: notificação de boas-vindas
INSERT INTO notificacoes (titulo, mensagem, tipo, autor)
VALUES (
  'Bem-vindo à Unifique Plataforma TIC',
  'O sistema está disponível com novos módulos: Base de Conhecimento (IA), Empresas, Pipeline e Relatórios. Explore as novidades no menu lateral.',
  'novidade',
  'Equipe Unifique'
);

NOTIFY pgrst, 'reload schema';
