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

log_silent() {
    # Silent logging - writes to a hidden log file
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$INSTALL_DIR/install.log" 2>/dev/null || true
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
# Dependency Checks and Installation
################################################################################

install_git() {
    log_info "Installing Git..."

    if [[ "$OS_TYPE" == "macos" ]]; then
        if command -v brew &>/dev/null; then
            brew install git
        else
            log_error "Homebrew not found. Please install from https://brew.sh"
            echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [[ "$OS_TYPE" == "linux" || "$OS_TYPE" == "wsl" ]]; then
        sudo apt update
        sudo apt install -y git
    fi
}

install_python() {
    log_info "Installing Python 3.10+..."

    if [[ "$OS_TYPE" == "macos" ]]; then
        if command -v brew &>/dev/null; then
            brew install python@3.11
        else
            log_error "Homebrew not found. Please install from https://brew.sh"
            exit 1
        fi
    elif [[ "$OS_TYPE" == "linux" || "$OS_TYPE" == "wsl" ]]; then
        sudo apt update
        sudo apt install -y software-properties-common

        # Add deadsnakes PPA for Python 3.11
        if [[ "$OS_TYPE" != "wsl" ]]; then
            sudo add-apt-repository -y ppa:deadsnakes/ppa
            sudo apt update
        fi

        # Install Python 3.11
        sudo apt install -y python3.11 python3.11-venv python3.11-dev

        # Set python3.11 as default if needed
        if ! command -v python3.11 &>/dev/null; then
            log_warn "Python 3.11 installation may have failed. Trying Python 3.10..."
            sudo apt install -y python3.10 python3.10-venv python3.10-dev
        fi
    fi

    # Verify installation
    if command -v python3.11 &>/dev/null; then
        log_success "Python 3.11 installed"
    elif command -v python3.10 &>/dev/null; then
        log_success "Python 3.10 installed"
    else
        log_error "Python installation failed. Please install manually."
        exit 1
    fi
}

install_nodejs() {
    log_info "Installing Node.js 18+..."

    if [[ "$OS_TYPE" == "macos" ]]; then
        if command -v brew &>/dev/null; then
            brew install node
        else
            log_error "Homebrew not found. Please install from https://brew.sh"
            exit 1
        fi
    elif [[ "$OS_TYPE" == "linux" || "$OS_TYPE" == "wsl" ]]; then
        # Install Node.js 20 LTS using NodeSource
        log_info "Setting up Node.js repository..."

        # Download and run NodeSource setup script
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

        # Install Node.js
        sudo apt install -y nodejs
    fi

    # Verify installation
    if command -v node &>/dev/null; then
        local node_version=$(node -v)
        log_success "Node.js $node_version installed"
    else
        log_error "Node.js installation failed. Please install manually."
        exit 1
    fi

    # Verify npm
    if command -v npm &>/dev/null; then
        local npm_version=$(npm -v)
        log_success "npm $npm_version installed"
    else
        log_error "npm installation failed. Please install manually."
        exit 1
    fi
}

install_pnpm() {
    log_info "Installing pnpm..."

    # npm is required to install pnpm
    if ! command -v npm &>/dev/null; then
        log_error "npm is not installed. Cannot install pnpm."
        exit 1
    fi

    # Install pnpm using npm
    npm install -g pnpm

    # Verify installation
    if command -v pnpm &>/dev/null; then
        local pnpm_version=$(pnpm -v)
        log_success "pnpm $pnpm_version installed"
    else
        log_error "pnpm installation failed. Please install manually."
        exit 1
    fi
}

check_dependencies() {
    log_info "Checking dependencies..."

    local needs_git=false
    local needs_python=false
    local needs_node=false
    local needs_pnpm=false

    # Check git
    if ! command -v git &>/dev/null; then
        log_warn "Git not found, will install..."
        needs_git=true
    else
        local git_version=$(git --version)
        log_info "✓ $git_version"
    fi

    # Check Python 3.10+
    if ! command -v python3 &>/dev/null; then
        log_warn "Python 3 not found, will install..."
        needs_python=true
    else
        if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 10) else exit(1))" 2>/dev/null; then
            local py_version=$(python3 --version)
            log_warn "$py_version found, but Python 3.10+ is required. Will install..."
            needs_python=true
        else
            local py_version=$(python3 --version)
            log_info "✓ $py_version"
        fi
    fi

    # Check Node.js
    if ! command -v node &>/dev/null; then
        log_warn "Node.js not found, will install..."
        needs_node=true
    else
        local node_version=$(node -v)
        # Check if Node.js is 18+ (LTS)
        if ! node -e "process.exit(process.version.split('.')[0].slice(1) >= 18)" 2>/dev/null; then
            log_warn "$node_version found, but Node.js 18+ is required. Will install..."
            needs_node=true
        else
            log_info "✓ Node.js $node_version"
        fi
    fi

    # Check npm
    if ! command -v npm &>/dev/null; then
        log_warn "npm not found (will be installed with Node.js)..."
        needs_node=true
    else
        local npm_version=$(npm -v)
        log_info "✓ npm $npm_version"
    fi

    # Check pnpm
    if ! command -v pnpm &>/dev/null; then
        log_warn "pnpm not found, will install..."
        needs_pnpm=true
    else
        local pnpm_version=$(pnpm -v)
        log_info "✓ pnpm $pnpm_version"
    fi

    # Install missing dependencies
    if [ "$needs_git" = true ]; then
        install_git
    fi

    if [ "$needs_python" = true ]; then
        install_python
    fi

    if [ "$needs_node" = true ]; then
        install_nodejs
    fi

    if [ "$needs_pnpm" = true ]; then
        install_pnpm
    fi

    # Final verification
    log_info "Verifying all dependencies..."

    if ! command -v git &>/dev/null; then
        log_error "Git installation failed"
        exit 1
    fi

    if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 10) else exit(1))" 2>/dev/null; then
        log_error "Python 3.10+ installation failed"
        exit 1
    fi

    if ! command -v node &>/dev/null; then
        log_error "Node.js installation failed"
        exit 1
    fi

    if ! command -v pnpm &>/dev/null; then
        log_error "pnpm installation failed"
        exit 1
    fi

    log_success "All dependencies installed and verified!"
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
GOOGLE_REDIRECT_URI=http://localhost:$WEB_PORT/api/auth/callback/google

