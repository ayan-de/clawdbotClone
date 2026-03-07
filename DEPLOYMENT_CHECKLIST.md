# Orbit AI v1.0.0 - Deployment Checklist

Use this checklist to ensure a successful deployment.

---

## Pre-Deployment Checks

- [ ] System has Python 3.10+ installed
- [ ] System has Node.js 18+ installed
- [ ] System has pnpm installed (`npm install -g pnpm`)
- [ ] System has Git installed
- [ ] At least 2GB free disk space available
- [ ] Ports 3000, 3001, 4000, 8000 are available

---

## Quick Install (Automated)

- [ ] Run: `curl -fsSL https://ayande.xyz/install.sh | bash`
- [ ] Wait for installation to complete
- [ ] Review installation summary

---

## Configuration Checklist

### Database Setup (REQUIRED)

- [ ] Created Neon PostgreSQL account at https://console.neon.tech/
- [ ] Created a new project
- [ ] Copied connection string
- [ ] Updated `~/.orbit/orbit-agent/.env` with `DATABASE_URL`
- [ ] Updated `~/.orbit/clawdbotClone/packages/bridge/.env` with `NEON_DATABASE_URL`
- [ ] Ran migrations: `cd ~/.orbit/clawdbotClone/packages/bridge && pnpm migration:run`

### AI Provider Setup (REQUIRED)

Choose at least one:

#### OpenAI
- [ ] Created API key at https://platform.openai.com/
- [ ] Updated `~/.orbit/orbit-agent/.env` with `OPENAI_API_KEY`
- [ ] Set `DEFAULT_LLM_PROVIDER=openai`

#### Anthropic (Claude)
- [ ] Created API key at https://console.anthropic.com/
- [ ] Updated `~/.orbit/orbit-agent/.env` with `ANTHROPIC_API_KEY`
- [ ] Set `DEFAULT_LLM_PROVIDER=anthropic`

#### Google (Gemini)
- [ ] Created API key at https://makersuite.google.com/
- [ ] Updated `~/.orbit/orbit-agent/.env` with `GOOGLE_API_KEY`
- [ ] Set `DEFAULT_LLM_PROVIDER=gemini`

### Authentication Setup (REQUIRED for Web Dashboard)

- [ ] Created Google Cloud project at https://console.cloud.google.com/
- [ ] Enabled Google+ API
- [ ] Created OAuth 2.0 Client ID
- [ ] Added authorized redirect URIs:
  - [ ] `http://localhost:3001/auth/google/callback`
  - [ ] `http://localhost:3001/api/auth/callback/google`
- [ ] Copied Client ID and Client Secret
- [ ] Updated `~/.orbit/clawdbotClone/packages/bridge/.env`:
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REDIRECT_URI`
- [ ] Updated `~/.orbit/clawdbotClone/apps/web/.env.local`:
  - [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REDIRECT_URI`

### Security Setup

- [ ] Generated secure JWT secret (`openssl rand -base64 32`)
- [ ] Updated `~/.orbit/clawdbotClone/packages/bridge/.env` with `JWT_SECRET`
- [ ] Updated `~/.orbit/clawdbotClone/apps/web/.env.local` with same `JWT_SECRET`
- [ ] Generated encryption key for agent
- [ ] Updated `~/.orbit/orbit-agent/.env` with `ENCRYPTION_KEY`

### Telegram Bot (OPTIONAL)

Skip if you don't need Telegram integration.

- [ ] Created bot via @BotFather in Telegram
- [ ] Copied bot token
- [ ] Updated `~/.orbit/clawdbotClone/packages/bridge/.env` with `TELEGRAM_BOT_TOKEN`
- [ ] Set `TELEGRAM_WEBHOOK_URL` if deploying to production

---

## Service Startup

### Development Mode

- [ ] Terminal 1: Start Python Agent
  ```bash
  cd ~/.orbit/orbit-agent
  source .venv/bin/activate
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```

- [ ] Terminal 2: Start Bridge Server
  ```bash
  cd ~/.orbit/clawdbotClone/packages/bridge
  pnpm start
  ```

