# Install Script Fixes & Corrections - v1.0.0

## Summary of Changes

This document details all the corrections made to the `install.sh` script for Orbit AI v1.0.0 deployment.

---

## Critical Fixes Applied

### 1. ✅ Repository Name Correction

**Issue**: Script referenced wrong repository name

**Before**:
```bash
CLAWDBOT_REPO="https://github.com/ayan-de/clawdbot.git"
```

**After**:
```bash
CLAWDBOT_REPO="https://github.com/ayan-de/clawdbotClone.git"
```

**Impact**: Installation would fail completely without this fix.

---

### 2. ✅ Framework Correction

**Issue**: Script referenced SvelteKit (wrong framework)

**Before**:
```bash
FRONTEND_PORT=5173  # SvelteKit default
```

**After**:
```bash
WEB_PORT=3001       # Next.js default
```

**Impact**: Port conflicts and incorrect service startup.

---

### 3. ✅ Package Manager Added

**Issue**: Script didn't check for or install `pnpm`

**Added**:
- Dependency check for `pnpm`
- Instructions to install pnpm via `npm install -g pnpm`

**Impact**: Monorepo would fail to install without pnpm.

---

### 4. ✅ Correct Entry Point for Python Agent

**Issue**: Wrong Python entry point command

**Before**:
```bash
ExecStart=$AGENT_DIR/.venv/bin/python -m src.main
```

**After**:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Impact**: Agent would not start correctly (FastAPI uses uvicorn).

---

### 5. ✅ Correct Directory Structure

**Issue**: Script assumed incorrect package locations

**Fixed**:
- Bridge: `packages/bridge` ✓ (was already correct)
- Web: `apps/web` ✓ (was already correct)
- Desktop: `packages/desktop` ✓ (was already correct)

**Note**: The directory structure was actually correct in the original script, but verified to ensure accuracy.

---

### 6. ✅ Added Database Setup Instructions

**Issue**: No database setup guidance

**Added**:
- Neon PostgreSQL setup instructions
- Database URL configuration
- Migration commands
- Interactive prompt for database setup

**Impact**: Without this, users wouldn't know how to set up the database.

---

### 7. ✅ Correct Environment File Locations

**Issue**: Some .env files were in wrong locations

**Fixed**:
- Agent: `~/.orbit/orbit-agent/.env` ✓
- Bridge: `~/.orbit/clawdbotClone/packages/bridge/.env` ✓
- Web: `~/.orbit/clawdbotClone/apps/web/.env.local` ✓ (was `.env`)

**Impact**: Services would fail to read configuration.

---

### 8. ✅ Added All Required Environment Variables

**Issue**: Missing critical environment variables

**Added**:
- `DATABASE_URL` for agent
- `NEON_DATABASE_URL` for bridge
- All OAuth credentials (Google, Gmail)
- `JWT_SECRET` for authentication
- `ENCRYPTION_KEY` for security
- `FRONTEND_URL`, `BRIDGE_URL`, `AGENT_API_URL`

**Impact**: Services would fail to start or function properly.

---

### 9. ✅ Correct Build Order

**Issue**: Dependencies not built in correct order

**Fixed**:
```bash
# Build order: common → bridge → desktop → web
cd packages/common && pnpm build && cd ../..
cd packages/bridge && pnpm build && cd ../..
cd packages/desktop && pnpm build && cd ../..
cd apps/web && pnpm build && cd ../..
```

**Impact**: Build failures due to dependency issues.

---

### 10. ✅ Added Desktop TUI Support

**Issue**: Desktop TUI was not built or started

**Added**:
- Desktop package build step
- Desktop port configuration (4000)
- Instructions to start desktop manually

**Impact**: Desktop component would be missing from installation.

---

### 11. ✅ Correct Service Startup Commands

**Issue**: Wrong startup commands for each service

