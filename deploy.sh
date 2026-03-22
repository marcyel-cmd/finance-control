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
NGINX_STATIC="/var/www/preve/frontend"   # ajuste conforme seu nginx

# ── 1. Git pull ──────────────────────────────────────────────
log "Atualizando código via git pull..."
cd "$REPO_DIR"
git pull origin "$(git rev-parse --abbrev-ref HEAD)"

# ── 2. Backend: dependências ─────────────────────────────────
log "Instalando dependências do backend..."
cd "$BACKEND_DIR"
npm ci --omit=dev
# Gerar cliente Prisma após install
npx prisma generate

# ── 3. Backend: build TypeScript ─────────────────────────────
log "Compilando TypeScript do backend..."
npm run build

# ── 4. Banco de dados: migrations ────────────────────────────
log "Executando migrations do PostgreSQL..."
npx prisma migrate deploy

# ── 5. Frontend: dependências ────────────────────────────────
log "Instalando dependências do frontend..."
cd "$FRONTEND_DIR"
npm ci

# ── 6. Frontend: build Vite ──────────────────────────────────
log "Compilando frontend com Vite..."
npm run build

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

log "✅ Deploy concluído com sucesso!"
echo ""
echo "  Backend  → http://localhost:3333/api/v1/health"
echo "  Frontend → $NGINX_STATIC"
