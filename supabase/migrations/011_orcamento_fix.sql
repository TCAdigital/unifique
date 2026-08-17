-- ================================================================
-- 011 — Orçamento: garante schema completo (idempotente)
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Garante que o CHECK de status aceita todos os valores usados no app
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_status_check
  CHECK (status IN ('Planejado','Executado','Pendente','Cancelado','Ativo','Encerrado'));

-- Garante que todas as colunas de vínculo existem
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS consultor       VARCHAR(120);
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS consultor_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS empresa_id      UUID REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS empresa_nome    VARCHAR(200);
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS negocio_id      UUID REFERENCES negocios(id) ON DELETE SET NULL;
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS negocio_nome    VARCHAR(200);

-- Política RLS permissiva (caso não exista)
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all ON orcamentos;
CREATE POLICY anon_all ON orcamentos FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