**Fixed**:
```bash
# Python Agent (FastAPI)
uvicorn main:app --host 0.0.0.0 --port 8000

# Bridge (NestJS)
pnpm start  # runs node dist/main.js

# Web (Next.js)
pnpm start  # runs next start

# Desktop (TUI)
pnpm dev    # runs dev server
```

**Impact**: Services would fail to start.

---

### 12. ✅ Added Log File Management

**Issue**: No log directory setup

**Added**:
- Log directory creation
- PID file management
- Log file rotation hints
- Log viewing commands

**Impact**: Harder to debug issues without proper logging.

---

### 13. ✅ Improved User Experience

**Added**:
- Clear color-coded output
- Better error messages
- Interactive prompts
- Progress indicators
- Post-installation summary
- Next steps guidance

**Impact**: Better user experience and easier troubleshooting.

---

### 14. ✅ Added Security Warnings

**Added**:
- Warnings about API keys
- JWT secret generation
- Encryption key setup
- OAuth configuration guidance
- Security best practices

**Impact**: Users will configure services securely.

---

### 15. ✅ Added Troubleshooting Section

**Added**:
- Common issues and solutions
- Debug mode instructions
- Health check commands
- Port conflict resolution
- Database connection issues

**Impact**: Users can resolve issues independently.

---

## Port Assignments

| Service | Port | Previous | Status |
|---------|------|----------|--------|
| Python Agent | 8000 | 8000 | ✓ Correct |
| Bridge Server | 3000 | 3000 | ✓ Correct |
| Web Dashboard | 3001 | 5173 | ✓ Fixed |
| Desktop TUI | 4000 | - | ✓ Added |

---

## Repository URLs

| Component | URL | Status |
|-----------|-----|--------|
| Orbit Agent | https://github.com/ayan-de/orbit-agent.git | ✓ Correct |
| ClawdbotClone | https://github.com/ayan-de/clawdbotClone.git | ✓ Fixed |

---

## Files Updated

1. `/public/install.sh` - Main web installer
2. `/apps/web/public/install.sh` - Copy for web deployment
3. `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide (NEW)
4. `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist (NEW)

---

## Testing Checklist

Before deploying, verify:

- [ ] Repository URLs are correct
- [ ] Directory structure matches expectations
- [ ] All required ports are available (3000, 3001, 4000, 8000)
- [ ] Environment files are created in correct locations
- [ ] All environment variables are documented
- [ ] Build order respects dependencies
- [ ] Service startup commands are correct
- [ ] Log files are created and writable
- [ ] Database setup instructions are clear
- [ ] OAuth configuration is explained
- [ ] API key requirements are documented
- [ ] Security warnings are present
- [ ] Troubleshooting section is comprehensive

---

## Known Limitations

1. **Desktop TUI**: Must be started manually (interactive terminal)
2. **Database**: User must create account at Neon (or use local PostgreSQL)
3. **OAuth**: User must create Google Cloud project
4. **API Keys**: User must obtain own API keys from providers
5. **Production**: Additional setup required for SSL, reverse proxy, etc.

---

## Next Steps for Deployment

1. **Test the installer** in a clean environment
2. **Verify all services start** correctly
3. **Test database migrations** run successfully
4. **Test OAuth flow** with Google
5. **Test AI agent** with actual API keys
6. **Test Telegram bot** (if configured)
7. **Deploy web installer** to https://ayande.xyz/install.sh
8. **Update documentation** with any final changes

---

## Deployment Command

For users:
```bash
curl -fsSL https://ayande.xyz/install.sh | bash
```

This will:
- Check all dependencies
- Clone repositories
- Install and build all components
- Create environment files
- Prompt for database setup
- Optionally start all services
- Display next steps

---

## Support

If you encounter issues with the installer:

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Check `DEPLOYMENT_CHECKLIST.md` for step-by-step verification
3. Review logs in `~/.orbit/logs/`
4. Open an issue at: https://github.com/ayan-de/clawdbotClone/issues

---

**Version**: 1.0.0
**Last Updated**: 2026-03-07
**Status**: Ready for Deployment
