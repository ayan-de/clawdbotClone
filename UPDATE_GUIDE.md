# Orbit AI - Update Guide

Complete guide for updating Orbit AI to new versions.

---

## Table of Contents

1. [Automatic Updates](#automatic-updates)
2. [Manual Updates](#manual-updates)
3. [Rollback](#rollback)
4. [Version Management](#version-management)
5. [Breaking Changes](#breaking-changes)
6. [Troubleshooting](#troubleshooting)

---

## Automatic Updates

### Quick Update Command

To update Orbit AI to the latest version:

```bash
curl -fsSL https://ayande.xyz/update.sh | bash
```

This will:
- ✅ Check for new versions
- ✅ Create backup of your configuration and data
- ✅ Stop all services
- ✅ Pull latest code from GitHub
- ✅ Update dependencies
- ✅ Rebuild all components
- ✅ Run database migrations
- ✅ Restore your configuration
- ✅ Restart all services

### What Gets Preserved

The update process preserves:
- ✅ All `.env` configuration files
- ✅ Database data
- ✅ User files in `~/.orbit/data/`
- ✅ Logs
- ✅ SSH keys and credentials

### What Gets Updated

- ✅ Application code
- ✅ Python dependencies
- ✅ Node.js dependencies
- ✅ Database schema (via migrations)
- ✅ Configuration files (with backup)

---

## Manual Updates

If you prefer manual control or the automatic update fails:

### Step 1: Backup Your Data

```bash
# Create backup directory
BACKUP_DIR="$HOME/.orbit/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup configuration files
cp ~/.orbit/orbit-agent/.env "$BACKUP_DIR/agent.env"
cp ~/.orbit/clawdbotClone/packages/bridge/.env "$BACKUP_DIR/bridge.env"
cp ~/.orbit/clawdbotClone/apps/web/.env.local "$BACKUP_DIR/web.env"

# Backup database data (if local)
cp -r ~/.orbit/clawdbotClone/packages/bridge/data "$BACKUP_DIR/"

# Backup user data
cp -r ~/.orbit/data "$BACKUP_DIR/"
```

### Step 2: Stop Services

```bash
# Kill all Orbit AI processes
kill $(cat ~/.orbit/logs/*.pid) 2>/dev/null || true

# Or kill by port
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
```

### Step 3: Update Code

```bash
# Update Orbit Agent
cd ~/.orbit/orbit-agent
git fetch origin
git pull origin main

# Update ClawdbotClone
cd ~/.orbit/clawdbotClone
git fetch origin
git pull origin main
```

### Step 4: Update Dependencies

```bash
# Update Python dependencies
cd ~/.orbit/orbit-agent
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Update Node.js dependencies
cd ~/.orbit/clawdbotClone
pnpm install
```

### Step 5: Rebuild Components

```bash
cd ~/.orbit/clawdbotClone

# Rebuild packages
cd packages/common && pnpm build && cd ../..
cd packages/bridge && pnpm build && cd ../..
cd packages/desktop && pnpm build && cd ../..
cd apps/web && pnpm build && cd ../..
```

### Step 6: Run Database Migrations

```bash
cd ~/.orbit/clawdbotClone/packages/bridge
pnpm migration:run
```

### Step 7: Start Services

```bash
# Start Python Agent
cd ~/.orbit/orbit-agent
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Start Bridge Server
cd ~/.orbit/clawdbotClone/packages/bridge
pnpm start &

# Start Web Dashboard
cd ~/.orbit/clawdbotClone/apps/web
pnpm start &

# Start Desktop TUI (in separate terminal)
cd ~/.orbit/clawdbotClone/packages/desktop
pnpm dev
```

---

## Rollback

If something goes wrong after an update, you can rollback to a previous version.

### Automatic Rollback

```bash
# Rollback to the latest backup
curl -fsSL https://ayande.xyz/update.sh | bash -s -- --rollback

# Or rollback to a specific backup
curl -fsSL https://ayande.xyz/update.sh | bash -s -- --rollback ~/.orbit/backups/20250307_120000
```

### Manual Rollback

#### Step 1: Stop Services

```bash
kill $(cat ~/.orbit/logs/*.pid) 2>/dev/null || true
```

#### Step 2: List Available Backups

```bash
ls -la ~/.orbit/backups/
```

#### Step 3: Restore Configuration

```bash
# Choose a backup directory
BACKUP_DIR="~/.orbit/backups/20250307_120000"

# Restore configuration files
cp "$BACKUP_DIR/agent.env" ~/.orbit/orbit-agent/.env
cp "$BACKUP_DIR/bridge.env" ~/.orbit/clawdbotClone/packages/bridge/.env
cp "$BACKUP_DIR/web.env" ~/.orbit/clawdbotClone/apps/web/.env.local

# Restore database data (if needed)
cp -r "$BACKUP_DIR/data" ~/.orbit/clawdbotClone/packages/bridge/
```

#### Step 4: Rollback Code

```bash
# Check available tags
cd ~/.orbit/orbit-agent
git tag

# Checkout specific version
git checkout v1.0.0

cd ~/.orbit/clawdbotClone
git tag
git checkout v1.0.0
```

#### Step 5: Rebuild and Restart

```bash
# Rebuild components
cd ~/.orbit/clawdbotClone
pnpm install
cd packages/common && pnpm build && cd ../..
cd packages/bridge && pnpm build && cd ../..
cd packages/desktop && pnpm build && cd ../..
cd apps/web && pnpm build && cd ../..

# Restart services
cd ~/.orbit/orbit-agent
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &

cd ~/.orbit/clawdbotClone/packages/bridge
pnpm start &

cd ~/.orbit/clawdbotClone/apps/web
pnpm start &
```

---

## Version Management

### Check Current Version

```bash
# Check installed version
cat ~/.orbit/.version

# Check latest version available
curl -s https://api.github.com/repos/ayan-de/clawdbotClone/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/'
```

### Version Tags

Version tags follow semantic versioning: `vX.Y.Z`

- **X**: Major version (breaking changes)
- **Y**: Minor version (new features)
- **Z**: Patch version (bug fixes)

Examples:
- `v1.0.0` - Initial release
- `v1.0.1` - Bug fix
- `v1.1.0` - New features
- `v2.0.0` - Breaking changes

### Update to Specific Version

```bash
# Update Orbit Agent to specific version
cd ~/.orbit/orbit-agent
git fetch --tags
git checkout v1.1.0

# Update ClawdbotClone to specific version
cd ~/.orbit/clawdbotClone
git fetch --tags
git checkout v1.1.0

# Rebuild components (see manual update steps)
```

---

## Breaking Changes

### Major Version Updates (v1.0.0 → v2.0.0)

Major version updates may include breaking changes:

#### Database Schema Changes

- New migrations may require manual intervention
- Some data may need to be migrated manually
- Always backup before updating major versions

#### Configuration Changes

- New environment variables may be required
- Some existing variables may be renamed or removed
- Check release notes for configuration changes

#### API Changes

- REST API endpoints may change
- WebSocket message formats may change
- Desktop TUI protocol may change

### How to Prepare for Major Updates

1. **Read Release Notes**: Always check GitHub release notes
2. **Backup Everything**: Create full backup before updating
3. **Test in Development**: Test updates in a development environment first
4. **Update Configuration**: Add new environment variables as needed
5. **Run Migrations**: Run database migrations after update
6. **Monitor Logs**: Check logs for any issues after update

---

## Troubleshooting

### Update Fails with "Git Pull" Error

**Problem**: Cannot pull latest code

**Solution**:
```bash
cd ~/.orbit/orbit-agent
git status
# If there are uncommitted changes, stash them
git stash
git pull origin main
# Apply stash if needed
git stash pop
```

### Update Fails with "Migration Error"

**Problem**: Database migration fails

**Solution**:
```bash
# Check migration status
cd ~/.orbit/clawdbotClone/packages/bridge
pnpm migration:show

# Revert last migration
pnpm migration:revert

# Try again
pnpm migration:run
```

### Update Fails with "Build Error"

**Problem**: Package build fails

**Solution**:
```bash
# Clear build artifacts
cd ~/.orbit/clawdbotClone
rm -rf node_modules
rm -rf */node_modules
rm -rf */dist

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

### Services Won't Start After Update

**Problem**: Services fail to start

**Solution**:
```bash
# Check logs
tail -f ~/.orbit/logs/agent.log
tail -f ~/.orbit/logs/bridge.log
tail -f ~/.orbit/logs/web.log

# Check for port conflicts
lsof -i:8000
lsof -i:3000
lsof -i:3001

# Kill conflicting processes
lsof -ti:8000 | xargs kill -9
```

### Configuration Lost After Update

**Problem**: .env files are missing

**Solution**:
```bash
# Restore from backup
BACKUP_DIR="~/.orbit/backups/latest"
cp "$BACKUP_DIR/agent.env" ~/.orbit/orbit-agent/.env
cp "$BACKUP_DIR/bridge.env" ~/.orbit/clawdbotClone/packages/bridge/.env
cp "$BACKUP_DIR/web.env" ~/.orbit/clawdbotClone/apps/web/.env.local

# Restart services
```

### Database Connection Failed After Update

**Problem**: Cannot connect to database

**Solution**:
```bash
# Check .env file has correct DATABASE_URL
cat ~/.orbit/orbit-agent/.env | grep DATABASE_URL
cat ~/.orbit/clawdbotClone/packages/bridge/.env | grep NEON_DATABASE_URL

# Test database connection
psql "$DATABASE_URL"

# If using Neon, check console for connection status
```

---

## Update Schedule

### Recommended Update Frequency

- **Patch Updates** (vX.Y.Z): Update immediately - contains bug fixes
- **Minor Updates** (vX.Y.0): Update within a week - contains new features
- **Major Updates** (vX.0.0): Update after testing - contains breaking changes

### Auto-Update Option

For production environments, consider setting up a cron job to check for updates:

```bash
# Add to crontab
crontab -e

# Check for updates daily at 2 AM
0 2 * * * /path/to/check_update.sh
```

Where `check_update.sh` is a script that:
1. Checks if new version is available
2. Sends notification if update is available
3. Optionally runs update (if automated)

---

## Developer Guide: Creating Updates

### How to Release a New Version

#### 1. Update Version Numbers

```bash
# Update version in package.json files
cd packages/bridge
# Update "version": "1.0.0" → "1.0.1"

cd apps/web
# Update "version": "0.1.0" → "0.1.1"

cd ../..
```

#### 2. Tag the Release

```bash
# Tag the release
git tag -a v1.0.1 -m "Release v1.0.1 - Bug fixes and improvements"

# Push tags
git push origin v1.0.1
```

#### 3. Create GitHub Release

1. Go to GitHub releases page
2. Click "Draft a new release"
3. Choose the tag (v1.0.1)
4. Write release notes
5. Publish release

#### 4. Update Install Script

If there are breaking changes, update the install script to handle them.

---

## Best Practices

### Before Updating

- [ ] Read release notes for breaking changes
- [ ] Backup all data and configuration
- [ ] Test in development environment
- [ ] Update documentation if needed

### During Update

- [ ] Monitor logs for errors
- [ ] Verify database migrations complete
- [ ] Check services start successfully
- [ ] Test basic functionality

### After Update

- [ ] Verify all features work
- [ ] Check database integrity
- [ ] Update any custom scripts
- [ ] Document any issues encountered

---

## Support

If you encounter issues with updates:

1. Check logs: `~/.orbit/logs/`
2. Check GitHub Issues: https://github.com/ayan-de/clawdbotClone/issues
3. Check release notes: https://github.com/ayan-de/clawdbotClone/releases
4. Rollback if necessary (see Rollback section)

---

**Version**: 1.0.0
**Last Updated**: 2026-03-07
