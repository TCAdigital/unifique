-- ================================================================
-- Fix: constraints Backoffice TI + coluna categoria em movimentações
-- ================================================================

-- ti_itens: aceitar categorias do app
ALTER TABLE ti_itens DROP CONSTRAINT IF EXISTS ti_itens_tipo_check;
ALTER TABLE ti_itens ADD CONSTRAINT ti_itens_tipo_check
  CHECK (tipo IN ('Hardware','Software','Network','Infraestrutura','Segurança','Cabeamento','Outro'));

-- ti_movimentacoes: aceitar tipos do app
ALTER TABLE ti_movimentacoes DROP CONSTRAINT IF EXISTS ti_movimentacoes_tipo_check;
ALTER TABLE ti_movimentacoes ADD CONSTRAINT ti_movimentacoes_tipo_check
  CHECK (tipo IN ('Entrada','Saída','Transferência'));

-- Adiciona coluna categoria em movimentacoes (não existia)
ALTER TABLE ti_movimentacoes ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'Hardware';

NOTIFY pgrst, 'reload schema';
