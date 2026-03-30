-- Migration: Float → Decimal para campos monetários
-- Evita erros de arredondamento em ponto flutuante (IEEE 754)
-- Nota: requer que o usuário do banco seja owner das tabelas.
-- Se necessário, executar como superuser:
--   sudo -u postgres psql -d financecontrol -f migration.sql

-- credit_cards
ALTER TABLE "credit_cards"
  ALTER COLUMN "limit" TYPE DECIMAL(15,2) USING "limit"::DECIMAL(15,2),
  ALTER COLUMN "used"  TYPE DECIMAL(15,2) USING "used"::DECIMAL(15,2);

-- transactions
ALTER TABLE "transactions"
  ALTER COLUMN "value"       TYPE DECIMAL(15,2) USING "value"::DECIMAL(15,2),
  ALTER COLUMN "total_value" TYPE DECIMAL(15,2) USING "total_value"::DECIMAL(15,2);

-- notifications
ALTER TABLE "notifications"
  ALTER COLUMN "related_amount" TYPE DECIMAL(15,2) USING "related_amount"::DECIMAL(15,2);
