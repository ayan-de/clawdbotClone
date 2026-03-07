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
fi

echo ""
echo -e "${YELLOW}To start the Desktop TUI, you need to authorize it:${NC}"
echo "1. Go to https://ayande.xyz/settings/desktop"
echo "2. Authorize and copy your Orbit Token"
echo ""
read -p "Paste your Orbit Token: " orbit_token

if [ -n "$orbit_token" ]; then
    log_info "Starting Desktop TUI..."
    cd "$INSTALL_DIR/desktop" && ./start_desktop.sh --token "$orbit_token"
else
    log_warn "Manual start: cd $INSTALL_DIR/desktop && ./start_desktop.sh --token <TOKEN>"
fi

log_success "Orbit AI v2.0 installation complete!"
rm -f *.tar.gz
