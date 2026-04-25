#!/usr/bin/env bash
# =============================================================
# deploy.sh — PrevÊ Finance Control
# Deploy completo para VPS: pull → deps → build → migrate → pm2
# =============================================================

set -euo pipefail

# ── Cores para output ────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[aviso]${NC}  $*"; }
fail() { echo -e "${RED}[erro]${NC}   $*"; exit 1; }

# ── Configurações ────────────────────────────────────────────
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"
NGINX_STATIC="/var/www/preve/frontend"   # Nginx root deve apontar para este diretório
HEALTH_URL="${HEALTH_URL:-http://localhost:3333/api/v1/users/health}"

# ── 1. Git pull ──────────────────────────────────────────────
log "Atualizando código via git pull..."
cd "$REPO_DIR"
git pull origin "$(git rev-parse --abbrev-ref HEAD)"

# ── 2. Backend: dependências ─────────────────────────────────
log "Instalando dependências do backend (incluindo devDeps para build)..."
cd "$BACKEND_DIR"
npm ci
# Gerar cliente Prisma após install
npx prisma generate

# ── 3. Backend: build TypeScript ─────────────────────────────
log "Compilando TypeScript do backend..."
npm run build

# ── 4. Frontend: dependências ────────────────────────────────
log "Instalando dependências do frontend..."
cd "$FRONTEND_DIR"
npm ci

# ── 5. Frontend: build Vite ──────────────────────────────────
log "Compilando frontend com Vite..."
npm run build

# ── 6. Banco de dados: migrations + sync de schema ───────────
# Executado APÓS builds para possibilitar rollback rápido.
#
# `migrate deploy` aplica migrations versionadas (cycles 1-9 do QA).
# `db push` aplica modelos adicionados depois disso via prisma db push em dev
# (RecurringTemplate, TransactionTemplate, PushSubscription, recurring_template_id
# em transactions). É idempotente — se o banco já tem, não faz nada.
# Quando estabilizarmos o schema, consolidar tudo numa migration formal.
log "Executando migrations do PostgreSQL..."
cd "$BACKEND_DIR"
npx prisma migrate deploy
log "Sincronizando schema (db push) para modelos sem migration formal..."
npx prisma db push --accept-data-loss=false --skip-generate

# ── 7. Copiar frontend para pasta do Nginx ───────────────────
log "Copiando build do frontend para $NGINX_STATIC..."
mkdir -p "$NGINX_STATIC"
cp -r "$FRONTEND_DIR/dist/." "$NGINX_STATIC/"

# ── 8. PM2: reiniciar/iniciar o backend ──────────────────────
log "Reiniciando o backend via PM2..."
cd "$BACKEND_DIR"
if pm2 list | grep -q "finance-backend"; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save

# ── 9. Health check ──────────────────────────────────────────
log "Aguardando backend inicializar..."
sleep 4

MAX_RETRIES=10
RETRY=0
OK=false

while [ $RETRY -lt $MAX_RETRIES ]; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    OK=true
    break
  fi
  RETRY=$((RETRY + 1))
  warn "Health check falhou (status: $HTTP_STATUS) — tentativa $RETRY/$MAX_RETRIES..."
  sleep 3
done

if [ "$OK" = "false" ]; then
  fail "Backend não respondeu ao health check em $HEALTH_URL após $MAX_RETRIES tentativas. Verifique os logs: pm2 logs finance-backend"
fi

log "✅ Deploy concluído com sucesso! Backend saudável em $HEALTH_URL"
echo ""
echo "  Backend  → $HEALTH_URL"
echo "  Frontend → $NGINX_STATIC"
