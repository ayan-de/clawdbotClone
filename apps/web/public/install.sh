#!/bin/bash

################################################################################
# Orbit AI - Production Installer v2.0.0 (Prebuilt Release)
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

display_logo() {
    echo -e "${CYAN}"
    cat << 'EOF'
 ██████╗ ██████╗ ██████╗ ██╗████████╗
██╔═══██╗██╔══██╗██╔══██╗██║╚══██╔══╝
██║   ██║██████╔╝██████╔╝██║   ██║   
██║   ██║██╔══██╗██╔══██╗██║   ██║   
╚██████╔╝██║  ██║██████╔╝██║   ██║   
 ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝   
EOF
    echo -e "${NC}"
}

INSTALL_DIR="$HOME/.orbit"
AGENT_REPO="https://github.com/ayan-de/orbit-agent"
CODE_REPO="https://github.com/ayan-de/clawdbotClone"

# Detect OS and Arch
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [[ "$PLATFORM" == "linux" ]]; then
    if grep -q "Microsoft" /proc/version 2>/dev/null; then
        PLATFORM="windows-wsl"
    fi
elif [[ "$PLATFORM" == "darwin" ]]; then
    PLATFORM="macos"
fi

case "$ARCH" in
    x86_64|amd64) ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) log_error "Unsupported architecture: $ARCH"; exit 1 ;;
esac

log_info "Detected platform: $PLATFORM ($ARCH)"

# Clear and show logo
clear
display_logo

# Setup directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/agent"
mkdir -p "$INSTALL_DIR/bridge"
mkdir -p "$INSTALL_DIR/desktop"
cd "$INSTALL_DIR"

# Helper to download latest release asset
download_latest() {
    local repo=$1
    local pattern=$2
    local output=$3
    
    log_info "Fetching latest release from $repo..."
    local release_url=$(curl -s "https://api.github.com/repos/${repo#https://github.com/}/releases/latest" | grep -Po "\"browser_download_url\": \"\K[^\"]*$pattern[^\"]*\"" | head -1 | tr -d '"')
    
    if [ -z "$release_url" ]; then
        log_error "Could not find asset matching $pattern in $repo"
        exit 1
    fi
    
    log_info "Downloading from $release_url..."
    curl -L -f "$release_url" -o "$output"
}

# 1. Download Agent
download_latest "$AGENT_REPO" "orbit-agent.*$PLATFORM-$ARCH" "agent.tar.gz"
tar -xzf agent.tar.gz -C agent --strip-components=1

# 2. Download Bridge
download_latest "$CODE_REPO" "bridge-$PLATFORM-$ARCH" "bridge.tar.gz"
tar -xzf bridge.tar.gz -C bridge

# 3. Download Desktop
download_latest "$CODE_REPO" "desktop-$PLATFORM-$ARCH" "desktop.tar.gz"
tar -xzf desktop.tar.gz -C desktop

# 4. Configuration
log_info "Configuring Orbit AI..."

# Generate Secrets
JWT_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')
ENCRYPTION_KEY=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')

# Database Setup
printf "${YELLOW}Database Setup:${NC} Use local PostgreSQL? (y/n) [y]: "
read -r use_local < /dev/tty
use_local=${use_local:-y}

if [[ "$use_local" == "y" ]]; then
    # Check if postgres is running
    if ! pg_isready &>/dev/null; then
        log_warn "PostgreSQL is not running."
        printf "Attempt to start postgresql service? (y/n) [y]: "
        read -r start_pg < /dev/tty
        start_pg=${start_pg:-y}
        if [[ "$start_pg" == "y" ]]; then
            sudo systemctl start postgresql || sudo service postgresql start || log_error "Failed to start postgresql. Please start it manually."
        fi
    fi

    # Database details
    DB_USER="postgres"
    DB_PASS="postgres"
    DB_HOST="localhost"
    BRIDGE_DB="orbit_bridge"
    AGENT_DB="orbit_agent"

    log_info "Ensuring databases exist..."
    if command -v psql &>/dev/null; then
        # Try creating as current user, then with sudo -u postgres
        psql -U "$DB_USER" -c "CREATE DATABASE $BRIDGE_DB;" 2>/dev/null || \
        sudo -u postgres psql -c "CREATE DATABASE $BRIDGE_DB;" 2>/dev/null || true
        
        psql -U "$DB_USER" -c "CREATE DATABASE $AGENT_DB;" 2>/dev/null || \
        sudo -u postgres psql -c "CREATE DATABASE $AGENT_DB;" 2>/dev/null || true
    fi
    
    BRIDGE_DB_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:5432/$BRIDGE_DB"
    AGENT_DB_URL="postgresql+asyncpg://$DB_USER:$DB_PASS@$DB_HOST:5432/$AGENT_DB"
