# Orbit AI v1.0.0 - Deployment Guide

Complete deployment guide for Orbit AI - an AI-powered terminal bot system with Next.js web dashboard, NestJS bridge, and Python agent.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Installation](#quick-installation)
5. [Manual Installation](#manual-installation)
6. [Configuration](#configuration)
7. [Database Setup](#database-setup)
8. [OAuth Configuration](#oauth-configuration)
9. [Telegram Bot Setup](#telegram-bot-setup)
10. [Service Management](#service-management)
11. [Troubleshooting](#troubleshooting)
12. [Security Best Practices](#security-best-practices)

---

## System Overview

Orbit AI is a distributed system consisting of four main components:

### Components

1. **Python Agent** (`orbit-agent`)
   - FastAPI-based AI service
   - LangGraph for agent workflow
   - Multi-LLM provider support (OpenAI, Anthropic, Google)
   - Port: 8000

2. **NestJS Bridge** (`packages/bridge`)
   - API server with authentication
   - Chat platform adapters (Telegram, with extensible pattern)
   - Session management
   - Port: 3000

3. **Next.js Web Dashboard** (`apps/web`)
   - User authentication (Google OAuth)
   - System overview
   - API interactions
   - Port: 3001

4. **Desktop TUI** (`packages/desktop`)
   - Terminal User Interface
   - Command execution
   - WebSocket client to bridge
   - Port: 4000

### Architecture Flow

```
User → Web Dashboard → NestJS Bridge → Python Agent
                    ↓           ↓
                 Desktop TUI → Shell Commands
                    ↓
              Chat Adapters (Telegram, etc.)
```

---

## Architecture

### Monorepo Structure

```
clawdbotClone/
├── packages/
│   ├── bridge/          # NestJS Bridge Server
│   ├── desktop/         # Desktop TUI Client
│   ├── common/          # Shared types and utilities
│   └── adapters/        # Chat platform adapters
└── apps/
    └── web/            # Next.js Web Dashboard

orbit-agent/            # Python Agent Service (separate repo)
```

### Communication

- **Web → Bridge**: HTTP (REST API)
- **Bridge → Agent**: HTTP (FastAPI)
- **Desktop → Bridge**: WebSocket
- **Chat Adapters → Bridge**: Webhooks
- **Bridge → Desktop**: WebSocket (command routing)

---

## Prerequisites

### System Requirements

- **OS**: Linux, macOS, or WSL (Windows)
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **pnpm**: Latest version (required for monorepo)
- **Git**: Latest version
- **PostgreSQL**: 12+ (Neon recommended for hosted solution)

### Required Tools

```bash
# Check versions
python3 --version    # >= 3.10
node --version       # >= 18
npm --version        # comes with node
pnpm --version       # latest
git --version        # latest
```

### Installation (if missing)

**macOS**:
```bash
brew install git python@3.11 node
npm install -g pnpm
```

**Linux/WSL**:
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update
sudo apt install -y git python3.11 python3.11-venv nodejs

# Install pnpm
npm install -g pnpm
```

---

## Quick Installation

### Automated Install Script

Run the following command to install all components:

```bash
curl -fsSL https://ayande.xyz/install.sh | bash
```

This script will:
1. Check system dependencies
2. Clone repositories
3. Install Python agent
4. Install monorepo packages
5. Build all components
6. Create environment files
7. Prompt for database setup
8. Optionally start all services

### Post-Install Configuration

After installation, you MUST configure:

1. **Database** (Neon PostgreSQL)
2. **API Keys** (OpenAI/Anthropic/Google)
3. **OAuth Credentials** (Google)
4. **Telegram Bot** (optional)

See the [Configuration](#configuration) section for details.

---

## Manual Installation

If you prefer manual installation or need to troubleshoot:

### 1. Clone Repositories

```bash
# Create installation directory
mkdir -p ~/.orbit
cd ~/.orbit

# Clone Orbit Agent
git clone https://github.com/ayan-de/orbit-agent.git

# Clone ClawdbotClone
git clone https://github.com/ayan-de/clawdbotClone.git
```

### 2. Install Python Agent

```bash
cd ~/.orbit/orbit-agent

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Install Monorepo Packages

```bash
cd ~/.orbit/clawdbotClone

# Install all dependencies
pnpm install

# Build packages in order
cd packages/common && pnpm build && cd ../..
cd packages/bridge && pnpm build && cd ../..
cd packages/desktop && pnpm build && cd ../..
cd apps/web && pnpm build && cd ../..
```

### 4. Create Log Directories

```bash
mkdir -p ~/.orbit/logs/{agent,bridge,web,desktop}
```

### 5. Configure Environment Files

See [Configuration](#configuration) section.

---

## Configuration

### Environment Variables Overview

You need to configure multiple `.env` files:

| Service | Environment File | Required Variables |
|---------|------------------|-------------------|
| Python Agent | `~/.orbit/orbit-agent/.env` | `DATABASE_URL`, API keys |
| NestJS Bridge | `~/.orbit/clawdbotClone/packages/bridge/.env` | `NEON_DATABASE_URL`, `JWT_SECRET`, OAuth |
| Web Dashboard | `~/.orbit/clawdbotClone/apps/web/.env.local` | `NEXT_PUBLIC_API_URL`, OAuth |

### Python Agent Configuration

File: `~/.orbit/orbit-agent/.env`

```bash
# Server Configuration
PORT=8000
DEBUG=true

# LLM Providers (Set at least one)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
DEFAULT_LLM_PROVIDER=openai

# Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Bridge
BRIDGE_URL=http://localhost:3000
BRIDGE_API_KEY=your-bridge-api-key

# Frontend
FRONTEND_URL=http://localhost:3001

# Email/Gmail (Optional)
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3001/auth/gmail/callback

# Encryption
ENCRYPTION_KEY=generate-32-character-random-string
```

### NestJS Bridge Configuration

File: `~/.orbit/clawdbotClone/packages/bridge/.env`

```bash
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Database (Neon PostgreSQL)
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Secret (Generate a secure random string)
JWT_SECRET=your-very-secure-random-string-at-least-32-characters-long
JWT_EXPIRATION=3600

# Google OAuth (for login)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Gmail OAuth (for email sending)
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3001/auth/gmail/callback

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
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

# Orbit Agent
AGENT_API_URL=http://localhost:8000
```

### Web Dashboard Configuration

File: `~/.orbit/clawdbotClone/apps/web/.env.local`

```bash
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DESKTOP_URL=http://localhost:4000

# Google OAuth (for authentication)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback/google

# JWT Secret (must match Bridge)
JWT_SECRET=your-very-secure-random-string-at-least-32-characters-long
```

---

## Database Setup

### Option 1: Neon PostgreSQL (Recommended)

Neon provides a free tier PostgreSQL database with automatic backups.

1. **Create Account**: Visit https://console.neon.tech/
2. **Create Project**: Click "New Project"
3. **Get Connection String**: Copy the connection string from the dashboard
4. **Update Configuration**:

```bash
# Update Python Agent
cd ~/.orbit/orbit-agent
nano .env
# Set: DATABASE_URL=your-neon-connection-string

# Update Bridge
cd ~/.orbit/clawdbotClone/packages/bridge
nano .env
# Set: NEON_DATABASE_URL=your-neon-connection-string
```

5. **Run Migrations**:

```bash
cd ~/.orbit/clawdbotClone/packages/bridge

# Run all migrations
pnpm migration:run

# Or create a new migration
pnpm migration:generate -d src/infrastructure/database/datasource.ts -n MigrationName
```

### Option 2: Local PostgreSQL

If you prefer a local database:

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib  # Linux
brew install postgresql                         # macOS

# Start PostgreSQL
sudo systemctl start postgresql                 # Linux
brew services start postgresql                  # macOS

# Create database
sudo -u postgres createdb orbit_bridge

# Create user and grant privileges
sudo -u postgres psql
> CREATE USER orbit_user WITH PASSWORD 'secure_password';
> GRANT ALL PRIVILEGES ON DATABASE orbit_bridge TO orbit_user;
> \q
```

Then update your `.env` files with:
```
DATABASE_URL=postgresql://orbit_user:secure_password@localhost/orbit_bridge
```

### Database Migrations

Migrations are managed by TypeORM in the Bridge package.

```bash
cd ~/.orbit/clawdbotClone/packages/bridge

# Run all pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Generate new migration
pnpm migration:generate -d src/infrastructure/database/datasource.ts -n MigrationName
```

---

## OAuth Configuration

### Google OAuth Setup

1. **Create Google Cloud Project**:
   - Visit: https://console.cloud.google.com/
   - Create a new project

2. **Enable OAuth**:
   - Go to: APIs & Services → Credentials
   - Create OAuth 2.0 Client ID

3. **Configure OAuth Consent Screen**:
   - Application type: Web application
   - Name: Orbit AI

4. **Add Authorized Redirect URIs**:
   - http://localhost:3001/auth/google/callback (for Bridge)
   - http://localhost:3001/api/auth/callback/google (for Web Dashboard)

5. **Copy Credentials**:
   - Client ID (starts with `xxx.apps.googleusercontent.com`)
   - Client Secret

6. **Update Configuration**:
   - Add to `~/.orbit/clawdbotClone/packages/bridge/.env`
   - Add to `~/.orbit/clawdbotClone/apps/web/.env.local`

### Gmail OAuth (Optional)

Same process as Google OAuth, but for Gmail API access:

1. **Enable Gmail API**:
   - Go to: APIs & Services → Library
   - Search "Gmail API" and enable it

2. **Use same OAuth credentials** from Google OAuth setup

3. **Update Configuration**:
   - Add `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` to agent's `.env`

---

## Telegram Bot Setup

### Create Telegram Bot

1. **Start BotFather**:
   - Open Telegram
   - Search for @BotFather
   - Send `/newbot`

2. **Configure Bot**:
   - Choose a name (e.g., "Orbit AI Assistant")
   - Choose a username (e.g., `orbit_ai_bot`)
   - BotFather will provide your bot token

3. **Set Webhook** (for production):
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhooks/telegram"}'
   ```

4. **Update Configuration**:
   ```bash
   # Edit ~/.orbit/clawdbotClone/packages/bridge/.env
   TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
   TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhooks/telegram
   ```

### Test Telegram Bot

Start the bridge server and send `/start` to your bot in Telegram.

---

## Service Management

### Start All Services

#### Development Mode

```bash
# Terminal 1: Python Agent
cd ~/.orbit/orbit-agent
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Bridge Server
cd ~/.orbit/clawdbotClone/packages/bridge
pnpm start

# Terminal 3: Web Dashboard
cd ~/.orbit/clawdbotClone/apps/web
pnpm start

# Terminal 4: Desktop TUI
cd ~/.orbit/clawdbotClone/packages/desktop
pnpm dev
```

#### Production Mode

Create a systemd service file for each component (Linux/WSL):

```bash
# ~/.config/systemd/user/orbit-agent.service
[Unit]
Description=Orbit AI Agent
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/$USER/.orbit/orbit-agent
ExecStart=/home/$USER/.orbit/orbit-agent/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

Enable and start services:
```bash
systemctl --user daemon-reload
systemctl --user enable orbit-agent.service
systemctl --user start orbit-agent.service
```

### Stop All Services

```bash
# If using background processes
kill $(cat ~/.orbit/logs/*.pid)

# If using systemd
systemctl --user stop orbit-agent orbit-bridge orbit-web
```

### View Logs

```bash
# Individual services
tail -f ~/.orbit/logs/agent.log
tail -f ~/.orbit/logs/bridge.log
tail -f ~/.orbit/logs/web.log

# Or all at once
tail -f ~/.orbit/logs/*.log

# Systemd logs
journalctl --user -u orbit-agent -f
```

### Restart All Services

```bash
# Stop and start
kill $(cat ~/.orbit/logs/*.pid)
cd ~/.orbit
# Then start services manually or via systemd
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :8000  # or 3000, 3001, 4000

# Kill the process
kill <PID>

# Or change ports in .env files
```

#### 2. Database Connection Failed

**Error**: `Connection refused` or `could not connect to server`

**Solution**:
- Verify `DATABASE_URL` is correct
- Ensure database is running
- Check firewall rules
- Verify SSL settings (most cloud DBs require `sslmode=require`)

#### 3. Migration Fails

**Error**: `Migration failed`

**Solution**:
```bash
# Check migration status
cd ~/.orbit/clawdbotClone/packages/bridge
ls -r src/migrations/

# Revert last migration
pnpm migration:revert

# Re-run
pnpm migration:run
```

#### 4. API Key Not Working

**Error**: `401 Unauthorized` or `Invalid API key`

**Solution**:
- Verify API keys are correct
- Check if API key has sufficient credits
- Ensure correct provider is set (`DEFAULT_LLM_PROVIDER`)

#### 5. OAuth Callback Fails

**Error**: `Redirect URI mismatch` or `Invalid client`

**Solution**:
- Ensure redirect URIs match exactly in Google Cloud Console
- Check that `GOOGLE_REDIRECT_URI` in `.env` matches console
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly

### Debug Mode

Enable debug logging:

```bash
# Agent .env
DEBUG=true

# Bridge .env
LOG_LEVEL=debug

# Next.js
# Run with: NODE_ENV=development pnpm dev
```

### Check Service Health

```bash
# Agent health
curl http://localhost:8000/health

# Bridge health
curl http://localhost:3000/health

# Web dashboard
curl http://localhost:3001/
```

---

## Security Best Practices

### 1. Environment Variables

- **Never commit `.env` files** to version control
- Use strong, random strings for secrets
- Rotate API keys regularly
- Use different secrets for development and production

### 2. JWT Secrets

Generate secure JWT secrets:
```bash
# Generate 32+ character random string
openssl rand -base64 32
```

### 3. Database Security

- Use SSL connections (`sslmode=require`)
- Limit database user privileges
- Use read-only users where possible
- Regular backups

### 4. API Security

- Use CORS restrictions (set `CORS_ORIGIN` to your domain)
- Implement rate limiting (already configured)
- Use HTTPS in production
- Never expose API keys in client-side code

### 5. OAuth Security

- Use HTTP-only cookies for tokens
- Implement PKCE for OAuth flow
- Validate redirect URIs
- Short-lived access tokens with refresh tokens

### 6. Production Deployment

For production deployment:

1. **Use Environment Variables**: Never hardcode secrets
2. **Reverse Proxy**: Use nginx/caddy for SSL termination
3. **Process Manager**: Use PM2 or systemd
4. **Monitoring**: Set up logging and monitoring
5. **Backups**: Regular database backups
6. **Updates**: Keep dependencies updated

---

## Production Deployment

### Deploy to VPS (e.g., DigitalOcean, Linode)

1. **Set up VPS**: Ubuntu 20.04+ LTS recommended
2. **Install Dependencies**: Follow [Prerequisites](#prerequisites)
3. **Clone Repositories**: Use SSH keys for Git
4. **Configure Environment**: Set production values
5. **Set up Database**: Use Neon or managed PostgreSQL
6. **Set up SSL**: Use Let's Encrypt with Certbot
7. **Configure Reverse Proxy**: nginx example:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       location /api/ {
           proxy_pass http://localhost:3000;
       }

       location / {
           proxy_pass http://localhost:3001;
       }
   }
   ```

### Deploy to Cloud (AWS, GCP, Azure)

1. **Use Managed Services**:
   - Database: RDS, Cloud SQL, or Neon
   - Container: EKS, GKE, or Cloud Run
   - Load Balancer: ALB, Cloud Load Balancing

2. **Infrastructure as Code**:
   - Use Terraform or CloudFormation
   - Store secrets in Parameter Store or Secrets Manager

---

## Support and Resources

- **Documentation**: Check repo README files
- **Issues**: https://github.com/ayan-de/clawdbotClone/issues
- **Community**: Join our Discord (link in README)

---

## Version History

- **v1.0.0** (2026-03-07): Initial production release

---

## License

See individual repository licenses.

---

**Last Updated**: 2026-03-07
