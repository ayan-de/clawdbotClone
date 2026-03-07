#!/bin/bash

################################################################################
# Orbit AI - Production Install Script v1.0.0
#
# Hosted at: https://ayande.xyz/install.sh
# Usage: curl -fsSL https://ayande.xyz/install.sh | bash
#
# This script installs the complete Orbit AI system:
# - Python Agent (FastAPI + LangGraph)
# - NestJS Bridge (API server with auth)
# - Next.js Web Dashboard
# - Desktop TUI Client
################################################################################

set -euo pipefail  # Exit on error, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

################################################################################
# Display Logo
################################################################################

display_logo() {
    # Try to load logo from local file, or use embedded logo
    local logo_file="$INSTALL_DIR/clawdbotClone/apps/web/public/logo.txt"
    local installer_logo="$INSTALL_DIR/.orbit-installer-logo.txt"

    if [ -f "$logo_file" ]; then
        cat "$logo_file"
    elif [ -f "$installer_logo" ]; then
        cat "$installer_logo"
    else
        # Embedded logo (fallback)
        cat << 'EOF'
 ██████╗ ██████╗ ██████╗ ██╗████████╗
██╔═══██╗██╔══██╗██╔══██╗██║╚══██╔══╝
██║   ██║██████╔╝██████╔╝██║   ██║
██║   ██║██╔══██╗██╔══██╗██║   ██║
╚██████╔╝██║  ██║██████╔╝██║   ██║
 ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝

EOF
    fi
}

################################################################################
# Configuration
################################################################################

INSTALL_DIR="$HOME/.orbit"
AGENT_REPO="https://github.com/ayan-de/orbit-agent.git"
CLAWDBOT_REPO="https://github.com/ayan-de/clawdbotClone.git"

# Ports (using less common ports to avoid conflicts)
# Users can change these in ~/.orbit/.env-ports
AGENT_PORT=8888
BRIDGE_PORT=8443
WEB_PORT=8444
DESKTOP_PORT=8445

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# Check Port Availability and Configure
################################################################################

check_port_available() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

configure_ports() {
    log_info "Configuring ports..."

    # Load existing port configuration if it exists
    PORTS_CONFIG="$INSTALL_DIR/.env-ports"
    if [ -f "$PORTS_CONFIG" ]; then
        source "$PORTS_CONFIG"
        log_info "Loaded existing port configuration"
        return
    fi

    # Check if default ports are available
    PORTS_AVAILABLE=true

    if ! check_port_available $AGENT_PORT; then
        log_warn "Port $AGENT_PORT (Agent) is in use"
        PORTS_AVAILABLE=false
    fi

    if ! check_port_available $BRIDGE_PORT; then
        log_warn "Port $BRIDGE_PORT (Bridge) is in use"
        PORTS_AVAILABLE=false
    fi

    if ! check_port_available $WEB_PORT; then
        log_warn "Port $WEB_PORT (Web) is in use"
        PORTS_AVAILABLE=false
    fi

    if ! check_port_available $DESKTOP_PORT; then
        log_warn "Port $DESKTOP_PORT (Desktop) is in use"
        PORTS_AVAILABLE=false
    fi

    if [ "$PORTS_AVAILABLE" = false ]; then
        echo ""
        log_warn "Some default ports are in use. Would you like to:"
        echo "  1) Use alternative ports (recommended)"
        echo "  2) Use default ports anyway (may cause conflicts)"
        echo ""
        read -p "Choose option [1/2]: " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[1]$ ]]; then
            # Generate alternative ports
            log_info "Generating alternative ports..."

            # Find available ports starting from 8000
            BASE_PORT=8000
            AGENT_PORT=$((BASE_PORT + 888))  # 8888
            BRIDGE_PORT=$((BASE_PORT + 643)) # 8643
            WEB_PORT=$((BASE_PORT + 644))    # 8644
            DESKTOP_PORT=$((BASE_PORT + 645)) # 8645

            # Check again and increment if needed
            while ! check_port_available $AGENT_PORT; do
                AGENT_PORT=$((AGENT_PORT + 1))
            done
            while ! check_port_available $BRIDGE_PORT; do
                BRIDGE_PORT=$((BRIDGE_PORT + 1))
            done
            while ! check_port_available $WEB_PORT; do
                WEB_PORT=$((WEB_PORT + 1))
            done
            while ! check_port_available $DESKTOP_PORT; do
                DESKTOP_PORT=$((DESKTOP_PORT + 1))
            done

            log_success "Using alternative ports:"
            echo "  • Agent:   $AGENT_PORT"
            echo "  • Bridge:  $BRIDGE_PORT"
            echo "  • Web:     $WEB_PORT"
            echo "  • Desktop: $DESKTOP_PORT"
        fi
    else
        log_success "All default ports are available"
    fi

    # Save port configuration
    cat > "$PORTS_CONFIG" << EOF