else
    printf "Enter your Bridge PostgreSQL URL: "
    read -r BRIDGE_DB_URL < /dev/tty
    printf "Enter your Agent Async PostgreSQL URL (postgresql+asyncpg://...): "
    read -r AGENT_DB_URL < /dev/tty
fi

# Create Bridge .env
cat > "$INSTALL_DIR/bridge/.env" << EOF
APP_NAME=OrbitBridge
PORT=8443
NODE_ENV=production
FRONTEND_URL=https://ayande.xyz
DATABASE_URL="$BRIDGE_DB_URL"
DB_SYNCHRONIZE=true
DB_SSL=false
JWT_SECRET="$JWT_SECRET"
AGENT_API_URL=http://localhost:8888
EOF

# Create Agent .env
cat > "$INSTALL_DIR/agent/.env" << EOF
PORT=8888
DEBUG=false
DATABASE_URL="$AGENT_DB_URL"
BRIDGE_URL=http://localhost:8443
BRIDGE_API_KEY="$JWT_SECRET"
ENCRYPTION_KEY="$ENCRYPTION_KEY"
FRONTEND_URL=https://ayande.xyz
EOF

log_success "Configuration created"

# Setup PM2
log_info "Setting up PM2 process manager..."
if ! command -v pm2 &>/dev/null; then
    npm install -g pm2 || sudo npm install -g pm2 || true
fi

if command -v pm2 &>/dev/null; then
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: "orbit-agent",
      script: "$INSTALL_DIR/agent/start_agent.sh",
      cwd: "$INSTALL_DIR/agent",
      env: { PORT: 8888 }
    },
    {
      name: "orbit-bridge",
      script: "$INSTALL_DIR/bridge/start_bridge.sh",
      cwd: "$INSTALL_DIR/bridge",
      env: { PORT: 8443, NODE_ENV: "production" }
    }
  ]
};
EOF
    pm2 start ecosystem.config.js
    pm2 save || true
    log_success "Services started via PM2"
    
    log_info "Initializing services (this may take a minute for first-run dependencies)..."
fi
# 5. Launch TUI
echo ""
log_info "Waiting for Orbit Bridge to be ready..."
RETRIES=0
# Bridge might take a moment to start and run migrations
until curl -s http://localhost:8443/health &>/dev/null || [ $RETRIES -eq 60 ]; do
    printf "."
    sleep 2
    RETRIES=$((RETRIES+1))
done
echo ""

if [ $RETRIES -eq 60 ]; then
    log_warn "Bridge server is taking a long time to start. Check 'pm2 logs orbit-bridge'."
fi

echo -e "${YELLOW}To start the Desktop TUI, you need to authorize it:${NC}"
echo "1. Go to https://ayande.xyz/settings/desktop"
echo "2. Authorize and copy your Orbit Token"
echo ""

while true; do
    read -p "Paste your Orbit Token: " orbit_token < /dev/tty
    if [ -n "$orbit_token" ]; then
        log_info "Starting Desktop TUI..."
        cd "$INSTALL_DIR/desktop"
        if command -v pnpm &>/dev/null; then
            pnpm start -- --token "$orbit_token"
        else
            npm start -- --token "$orbit_token"
        fi
        break
    else
        log_warn "Token is required. Please paste your token."
    fi
done

log_success "Orbit AI installation complete!"
rm -f "$INSTALL_DIR"/*.tar.gz
