#!/usr/bin/env bash
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── Helper functions ─────────────────────────────────────────────────────────
info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

# ─── ASCII Art Banner ─────────────────────────────────────────────────────────
echo -e "${MAGENTA}${BOLD}"
cat << 'BANNER'
    _    ___    ____                         _                _
   / \  |_ _|  / ___| __ _ _ __ ___   ___  / \   ___ ___  ___| |_
  / _ \  | |  | |  _ / _` | '_ ` _ \ / _ \/ _ \ / __/ __|/ _ \ __|
 / ___ \ | |  | |_| | (_| | | | | | |  __/ ___ \\__ \__ \  __/ |_
/_/   \_\___|  \____|\__,_|_| |_| |_|\___/_/   \_\___/___/\___|\__|

  ____                           _
 / ___| ___ _ __   ___ _ __ __ _| |_ ___  _ __
| |  _ / _ \ '_ \ / _ \ '__/ _` | __/ _ \| '__|
| |_| |  __/ | | |  __/ | | (_| | || (_) | |
 \____|\___|_| |_|\___|_|  \__,_|\__\___/|_|
BANNER
echo -e "${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Full-Stack Dev Environment Launcher${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ─── Resolve project root ────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"
info "Project root: ${BOLD}$PROJECT_ROOT${NC}"

# ─── Load .env ────────────────────────────────────────────────────────────────
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/.env"
    set +a
    success "Loaded .env from project root"
else
    warn "No .env file found at project root — continuing with existing environment"
fi

# ─── Kill processes on ports 3001 and 5173 ────────────────────────────────────
kill_port() {
    local port=$1
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        success "Killed existing process(es) on port $port"
    else
        info "Port $port is free"
    fi
}

info "Cleaning up ports..."
kill_port 3001
kill_port 5173

# ─── Check PostgreSQL ─────────────────────────────────────────────────────────
info "Checking PostgreSQL..."
if brew services list 2>/dev/null | grep -q "postgresql.*started"; then
    success "PostgreSQL is already running"
else
    # Try both postgresql and postgresql@<version> service names
    PG_SERVICE=$(brew services list 2>/dev/null | grep -oE 'postgresql(@[0-9]+)?' | head -n1 || true)
    if [ -z "$PG_SERVICE" ]; then
        PG_SERVICE="postgresql"
    fi
    warn "PostgreSQL is not running — starting via brew services..."
    brew services start "$PG_SERVICE" || fail "Could not start PostgreSQL. Is it installed? (brew install postgresql)"
    # Give it a moment to accept connections
    sleep 2
    success "PostgreSQL started ($PG_SERVICE)"
fi

# ─── Create database if it doesn't exist ──────────────────────────────────────
info "Ensuring database 'ai_game_assets' exists..."
createdb ai_game_assets 2>/dev/null && success "Database 'ai_game_assets' created" \
    || success "Database 'ai_game_assets' already exists"

# ─── Install npm dependencies ─────────────────────────────────────────────────
info "Installing backend dependencies..."
if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
    (cd "$PROJECT_ROOT/backend" && npm install --no-fund --no-audit) \
        || fail "Backend npm install failed"
    success "Backend dependencies installed"
else
    fail "backend/package.json not found"
fi

info "Installing frontend dependencies..."
if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
    (cd "$PROJECT_ROOT/frontend" && npm install --no-fund --no-audit) \
        || fail "Frontend npm install failed"
    success "Frontend dependencies installed"
else
    fail "frontend/package.json not found"
fi

# ─── Run seed script ──────────────────────────────────────────────────────────
info "Running database seed script..."
if [ -f "$PROJECT_ROOT/backend/seed.js" ]; then
    (cd "$PROJECT_ROOT/backend" && node seed.js) \
        || fail "Seed script failed"
    success "Database seeded"
else
    warn "backend/seed.js not found — skipping seed"
fi

# ─── Trap for clean shutdown ──────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    warn "Shutting down..."
    [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && info "Backend stopped"
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && info "Frontend stopped"
    # Clean up any stragglers on the ports
    kill_port 3001
    kill_port 5173
    success "All processes terminated. Goodbye!"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ─── Start backend ────────────────────────────────────────────────────────────
info "Starting backend (nodemon) on port 3001..."
(cd "$PROJECT_ROOT/backend" && npx nodemon server.js) &
BACKEND_PID=$!

# ─── Start frontend ──────────────────────────────────────────────────────────
info "Starting frontend (Vite) on port 5173..."
(cd "$PROJECT_ROOT/frontend" && npx vite --port 5173) &
FRONTEND_PID=$!

# ─── Wait for services to be ready ───────────────────────────────────────────
wait_for_port() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if lsof -ti :"$port" >/dev/null 2>&1; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    warn "$name did not start within ${max_attempts}s"
    return 1
}

echo ""
info "Waiting for services to become ready..."
wait_for_port 3001 "Backend"  && success "Backend is ready"
wait_for_port 5173 "Frontend" && success "Frontend is ready"

# ─── Print URLs ───────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  All systems go!${NC}"
echo -e ""
echo -e "  ${BOLD}Frontend${NC}  ${CYAN}http://localhost:5173${NC}"
echo -e "  ${BOLD}Backend${NC}   ${CYAN}http://localhost:3001${NC}"
echo -e "  ${BOLD}Database${NC}  ${CYAN}ai_game_assets${NC}"
echo -e ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop all services."
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ─── Wait for background processes ───────────────────────────────────────────
wait