# Orbit AI Port Configuration
# Generated: $(date)
# You can manually edit these ports if needed

AGENT_PORT=$AGENT_PORT
BRIDGE_PORT=$BRIDGE_PORT
WEB_PORT=$WEB_PORT
DESKTOP_PORT=$DESKTOP_PORT
EOF

    log_success "Port configuration saved to $PORTS_CONFIG"
}

################################################################################
# OS Detection
################################################################################

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ -f /proc/version ]] && grep -q "Microsoft" /proc/version; then
            echo "wsl"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

################################################################################
# Dependency Checks
################################################################################

check_dependencies() {
    log_info "Checking dependencies..."

    local missing_deps=()

    # Check git
    if ! command -v git &>/dev/null; then
        missing_deps+=("git")
    fi

    # Check Python 3.10+
    if ! command -v python3 &>/dev/null; then
        missing_deps+=("python3")
    elif ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 10) else exit(1))" 2>/dev/null; then
        missing_deps+=("python3.10+")
    fi

    # Check Node.js
    if ! command -v node &>/dev/null; then
        missing_deps+=("nodejs")
    fi

    # Check npm
    if ! command -v npm &>/dev/null; then
        missing_deps+=("npm")
    fi

    # Check pnpm (required for monorepo)
    if ! command -v pnpm &>/dev/null; then
        missing_deps+=("pnpm")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        log_info "Please install missing dependencies:"
        echo ""
        if [[ "$OS_TYPE" == "macos" ]]; then
            echo "  brew install git python@3.11 node pnpm"
        elif [[ "$OS_TYPE" == "linux" || "$OS_TYPE" == "wsl" ]]; then
            echo "  # Install Node.js 18+"
            echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "  sudo apt install -y git python3.11 python3.11-venv nodejs"
            echo ""
            echo "  # Install pnpm"
            echo "  npm install -g pnpm"
        fi
        exit 1
    fi

    log_success "All dependencies installed"
}

################################################################################
# Directory Setup
################################################################################

setup_directories() {
    log_info "Setting up directories..."

    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/logs"
    mkdir -p "$INSTALL_DIR/data"
    mkdir -p "$INSTALL_DIR/logs/agent"
    mkdir -p "$INSTALL_DIR/logs/bridge"
    mkdir -p "$INSTALL_DIR/logs/web"
    mkdir -p "$INSTALL_DIR/logs/desktop"
    mkdir -p "$HOME/.orbit/memory"

    log_success "Directories created"
}

################################################################################
# Clone Repositories
################################################################################

clone_repositories() {
    log_info "Cloning repositories..."

    # Clone Orbit Agent
    if [ ! -d "$INSTALL_DIR/orbit-agent" ]; then
        log_info "Cloning Orbit Agent from $AGENT_REPO..."
        git clone "$AGENT_REPO" "$INSTALL_DIR/orbit-agent"
        log_success "Orbit Agent cloned"
    else
        log_info "Orbit Agent already exists, updating..."
        cd "$INSTALL_DIR/orbit-agent"
        git pull
        log_success "Orbit Agent updated"
    fi

    # Clone ClawdbotClone (Bridge + Web + Desktop)
    if [ ! -d "$INSTALL_DIR/clawdbotClone" ]; then
        log_info "Cloning ClawdbotClone from $CLAWDBOT_REPO..."
        git clone "$CLAWDBOT_REPO" "$INSTALL_DIR/clawdbotClone"
        log_success "ClawdbotClone cloned"
    else
        log_info "ClawdbotClone already exists, updating..."
        cd "$INSTALL_DIR/clawdbotClone"
        git pull
        log_success "ClawdbotClone updated"
    fi
}