- [ ] Terminal 3: Start Web Dashboard
  ```bash
  cd ~/.orbit/clawdbotClone/apps/web
  pnpm start
  ```

- [ ] Terminal 4: Start Desktop TUI
  ```bash
  cd ~/.orbit/clawdbotClone/packages/desktop
  pnpm dev
  ```

### Verify Services Are Running

- [ ] Check Python Agent: `curl http://localhost:8000/health`
- [ ] Check Bridge: `curl http://localhost:3000/health`
- [ ] Check Web: Open browser to http://localhost:3001
- [ ] Check logs: `tail -f ~/.orbit/logs/*.log`

---

## Post-Deployment Testing

### Web Dashboard

- [ ] Navigate to http://localhost:3001
- [ ] Click "Sign up with Google"
- [ ] Complete OAuth flow
- [ ] Verify user is logged in

### Desktop TUI

- [ ] Start Desktop TUI in terminal
- [ ] Verify connection to bridge
- [ ] Test a simple command (e.g., `ls`)
- [ ] Verify output appears

### AI Agent

- [ ] Send test message to agent
- [ ] Verify AI response
- [ ] Test command generation
- [ ] Verify command execution

### Telegram Bot (if configured)

- [ ] Start conversation with your bot
- [ ] Send `/start` command
- [ ] Verify welcome message
- [ ] Send a test command
- [ ] Verify response

---

## Troubleshooting

If something doesn't work:

1. **Check logs**:
   ```bash
   tail -f ~/.orbit/logs/agent.log
   tail -f ~/.orbit/logs/bridge.log
   tail -f ~/.orbit/logs/web.log
   ```

2. **Check ports**:
   ```bash
   lsof -i :8000
   lsof -i :3000
   lsof -i :3001
   lsof -i :4000
   ```

3. **Check environment variables**:
   ```bash
   # Verify .env files exist and have values
   cat ~/.orbit/orbit-agent/.env
   cat ~/.orbit/clawdbotClone/packages/bridge/.env
   cat ~/.orbit/clawdbotClone/apps/web/.env.local
   ```

4. **Check database**:
   ```bash
   cd ~/.orbit/clawdbotClone/packages/bridge
   pnpm migration:run
   ```

5. **Common issues**:
   - [ ] Port already in use → Kill process or change port
   - [ ] Database connection failed → Check DATABASE_URL
   - [ ] API key not working → Verify key and provider
   - [ ] OAuth fails → Check redirect URIs match exactly

---

## Production Deployment (Optional)

If deploying to production:

- [ ] Set up VPS or cloud provider
- [ ] Configure domain name and DNS
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure reverse proxy (nginx/caddy)
- [ ] Set up systemd services for auto-restart
- [ ] Configure monitoring and logging
- [ ] Set up backups
- [ ] Update all URLs from `localhost` to your domain
- [ ] Set proper CORS origins
- [ ] Configure firewall rules

---

## Resources

- **Full Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Project README**: `README.md`
- **Issues**: https://github.com/ayan-de/clawdbotClone/issues
- **Neon DB**: https://console.neon.tech/
- **Google Cloud Console**: https://console.cloud.google.com/

---

## Quick Commands Reference

```bash
# Stop all services
kill $(cat ~/.orbit/logs/*.pid)

# Start all services (manual)
cd ~/.orbit/orbit-agent && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 &
cd ~/.orbit/clawdbotClone/packages/bridge && pnpm start &
cd ~/.orbit/clawdbotClone/apps/web && pnpm start &
cd ~/.orbit/clawdbotClone/packages/desktop && pnpm dev &

# View logs
tail -f ~/.orbit/logs/agent.log
tail -f ~/.orbit/logs/bridge.log
tail -f ~/.orbit/logs/web.log

# Run migrations
cd ~/.orbit/clawdbotClone/packages/bridge
pnpm migration:run

# Update repositories
cd ~/.orbit/orbit-agent && git pull
cd ~/.orbit/clawdbotClone && git pull
```

---

**Version**: 1.0.0
**Last Updated**: 2026-03-07
