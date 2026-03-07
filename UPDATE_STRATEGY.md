# Orbit AI Update Strategy - Summary

## 🚀 User Update Flow (v1.0.0 → v2.0.0)

### Quick Update Command

Users simply run:

```bash
curl -fsSL https://ayande.xyz/update.sh | bash
```

That's it! The update script handles everything automatically.

---

## 📦 What Happens During Update

### Automatic Process

1. **Version Check**: Checks GitHub for latest release
2. **Backup**: Creates backup of all configuration and data
3. **Stop Services**: Safely stops all running services
4. **Update Code**: Pulls latest code from GitHub
5. **Update Dependencies**: Updates Python and Node.js packages
6. **Rebuild**: Rebuilds all components
7. **Migrate Database**: Runs database migrations
8. **Restore Config**: Restores user's .env files
9. **Restart Services**: Starts all services back up

### What's Preserved

✅ `.env` files (API keys, database URLs, OAuth credentials)
✅ Database data
✅ User files in `~/.orbit/data/`
✅ Logs
✅ SSH keys and credentials

### What's Updated

✅ Application code
✅ Python dependencies
✅ Node.js dependencies
✅ Database schema (via migrations)
✅ Configuration templates

---

## 🔄 Version Management

### Version File

- Location: `~/.orbit/.version`
- Content: Current installed version (e.g., "1.0.0")
- Updated by: install.sh and update.sh

### GitHub Tags

Releases are tagged on GitHub:

```
v1.0.0  - Initial release
v1.0.1  - Bug fixes
v1.1.0  - New features
v2.0.0  - Breaking changes
```

### Update Check

Update script checks GitHub API for latest release:

```bash
curl -s https://api.github.com/repos/ayan-de/clawdbotClone/releases/latest
```

---

## 🛡️ Safety Features

### Automatic Backups

Every update creates a backup:

```bash
~/.orbit/backups/20250307_120000/
├── agent.env              # Configuration backup
├── bridge.env             # Configuration backup
├── web.env                # Configuration backup
├── data/                  # Database backup
└── .version               # Version info
```

### Easy Rollback

If update fails, users can rollback:

```bash
# Automatic rollback
curl -fsSL https://ayande.xyz/update.sh | bash -s -- --rollback

# Manual rollback
cp ~/.orbit/backups/20250307_120000/*.env ~/.orbit/orbit-agent/.env
# ... restart services
```

### Confirmation Prompt

Update script always asks for confirmation:

```
Update to version 2.0.0? (y/N):
```

---

## 📋 Files for Updates

### Main Files

1. **`/public/update.sh`** - Update script (hosted at https://ayande.xyz/update.sh)
2. **`/apps/web/public/update.sh`** - Copy for web deployment
3. **`UPDATE_GUIDE.md`** - Complete update documentation

### Version Files

1. **`~/.orbit/.version`** - Current installed version (created by install.sh)

### Backup Locations

1. **`~/.orbit/backups/`** - All update backups

---

## 🎯 Update Commands Reference

### User Commands

```bash
# Check current version
cat ~/.orbit/.version

# Update to latest
curl -fsSL https://ayande.xyz/update.sh | bash

# Rollback
curl -fsSL https://ayande.xyz/update.sh | bash -s -- --rollback

# Check for updates (without updating)
curl -s https://api.github.com/repos/ayan-de/clawdbotClone/releases/latest | grep tag_name
```

### Developer Commands

```bash
# Create release tag
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0

# Update version in install.sh
# Change: ORBIT_VERSION="2.0.0"
```

---

## 📊 Version Update Flow

```
User runs update command
        ↓
Script checks GitHub for latest version
        ↓
New version available?
        ↓ Yes
Create backup
        ↓
Stop services
        ↓
git pull latest code
        ↓
Update dependencies
        ↓
Rebuild components
        ↓
Run migrations
        ↓
Restore configuration
        ↓
Restart services
        ↓
Update ~/.orbit/.version
        ↓
Update complete! ✅
```

---

## 🔧 Breaking Changes Handling

### Major Version Updates (v1 → v2)

For breaking changes:

1. **Clear documentation** in release notes
2. **Migration guide** provided
3. **Backward compatibility** where possible
4. **Graceful degradation** for old clients

### Example Breaking Change

If database schema changes significantly:

```sql
-- v2.0.0 migration
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- Provide fallback for old clients
-- Check version in application and handle accordingly
```

---

## 🚦 Update Rollout Strategy

### Gradual Rollout

For production:

1. **Canary Release**: Deploy to small subset of users
2. **Monitor**: Watch logs and metrics
3. **Expand**: Gradually increase rollout
4. **Full Rollout**: Deploy to all users

### Notification System

Users can be notified of updates:

```bash
# Add to crontab
0 9 * * * /usr/local/bin/orbit-check-updates

# Check script:
# - Fetches latest version
# - Compares with current
# - Sends email/slack notification
```

---

## 📝 What You Need to Do

### For v1.0.0 Launch

1. ✅ Install script saves version to `~/.orbit/.version`
2. ✅ Update script is ready at `/public/update.sh`
3. ✅ Documentation is complete (`UPDATE_GUIDE.md`)
4. ✅ Backup system is in place
5. ✅ Rollback mechanism is implemented

### For v2.0.0 Release

When you're ready for v2.0.0:

1. **Test update process** thoroughly
2. **Create release tag**: `git tag -a v2.0.0 -m "Release notes"`
3. **Push to GitHub**: `git push origin v2.0.0`
4. **Create GitHub release** with full notes
5. **Test update from v1.0.0 to v2.0.0**
6. **Test rollback** from v2.0.0 to v1.0.0
7. **Announce release** to users

---

## 🎉 Summary

Your update strategy is **ready for production**! Users can:

✅ Update with one command: `curl -fsSL https://ayande.xyz/update.sh | bash`
✅ Their configuration and data are preserved
✅ Automatic backups are created before each update
✅ Easy rollback if something goes wrong
✅ Clear documentation for troubleshooting

You as the developer can:

✅ Create version tags on GitHub
✅ Release updates via GitHub releases
✅ Track which version users have
✅ Provide migration guides for breaking changes

**All files are in place for v1.0.0 launch!**

---

**Version**: 1.0.0
**Last Updated**: 2026-03-07