################################################################################
# Install Python Agent
################################################################################

install_agent() {
    log_info "Installing Python Agent..."

    cd "$INSTALL_DIR/orbit-agent"

    # Check if venv exists
    if [ ! -d ".venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv .venv
    fi

    # Activate venv and install dependencies
    source .venv/bin/activate

    log_info "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt

    log_success "Python Agent installed"
}

################################################################################
# Install Bridge, Web, and Desktop (Monorepo)
################################################################################

install_monorepo() {
    log_info "Installing Monorepo packages..."

    cd "$INSTALL_DIR/clawdbotClone"

    # Install root dependencies with pnpm
    log_info "Installing root dependencies..."
    pnpm install

    # Build packages in correct order
    log_info "Building packages..."

    # Build common package first
    if [ -d "packages/common" ]; then
        log_info "Building common package..."
        cd packages/common && pnpm build && cd ../..
    fi

    # Build bridge
    if [ -d "packages/bridge" ]; then
        log_info "Building bridge..."
        cd packages/bridge && pnpm build && cd ../..
    fi

    # Build desktop
    if [ -d "packages/desktop" ]; then
        log_info "Building desktop..."
        cd packages/desktop && pnpm build && cd ../..
    fi

    # Build web
    if [ -d "apps/web" ]; then
        log_info "Building web dashboard..."
        cd apps/web && pnpm build && cd ../..
    fi

    log_success "All packages installed and built"
}

################################################################################
# Environment Setup
################################################################################

setup_environment() {
    log_info "Setting up environment files..."

    # Load port configuration
    PORTS_CONFIG="$INSTALL_DIR/.env-ports"
    if [ -f "$PORTS_CONFIG" ]; then
        source "$PORTS_CONFIG"
    fi

    # Create .env for Orbit Agent
    if [ ! -f "$INSTALL_DIR/orbit-agent/.env" ]; then
        log_info "Creating .env for Orbit Agent..."
        cat > "$INSTALL_DIR/orbit-agent/.env" << EOF
# Orbit Agent Configuration
PORT=$AGENT_PORT
DEBUG=true

# LLM Providers (Set at least one)
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
GOOGLE_API_KEY=your-google-key-here
DEFAULT_LLM_PROVIDER=openai

# Database (Neon PostgreSQL recommended)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Bridge Configuration
BRIDGE_URL=http://localhost:$BRIDGE_PORT
BRIDGE_API_KEY=your-bridge-api-key

# Frontend Configuration
FRONTEND_URL=http://localhost:$WEB_PORT

# Email/Gmail Configuration (Optional)
GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:$WEB_PORT/auth/gmail/callback

# Encryption
ENCRYPTION_KEY=your-encryption-key-here
EOF
        log_warn "Please configure $INSTALL_DIR/orbit-agent/.env with your API keys"
    fi

    # Create .env for Bridge
    if [ ! -f "$INSTALL_DIR/clawdbotClone/packages/bridge/.env" ]; then
        log_info "Creating .env for Bridge..."
        cat > "$INSTALL_DIR/clawdbotClone/packages/bridge/.env" << EOF
# Bridge Configuration
PORT=$BRIDGE_PORT
NODE_ENV=development
FRONTEND_URL=http://localhost:$WEB_PORT

# Database (Neon PostgreSQL recommended)
# Get free database at: https://console.neon.tech/
NEON_DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Secret (Generate a secure random string)
JWT_SECRET=generate-secure-random-string-at-least-32-characters
JWT_EXPIRATION=3600

# OAuth - Google (for profile/login)
# Get credentials at: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:$WEB_PORT/auth/google/callback

# OAuth - Gmail (for email sending)
GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:$WEB_PORT/auth/gmail/callback

# Telegram Bot Configuration
# Get bot token from: https://t.me/BotFather
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-from-botfather
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhooks/telegram

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
LOG_TO_FILE=true

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Orbit Agent API
AGENT_API_URL=http://localhost:$AGENT_PORT
EOF
        log_warn "Please configure $INSTALL_DIR/clawdbotClone/packages/bridge/.env"
    fi

    # Create .env for Web Dashboard
    if [ ! -f "$INSTALL_DIR/clawdbotClone/apps/web/.env.local" ]; then
        log_info "Creating .env.local for Web Dashboard..."
        cat > "$INSTALL_DIR/clawdbotClone/apps/web/.env.local" << EOF
# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:$BRIDGE_PORT
NEXT_PUBLIC_DESKTOP_URL=http://localhost:$DESKTOP_PORT

# Google OAuth (for authentication)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback/google

# JWT Secret (must match Bridge JWT_SECRET)
JWT_SECRET=generate-secure-random-string-at-least-32-characters
EOF
        log_warn "Please configure $INSTALL_DIR/clawdbotClone/apps/web/.env.local"
    fi

    log_success "Environment files created"
}

################################################################################
# Database Setup
################################################################################

setup_database() {
    log_info "Database setup instructions..."

    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}DATABASE SETUP REQUIRED${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo "You need to set up a PostgreSQL database. We recommend using Neon (free tier):"
    echo ""
    echo "1. Visit: https://console.neon.tech/"
    echo "2. Create a free account and project"
    echo "3. Copy the connection string"
    echo ""
    echo "Then update the following files:"
    echo ""
    echo "  • $INSTALL_DIR/orbit-agent/.env"
    echo "    Set: DATABASE_URL=your-neon-connection-string"
    echo ""
    echo "  • $INSTALL_DIR/clawdbotClone/packages/bridge/.env"
    echo "    Set: NEON_DATABASE_URL=your-neon-connection-string"
    echo ""
    echo "4. Run migrations (after configuring):"
    echo "   cd $INSTALL_DIR/clawdbotClone/packages/bridge"
    echo "   pnpm migration:run"
    echo ""

    read -p "Have you configured the database URL? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Running database migrations..."
        cd "$INSTALL_DIR/clawdbotClone/packages/bridge"
        if pnpm migration:run; then
            log_success "Database migrations completed"
        else
            log_warn "Migration failed. Please run manually after configuring .env"
        fi
    else
        log_warn "Skipping database setup. Run migrations manually after configuring:"
        echo "  cd $INSTALL_DIR/clawdbotClone/packages/bridge"
        echo "  pnpm migration:run"
    fi
}

################################################################################
# Start Services
################################################################################

start_services() {
    log_info "Starting Orbit AI services..."

    # Start Python Agent
    log_info "Starting Python Agent on port $AGENT_PORT..."
    cd "$INSTALL_DIR/orbit-agent"
    source .venv/bin/activate
    nohup uvicorn main:app --host 0.0.0.0 --port $AGENT_PORT > "$INSTALL_DIR/logs/agent.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/agent.pid"
    log_success "Python Agent started"

    # Start Bridge Server
    log_info "Starting Bridge Server on port $BRIDGE_PORT..."
    cd "$INSTALL_DIR/clawdbotClone/packages/bridge"
    nohup pnpm start > "$INSTALL_DIR/logs/bridge.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/bridge.pid"
    log_success "Bridge Server started"

    # Start Web Dashboard
    log_info "Starting Web Dashboard on port $WEB_PORT..."
    cd "$INSTALL_DIR/clawdbotClone/apps/web"
    nohup pnpm start > "$INSTALL_DIR/logs/web.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/web.pid"
    log_success "Web Dashboard started"

    # Note: Desktop TUI should be started manually by user
    log_info "Desktop TUI can be started manually with:"
    echo "  cd $INSTALL_DIR/clawdbotClone/packages/desktop"
    echo "  pnpm dev"
}

################################################################################
# Display Summary
################################################################################

display_summary() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}          Orbit AI v1.0.0 - Installation Complete!         ${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Installation Location: $INSTALL_DIR"
    echo ""
    echo -e "${BLUE}Services Running:${NC}"
    echo "  • Python Agent:   http://localhost:$AGENT_PORT"
    echo "  • Bridge Server:  http://localhost:$BRIDGE_PORT"
    echo "  • Web Dashboard:  http://localhost:$WEB_PORT"
    echo "  • Desktop TUI:    Start manually (see below)"
    echo ""
    echo -e "${BLUE}Quick Start:${NC}"
    echo "  1. Open browser: http://localhost:$WEB_PORT"
    echo "  2. Sign up or login"
    echo "  3. Start Desktop TUI in a new terminal:"
    echo "     cd $INSTALL_DIR/clawdbotClone/packages/desktop && pnpm dev"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Configure the following before using:${NC}"
    echo ""
    echo "1. Database Setup (Neon PostgreSQL recommended):"
    echo "   • Get free DB at: https://console.neon.tech/"
    echo "   • Update: $INSTALL_DIR/orbit-agent/.env"
    echo "   • Update: $INSTALL_DIR/clawdbotClone/packages/bridge/.env"
    echo "   • Run: cd $INSTALL_DIR/clawdbotClone/packages/bridge && pnpm migration:run"
    echo ""
    echo "2. API Keys (for AI functionality):"
    echo "   • Update: $INSTALL_DIR/orbit-agent/.env"
    echo "   • Set: OPENAI_API_KEY or ANTHROPIC_API_KEY"
    echo ""
    echo "3. OAuth Setup (for authentication):"
    echo "   • Get credentials at: https://console.cloud.google.com/"
    echo "   • Update: $INSTALL_DIR/clawdbotClone/packages/bridge/.env"
    echo "   • Update: $INSTALL_DIR/clawdbotClone/apps/web/.env.local"
    echo ""
    echo "4. Telegram Bot (optional, for Telegram integration):"
    echo "   • Create bot: https://t.me/BotFather"
    echo "   • Update: $INSTALL_DIR/clawdbotClone/packages/bridge/.env"
    echo ""
    echo -e "${BLUE}Service Management:${NC}"
    echo "  • Stop all:     kill \$(cat $INSTALL_DIR/logs/*.pid)"
    echo "  • Restart all:  kill \$(cat $INSTALL_DIR/logs/*.pid) && cd $INSTALL_DIR && restart_all_services"
    echo "  • View logs:    tail -f $INSTALL_DIR/logs/agent.log"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  • Agent:    $INSTALL_DIR/orbit-agent/README.md"
    echo "  • Bridge:   $INSTALL_DIR/clawdbotClone/README.md"
    echo "  • Support:  https://github.com/ayan-de/clawdbotClone/issues"
    echo ""
    echo -e "${BLUE}Updates:${NC}"
    echo "  • To update to latest version: curl -fsSL https://ayande.xyz/update.sh | bash"
    echo "  • Updates preserve your configuration and data"
    echo ""
    echo -e "${YELLOW}⚠️  Remember to configure your API keys and database before using!${NC}"
    echo ""
    echo -e "${CYAN}"
    display_logo
    echo -e "${NC}"
}