# JWT Secret (must match Bridge JWT_SECRET)
JWT_SECRET=generate-secure-random-string-at-least-32-characters
EOF
        log_warn "Please configure $INSTALL_DIR/clawdbotClone/apps/web/.env.local"
    fi

    log_success "Environment files created"

    # Save setup information to a log file (hidden from user)
    cat > "$INSTALL_DIR/setup-notes.md" << 'EOF'
# Orbit AI Setup Notes

## Google OAuth HTTPS Requirement

Google OAuth requires HTTPS callback URLs!

Your current configuration uses HTTP:
  • Web URL: http://localhost:8444
  • Google OAuth callback: http://localhost:8444/api/auth/callback/google

This will cause 500 errors at Google Console!

You have THREE options:

Option 1: Use HTTPS Tunnel (Recommended for Development)
  • Expose localhost to HTTPS tunnel
  • Install ngrok: https://ngrok.com/download
  • Run: ngrok http 8444
  • Get HTTPS URL from ngrok output (e.g., https://abc123.ngrok.io)
  • Add ngrok HTTPS URL to Google Console as callback
  • Update: ~/.orbit/clawdbotClone/apps/web/.env.local
    Set: GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/api/auth/callback/google

Option 2: Use Production Domain
  • Deploy to production server with HTTPS
  • Use your domain in Google OAuth callback
  • No tunneling needed for production

Option 3: Configure Google Client for HTTP (Not Recommended)
  • Google Console allows HTTP for localhost (127.0.0.1)
  • But this only works for exact IP 127.0.0.1
  • Does NOT work with localhost:8444
  • Not recommended for production

Quick Setup with ngrok:
  1. Install: brew install ngrok (macOS) or from https://ngrok.com/download
  2. Run: ngrok http 8444
  3. Copy ngrok HTTPS URL (e.g., https://abc123.ngrok.io)
  4. Update Google Console callback URL to ngrok URL
  5. Update .env.local: GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/api/auth/callback/google
  6. Restart web: kill $(cat ~/.orbit/logs/web.pid) && cd ~/.orbit/clawdbotClone/apps/web && pnpm start

After setup, Google OAuth will work!
EOF
}

################################################################################
# Database Setup (Hidden from main output)
################################################################################

setup_database() {
    # Save database setup notes to a file (hidden from user)
    cat > "$INSTALL_DIR/database-setup.md" << 'EOF'
# Database Setup

You need to set up a PostgreSQL database. We recommend using Neon (free tier):

1. Visit: https://console.neon.tech/
2. Create a free account and project
3. Copy the connection string

Then update the following files:

  • ~/.orbit/orbit-agent/.env
    Set: DATABASE_URL=your-neon-connection-string

  • ~/.orbit/clawdbotClone/packages/bridge/.env
    Set: NEON_DATABASE_URL=your-neon-connection-string

4. Run migrations (after configuring):
   cd ~/.orbit/clawdbotClone/packages/bridge
   pnpm migration:run

Note: Database setup is optional for initial testing but required for full functionality.
EOF

    # Check if database is already configured
    if grep -q "your-neon-connection-string" "$INSTALL_DIR/orbit-agent/.env" 2>/dev/null; then
        # Database not configured, silently skip for now
        :
    else
        # Database might be configured, try running migrations silently
        cd "$INSTALL_DIR/clawdbotClone/packages/bridge"
        pnpm migration:run > /dev/null 2>&1 || true
    fi
}

################################################################################
# Start Services
################################################################################

wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    log_info "Waiting for $service_name to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port 2>/dev/null | grep -q "200\|404"; then
            log_success "$service_name is ready!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    log_error "$service_name failed to start or is not responding"

    # Show error logs
    if [ -f "$INSTALL_DIR/logs/${service_name,,}.log" ]; then
        echo ""
        echo -e "${YELLOW}Last 20 lines of $service_name log:${NC}"
        tail -20 "$INSTALL_DIR/logs/${service_name,,}.log"
        echo ""
    fi

    return 1
}

