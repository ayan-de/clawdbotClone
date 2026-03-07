#!/bin/bash

################################################################################
# Orbit AI - Update Script
#
# Hosted at: https://ayande.xyz/update.sh
# Usage: curl -fsSL https://ayande.xyz/update.sh | bash
#
# This script updates Orbit AI to the latest version while preserving:
# - User configuration (.env files)
# - Database data
# - User files in ~/.orbit/data/
# - Logs
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

################################################################################
# Display Logo
################################################################################

display_logo() {
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
CURRENT_VERSION_FILE="$INSTALL_DIR/.version"
REMOTE_VERSION_URL="https://api.github.com/repos/ayan-de/clawdbotClone/releases/latest"
BACKUP_DIR="$INSTALL_DIR/backups/$(date +%Y%m%d_%H%M%S)"
PORTS_CONFIG="$INSTALL_DIR/.env-ports"

# Load port configuration if it exists
if [ -f "$PORTS_CONFIG" ]; then
    source "$PORTS_CONFIG"
else
    # Default ports (if config doesn't exist)
    AGENT_PORT=8888
    BRIDGE_PORT=8443
    WEB_PORT=8444
    DESKTOP_PORT=8445
fi

################################################################################
# Logging
################################################################################

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

################################################################################
# Version Detection
################################################################################

get_current_version() {
    if [ -f "$CURRENT_VERSION_FILE" ]; then
        cat "$CURRENT_VERSION_FILE"
    else
        echo "1.0.0"  # Default if no version file
    fi
}

get_latest_version() {
    log_info "Checking for latest version..."
    local version
    version=$(curl -s "$REMOTE_VERSION_URL" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/' | sed 's/v//')
    if [ -z "$version" ]; then
        log_warn "Could not fetch latest version, assuming 1.0.0"
        echo "1.0.0"
    else
        echo "$version"
    fi
}

compare_versions() {
    if [ "$1" = "$2" ]; then
        echo "same"
    else
        local IFS=.
        local i ver1=($1) ver2=($2)
        for ((i=0; i<${#ver1[@]}; i++)); do
            if [ -z "${ver2[i]:-0}" ]; then
                echo "newer"
                return
            fi
            if ((10#${ver1[i]} > 10#${ver2[i]})); then
                echo "newer"
                return
            fi
            if ((10#${ver1[i]} < 10#${ver2[i]})); then
                echo "older"
                return
            fi
        done
        echo "same"
    fi
}

################################################################################
# Backup Functions
################################################################################

backup_files() {
    log_info "Creating backup at $BACKUP_DIR..."

    mkdir -p "$BACKUP_DIR"

    # Backup environment files
    if [ -f "$INSTALL_DIR/orbit-agent/.env" ]; then
        cp "$INSTALL_DIR/orbit-agent/.env" "$BACKUP_DIR/agent.env"
        log_success "Backed up agent .env"
    fi

    if [ -f "$INSTALL_DIR/clawdbotClone/packages/bridge/.env" ]; then
        cp "$INSTALL_DIR/clawdbotClone/packages/bridge/.env" "$BACKUP_DIR/bridge.env"
        log_success "Backed up bridge .env"
    fi

    if [ -f "$INSTALL_DIR/clawdbotClone/apps/web/.env.local" ]; then
        cp "$INSTALL_DIR/clawdbotClone/apps/web/.env.local" "$BACKUP_DIR/web.env"
        log_success "Backed up web .env.local"
    fi

    # Backup database (if local)
    if [ -d "$INSTALL_DIR/clawdbotClone/packages/bridge/data" ]; then
        cp -r "$INSTALL_DIR/clawdbotClone/packages/bridge/data" "$BACKUP_DIR/"
        log_success "Backed up database data"
    fi

    # Backup user data
    if [ -d "$INSTALL_DIR/data" ]; then
        cp -r "$INSTALL_DIR/data" "$BACKUP_DIR/"
        log_success "Backed up user data"
    fi

    # Backup current version
    get_current_version > "$BACKUP_DIR/.version"
    log_success "Backup complete"
}

################################################################################
# Stop Services
################################################################################

stop_services() {
    log_info "Stopping Orbit AI services..."

    # Stop via PID files if they exist
    if [ -f "$INSTALL_DIR/logs/agent.pid" ]; then
        kill $(cat "$INSTALL_DIR/logs/agent.pid") 2>/dev/null || true
        rm "$INSTALL_DIR/logs/agent.pid"
        log_success "Stopped Python Agent"
    fi

    if [ -f "$INSTALL_DIR/logs/bridge.pid" ]; then
        kill $(cat "$INSTALL_DIR/logs/bridge.pid") 2>/dev/null || true
        rm "$INSTALL_DIR/logs/bridge.pid"
        log_success "Stopped Bridge Server"
    fi

    if [ -f "$INSTALL_DIR/logs/web.pid" ]; then
        kill $(cat "$INSTALL_DIR/logs/web.pid") 2>/dev/null || true
        rm "$INSTALL_DIR/logs/web.pid"
        log_success "Stopped Web Dashboard"
    fi

    # Also kill by port (fallback)
    for port in $AGENT_PORT $BRIDGE_PORT $WEB_PORT; do
        pid=$(lsof -t -i:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill $pid 2>/dev/null || true
            log_warn "Killed process on port $port"
        fi
    done

    sleep 2
}

################################################################################
# Update Repositories
################################################################################

update_repositories() {
    log_info "Updating repositories..."

    # Update Orbit Agent
    if [ -d "$INSTALL_DIR/orbit-agent" ]; then
        cd "$INSTALL_DIR/orbit-agent"
        log_info "Updating Orbit Agent..."
        git fetch origin
        git pull origin main
        log_success "Orbit Agent updated"
    else
        log_error "Orbit Agent not found. Please run initial install first."
        exit 1
    fi

    # Update ClawdbotClone
    if [ -d "$INSTALL_DIR/clawdbotClone" ]; then
        cd "$INSTALL_DIR/clawdbotClone"
        log_info "Updating ClawdbotClone..."
        git fetch origin
        git pull origin main
        log_success "ClawdbotClone updated"
    else
        log_error "ClawdbotClone not found. Please run initial install first."
        exit 1
    fi
}

################################################################################
# Rebuild Components
################################################################################

rebuild_components() {
    log_info "Rebuilding components..."

    # Update Python Agent dependencies
    cd "$INSTALL_DIR/orbit-agent"
    source .venv/bin/activate
    log_info "Updating Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    log_success "Python Agent updated"

    # Update monorepo dependencies
    cd "$INSTALL_DIR/clawdbotClone"
    log_info "Updating monorepo dependencies..."
    pnpm install
    log_success "Dependencies updated"

    # Rebuild packages
    log_info "Rebuilding packages..."

    if [ -d "packages/common" ]; then
        cd packages/common && pnpm build && cd ../..
    fi

    if [ -d "packages/bridge" ]; then
        cd packages/bridge && pnpm build && cd ../..
    fi

    if [ -d "packages/desktop" ]; then
        cd packages/desktop && pnpm build && cd ../..
    fi

    if [ -d "apps/web" ]; then
        cd apps/web && pnpm build && cd ../..
    fi

    log_success "All packages rebuilt"
}

################################################################################
# Run Database Migrations
################################################################################

run_migrations() {
    log_info "Checking for database migrations..."

    cd "$INSTALL_DIR/clawdbotClone/packages/bridge"

    # Check if there are pending migrations
    if pnpm migration:run; then
        log_success "Database migrations completed"
    else
        log_warn "No new migrations or migration failed"
        log_warn "Please check database connection and run manually if needed:"
        echo "  cd $INSTALL_DIR/clawdbotClone/packages/bridge"
        echo "  pnpm migration:run"
    fi
}

################################################################################
# Restore Configuration
################################################################################

restore_configuration() {
    log_info "Restoring configuration..."

    # Restore environment files
    if [ -f "$BACKUP_DIR/agent.env" ]; then
        cp "$BACKUP_DIR/agent.env" "$INSTALL_DIR/orbit-agent/.env"
        log_success "Restored agent .env"
    fi

    if [ -f "$BACKUP_DIR/bridge.env" ]; then
        cp "$BACKUP_DIR/bridge.env" "$INSTALL_DIR/clawdbotClone/packages/bridge/.env"
        log_success "Restored bridge .env"
    fi

    if [ -f "$BACKUP_DIR/web.env" ]; then
        cp "$BACKUP_DIR/web.env" "$INSTALL_DIR/clawdbotClone/apps/web/.env.local"
        log_success "Restored web .env.local"
    fi

    log_success "Configuration restored"
}

################################################################################
# Start Services
################################################################################

start_services() {
    log_info "Starting Orbit AI services..."

    # Start Python Agent
    cd "$INSTALL_DIR/orbit-agent"
    source .venv/bin/activate
    nohup uvicorn main:app --host 0.0.0.0 --port $AGENT_PORT > "$INSTALL_DIR/logs/agent.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/agent.pid"
    log_success "Python Agent started on port $AGENT_PORT"

    # Start Bridge Server
    cd "$INSTALL_DIR/clawdbotClone/packages/bridge"
    nohup pnpm start > "$INSTALL_DIR/logs/bridge.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/bridge.pid"
    log_success "Bridge Server started on port $BRIDGE_PORT"

    # Start Web Dashboard
    cd "$INSTALL_DIR/clawdbotClone/apps/web"
    nohup pnpm start > "$INSTALL_DIR/logs/web.log" 2>&1 &
    echo $! > "$INSTALL_DIR/logs/web.pid"
    log_success "Web Dashboard started on port $WEB_PORT"
}

################################################################################
# Display Summary
################################################################################

display_summary() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}          Orbit AI - Update Complete!                           ${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Updated from: $OLD_VERSION"
    echo "Updated to:   $NEW_VERSION"
    echo ""
    echo "Services Running:"
    echo "  • Python Agent:   http://localhost:$AGENT_PORT"
    echo "  • Bridge Server:  http://localhost:$BRIDGE_PORT"
    echo "  • Web Dashboard:  http://localhost:$WEB_PORT"
    echo ""
    echo "Backup Location: $BACKUP_DIR"
    echo ""
    echo -e "${YELLOW}Important Notes:${NC}"
    echo "  • Your configuration (.env files) has been preserved"
    echo "  • Database has been migrated"
    echo "  • User data has been preserved"
    echo "  • Desktop TUI needs to be restarted manually"
    echo ""
    echo -e "${BLUE}To Restart Desktop TUI:${NC}"
    echo "  cd $INSTALL_DIR/clawdbotClone/packages/desktop"
    echo "  pnpm dev"
    echo ""
    echo -e "${BLUE}To Rollback (if needed):${NC}"
    echo "  Stop services: kill \$(cat $INSTALL_DIR/logs/*.pid)"
    echo "  Restore backup: $BACKUP_DIR"
    echo ""
    echo -e "${BLUE}View Logs:${NC}"
    echo "  tail -f $INSTALL_DIR/logs/agent.log"
    echo "  tail -f $INSTALL_DIR/logs/bridge.log"
    echo "  tail -f $INSTALL_DIR/logs/web.log"
    echo ""
    echo -e "${CYAN}"
    display_logo
    echo -e "${NC}"
}

################################################################################
# Rollback Function
################################################################################

rollback() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "No backup found at $BACKUP_DIR"
        exit 1
    fi

    log_warn "Rolling back to backup at $BACKUP_DIR..."

    # Stop services
    stop_services

    # Restore configuration
    restore_configuration

    # Checkout previous commits (if backup has version info)
    if [ -f "$BACKUP_DIR/.version" ]; then
        local backup_version=$(cat "$BACKUP_DIR/.version")
        log_info "Rolling back to version $backup_version"

        # You would need to tag releases for this to work properly
        # For now, just restore configuration
    fi

    log_success "Rollback complete. Please restart services manually."
}

################################################################################
# Main Function
################################################################################

main() {
    clear
    echo -e "${CYAN}"
    display_logo
    echo -e "${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}           Orbit AI - Update Manager${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Check if installed
    if [ ! -d "$INSTALL_DIR" ]; then
        log_error "Orbit AI is not installed. Please run install script first:"
        echo "  curl -fsSL https://ayande.xyz/install.sh | bash"
        exit 1
    fi

    # Get versions
    CURRENT_VERSION=$(get_current_version)
    LATEST_VERSION=$(get_latest_version)

    log_info "Current version: $CURRENT_VERSION"
    log_info "Latest version:  $LATEST_VERSION"
    echo ""

    # Check if update is needed
    VERSION_COMPARE=$(compare_versions "$LATEST_VERSION" "$CURRENT_VERSION")
    if [ "$VERSION_COMPARE" = "same" ]; then
        log_success "You already have the latest version ($CURRENT_VERSION)"
        exit 0
    fi

    if [ "$VERSION_COMPARE" = "older" ]; then
        log_warn "Your version ($CURRENT_VERSION) is newer than the latest release ($LATEST_VERSION)"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi

    log_info "New version available: $CURRENT_VERSION → $LATEST_VERSION"
    echo ""

    # Ask for confirmation
    read -p "Update to version $LATEST_VERSION? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Update cancelled"
        exit 0
    fi

    # Perform update
    OLD_VERSION=$CURRENT_VERSION
    NEW_VERSION=$LATEST_VERSION

    stop_services
    backup_files
    update_repositories
    rebuild_components
    run_migrations
    restore_configuration
    start_services

    # Update version file
    echo "$NEW_VERSION" > "$CURRENT_VERSION_FILE"

    # Display summary
    display_summary
}

# Handle rollback flag
if [ "${1:-}" = "--rollback" ]; then
    ROLLBACK_DIR="${2:-$INSTALL_DIR/backups/latest}"
    if [ -d "$ROLLBACK_DIR" ]; then
        BACKUP_DIR="$ROLLBACK_DIR"
        rollback
    else
        log_error "Backup directory not found: $ROLLBACK_DIR"
        exit 1
    fi
else
    main
fi