################################################################################
# Save Version
################################################################################

save_version() {
    echo "1.0.0" > "$INSTALL_DIR/.version"
    log_success "Version saved: 1.0.0"
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    clear
    echo -e "${CYAN}"
    display_logo
    echo -e "${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}           Orbit AI v1.0.0 - Production Installer${NC}"
    echo -e "${CYAN}           Hosted: https://ayande.xyz${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Detect OS
    OSTYPE=$(uname -s)
    OS_TYPE=$(detect_os)
    log_info "Detected OS: $OS_TYPE"
    echo ""

    # Installation steps
    check_dependencies
    setup_directories
    configure_ports
    clone_repositories
    install_agent
    install_monorepo
    setup_environment
    setup_database

    # Ask to start services
    echo ""
    read -p "Start all services now? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
        sleep 3
        display_summary
    else
        log_info "Services not started. Start them manually:"
        echo ""
        echo "  # Start Python Agent"
        echo "  cd $INSTALL_DIR/orbit-agent"
        echo "  source .venv/bin/activate"
        echo "  uvicorn main:app --host 0.0.0.0 --port $AGENT_PORT"
        echo ""
        echo "  # Start Bridge Server"
        echo "  cd $INSTALL_DIR/clawdbotClone/packages/bridge"
        echo "  pnpm start"
        echo ""
        echo "  # Start Web Dashboard"
        echo "  cd $INSTALL_DIR/clawdbotClone/apps/web"
        echo "  pnpm start"
        echo ""
        echo "  # Start Desktop TUI (in separate terminal)"
        echo "  cd $INSTALL_DIR/clawdbotClone/packages/desktop"
        echo "  pnpm dev"
        echo ""
    fi

    # Save version after successful installation
    save_version
}

# Run main function
main