check_service_running() {
    local pid_file=$1
    local service_name=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        else
            log_error "$service_name process (PID: $pid) is not running!"
            return 1
        fi
    else
        log_error "$service_name PID file not found!"
        return 1
    fi
}

start_services() {
    log_info "Starting Orbit AI core services..."

    # Start Python Agent (always runs)
    log_info "Starting Python Agent on port $AGENT_PORT..."
    cd "$INSTALL_DIR/orbit-agent"
    source .venv/bin/activate
    nohup uvicorn src.main:app --host 0.0.0.0 --port $AGENT_PORT > "$INSTALL_DIR/logs/agent.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/agent.pid"
    sleep 2

    if check_service_running "$INSTALL_DIR/logs/agent.pid" "Python Agent"; then
        log_success "Python Agent started"
    else
        log_error "Python Agent failed to start. Check logs: $INSTALL_DIR/logs/agent.log"
        exit 1
    fi

    # Start Bridge Server (always runs)
    log_info "Starting Bridge Server on port $BRIDGE_PORT..."
    cd "$INSTALL_DIR/clawdbotClone/packages/bridge"
    nohup pnpm start > "$INSTALL_DIR/logs/bridge.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/bridge.pid"
    sleep 3

    if check_service_running "$INSTALL_DIR/logs/bridge.pid" "Bridge Server"; then
        log_success "Bridge Server started"
    else
        log_error "Bridge Server failed to start. Check logs: $INSTALL_DIR/logs/bridge.log"
        exit 1
    fi

    # Wait for Bridge to be ready
    if ! wait_for_service "Bridge Server" $BRIDGE_PORT; then
        log_error "Bridge Server is not responding. Check logs: $INSTALL_DIR/logs/bridge.log"
        echo ""
        echo "You can try to fix this issue and restart services manually:"
        echo "  cd $INSTALL_DIR/clawdbotClone/packages/bridge"
        echo "  pnpm start"
        echo ""
        exit 1
    fi

    # Start Web Dashboard (always runs)
    log_info "Starting Web Dashboard on port $WEB_PORT..."
    cd "$INSTALL_DIR/clawdbotClone/apps/web"
    nohup pnpm start > "$INSTALL_DIR/logs/web.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/web.pid"
    sleep 3

    if check_service_running "$INSTALL_DIR/logs/web.pid" "Web Dashboard"; then
        log_success "Web Dashboard started"
    else
        log_error "Web Dashboard failed to start. Check logs: $INSTALL_DIR/logs/web.log"
        exit 1
    fi

    # Wait for Web Dashboard to be ready
    if ! wait_for_service "Web Dashboard" $WEB_PORT; then
        log_error "Web Dashboard is not responding. Check logs: $INSTALL_DIR/logs/web.log"
        echo ""
        echo "You can try to fix this issue and restart services manually:"
        echo "  cd $INSTALL_DIR/clawdbotClone/apps/web"
        echo "  pnpm start"
        echo ""
        exit 1
    fi

    # DO NOT auto-start Desktop TUI - user needs to authorize via website first
    log_info "Desktop TUI waiting for authorization..."
    log_info "Core services are running:"
    echo ""
    echo "  • Python Agent:   http://localhost:$AGENT_PORT"
    echo "  • Bridge Server:  http://localhost:$BRIDGE_PORT"
    echo "  • Web Dashboard:  http://localhost:$WEB_PORT"
    echo ""
}

################################################################################
# Orbit Token Prompt and Desktop TUI Startup
################################################################################

prompt_orbit_token() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}          Orbit Token Authorization${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}To start the Desktop TUI, you need to authorize it:${NC}"
    echo ""
    echo -e "${YELLOW}Please follow these steps:${NC}"
    echo ""
    echo "  1. Open browser: http://localhost:$WEB_PORT"
    echo "  2. Sign up or login"
    echo "  3. Go to Settings / Desktop Authorization"
    echo "  4. Connect to Telegram (or your chat platform)"
    echo "  5. Enter your username"
    echo "  6. Click 'Authorize Desktop'"
    echo "  7. Copy the orbit token (e.g., 'orbit-sfsdfs')"
    echo ""
    echo -e "${YELLOW}Paste your orbit token below (or press Enter to skip):${NC}"
    read -p "Orbit Token: " orbit_token

    if [ -z "$orbit_token" ]; then
        log_warn "No token provided. Skipping Desktop TUI startup."
        echo ""
        echo "You can start Desktop TUI later by running:"
        echo "  cd $INSTALL_DIR/clawdbotClone/packages/desktop"
        echo "  pnpm start -- --token <your-orbit-token>"
        echo ""
        return 1
    fi

    # Start Desktop TUI with provided token
    log_info "Starting Desktop TUI with token..."
    cd "$INSTALL_DIR/clawdbotClone/packages/desktop"
    pnpm start -- --token "$orbit_token" &
    DESKTOP_PID=$!
    echo $DESKTOP_PID > "$INSTALL_DIR/logs/desktop.pid"

    log_success "Desktop TUI started with token!"
    echo ""
    echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}          All Services Running!${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Services:"
    echo "  • Python Agent:   http://localhost:$AGENT_PORT"
    echo "  • Bridge Server:  http://localhost:$BRIDGE_PORT"
    echo "  • Web Dashboard:  http://localhost:$WEB_PORT"
    echo "  • Desktop TUI:    Running (in terminal with token)"
    echo ""
    echo -e "${BLUE}You can now type commands in the Desktop TUI!${NC}"
    echo ""
    echo "Useful Commands:"
    echo "  • /start - Show help"
    echo "  • /status - Show system status"
    echo ""
    echo -e "${BLUE}To stop all services:${NC}"
    echo "  kill \$(cat $INSTALL_DIR/logs/*.pid)"
    echo ""

    return 0
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
    echo "  3. Go to Settings / Desktop Authorization"
    echo "  4. Connect to Telegram and get orbit token"
    echo "  5. Start Desktop TUI in a new terminal:"
    echo "     cd $INSTALL_DIR/clawdbotClone/packages/desktop && pnpm start -- --token <your-orbit-token>"
    echo ""
    echo -e "${YELLOW}Optional Configuration (for full functionality):${NC}"
    echo "  • Database:    See $INSTALL_DIR/database-setup.md"
    echo "  • API Keys:    Edit $INSTALL_DIR/orbit-agent/.env"
    echo "  • OAuth:       See $INSTALL_DIR/setup-notes.md"
    echo "  • Telegram:    Edit $INSTALL_DIR/clawdbotClone/packages/bridge/.env"
    echo ""
    echo -e "${BLUE}Service Management:${NC}"
    echo "  • Stop all:     kill \$(cat $INSTALL_DIR/logs/*.pid)"
    echo "  • Restart all:  kill \$(cat $INSTALL_DIR/logs/*.pid) && cd $INSTALL_DIR && restart_all_services"
    echo "  • View logs:    tail -f $INSTALL_DIR/logs/agent.log"
    echo ""
    echo -e "${BLUE}Troubleshooting:${NC}"
    echo "  • If Web Dashboard doesn't load: tail -f $INSTALL_DIR/logs/web.log"
    echo "  • If Bridge fails: tail -f $INSTALL_DIR/logs/bridge.log"
    echo "  • If Agent fails: tail -f $INSTALL_DIR/logs/agent.log"
    echo "  • Check if ports are in use: lsof -i :$WEB_PORT :$BRIDGE_PORT :$AGENT_PORT"
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

    # Start core services (Agent + Bridge + Web)
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  Starting Core Services  ${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    log_info "Starting core services (Agent, Bridge, Web)..."
    start_services

    # Final verification - check if web dashboard is accessible
    echo ""
    log_info "Verifying services are accessible..."

    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$WEB_PORT 2>/dev/null | grep -q "200\|404"; then
        log_success "All services verified and accessible!"
    else
        log_warn "Web Dashboard might not be fully ready yet, but services are running."
        echo ""
        echo "If http://localhost:$WEB_PORT doesn't load, check the logs:"
        echo "  tail -f $INSTALL_DIR/logs/web.log"
        echo ""
        read -p "Press Enter to continue (you can try accessing the dashboard manually)..."
    fi

    # Prompt for Orbit token to start Desktop TUI
    prompt_orbit_token

    # Display summary after token prompt
    log_success "Core services running!"

    # Display final summary
    display_summary
}

# Run main function
main
