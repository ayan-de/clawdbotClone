# 🛠️ Auto-Installation Feature - Summary

## ✅ Dependencies Now Install Automatically!

The install script now **automatically installs** all required dependencies if they're missing.

---

## 📦 What Gets Auto-Installed

The script checks for and installs:

| Dependency | Version Required | Auto-Installs? |
|------------|------------------|----------------|
| **Git** | Latest | ✅ Yes |
| **Python** | 3.10 or higher | ✅ Yes (prefers 3.11) |
| **Node.js** | 18 LTS or higher | ✅ Yes |
| **npm** | Latest (comes with Node.js) | ✅ Yes |
| **pnpm** | Latest | ✅ Yes |

---

## 🎯 How It Works

### 1. Dependency Check

```bash
curl -fsSL https://ayande.xyz/install.sh | bash
```

**What happens:**
```
[INFO] Checking dependencies...
[INFO] ✓ git version 2.34.1
[WARN] Python 3 not found, will install...
[WARN] Node.js not found, will install...
[WARN] pnpm not found, will install...
```

### 2. Installation Process

**For each missing dependency:**

```bash
[INFO] Installing Python 3.10+...
# Automatically runs:
# sudo apt update
# sudo apt install -y python3.11 python3.11-venv
[SUCCESS] Python 3.11 installed

[INFO] Installing Node.js 18+...
# Automatically runs:
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt install -y nodejs
[SUCCESS] Node.js v20.11.0 installed

[INFO] Installing pnpm...
# Automatically runs:
# npm install -g pnpm
[SUCCESS] pnpm 8.15.1 installed
```

### 3. Final Verification

```
[INFO] Verifying all dependencies...
[SUCCESS] All dependencies installed and verified!
```

---

## 🔧 Installation Methods by OS

### macOS

| Dependency | Method | Command |
|-----------|--------|---------|
| Git | Homebrew | `brew install git` |
| Python 3.11 | Homebrew | `brew install python@3.11` |
| Node.js 20 | Homebrew | `brew install node` |
| pnpm | npm | `npm install -g pnpm` |

**Requirement:** Homebrew must be installed

**If Homebrew is missing:**
```
[ERROR] Homebrew not found. Please install from https://brew.sh
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Linux (Ubuntu/Debian)

| Dependency | Method | Command |
|-----------|--------|---------|
| Git | apt | `sudo apt install -y git` |
| Python 3.11 | apt + PPA | `sudo add-apt-repository -y ppa:deadsnakes/ppa`<br>`sudo apt install -y python3.11 python3.11-venv` |
| Node.js 20 | NodeSource | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash -`<br>`sudo apt install -y nodejs` |
| pnpm | npm | `npm install -g pnpm` |

### WSL (Windows Subsystem for Linux)

Same as Linux, but **without** PPA (WSL doesn't always support it):

| Dependency | Method | Command |
|-----------|--------|---------|
| Git | apt | `sudo apt install -y git` |
| Python 3.11 | apt | `sudo apt install -y python3.11 python3.11-venv` |
| Node.js 20 | NodeSource | Same as Linux |
| pnpm | npm | Same as Linux |

---

## 📋 Version Requirements

### Python

- **Minimum:** Python 3.10
- **Recommended:** Python 3.11
- **Auto-install:** Python 3.11 (preferred), falls back to 3.10

### Node.js

- **Minimum:** Node.js 18 LTS
- **Recommended:** Node.js 20 LTS
- **Auto-install:** Node.js 20 LTS

### pnpm

- **Minimum:** Latest version
- **Auto-install:** Latest via npm

---

## 🎯 Smart Detection

The script uses **smart version detection**:

### Example 1: All Dependencies Present

```
[INFO] Checking dependencies...
[INFO] ✓ git version 2.34.1
[INFO] ✓ Python 3.11.7
[INFO] ✓ Node.js v20.11.0
[INFO] ✓ npm 10.2.4
[INFO] ✓ pnpm 8.15.1
[SUCCESS] All dependencies installed and verified!
```

### Example 2: Python Too Old

```
[INFO] Checking dependencies...
[INFO] ✓ git version 2.34.1
[WARN] Python 3.8.10 found, but Python 3.10+ is required. Will install...
[INFO] Installing Python 3.10+...
[SUCCESS] Python 3.11 installed
...
```

### Example 3: Node.js Too Old

```
[INFO] Checking dependencies...
...
[INFO] ✓ Node.js v16.20.0
[WARN] v16.20.0 found, but Node.js 18+ is required. Will install...
[INFO] Installing Node.js 18+...
[SUCCESS] Node.js v20.11.0 installed
...
```

---

## 🔐 Permissions Required

### Linux/WSL

The script uses `sudo` for package installation:
- `sudo apt update`
- `sudo apt install -y ...`
- `sudo add-apt-repository -y ...`

**User will be prompted for sudo password** if needed.

### macOS

The script uses Homebrew:
- `brew install ...`

**May prompt for sudo password** depending on Homebrew configuration.

---

## ⚠️ Limitations

### 1. Homebrew Required on macOS

If Homebrew is not installed:
```
[ERROR] Homebrew not found. Please install from https://brew.sh
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Solution:** User must install Homebrew first, then re-run the installer.

### 2. Ubuntu/Debian Only (for Linux)

The script uses `apt` package manager:
- Works on: Ubuntu, Debian, Linux Mint
- **Does NOT work on:** Fedora, CentOS, Arch Linux, etc.

**Solution:** Users on other distros must install dependencies manually.

### 3. Network Required

All installations require internet access:
- Git: apt / brew
- Python: apt / brew
- Node.js: NodeSource repository / brew
- pnpm: npm registry

---

## 🔄 What Changed

### Before (Old Behavior)

```bash
[INFO] Checking dependencies...
[ERROR] Missing dependencies: git python3 nodejs pnpm

Please install missing dependencies:

  # Install Node.js 18+
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y git python3.11 python3.11-venv nodejs

  # Install pnpm
  npm install -g pnpm

[EXIT] Script exits
```

### After (New Behavior)

```bash
[INFO] Checking dependencies...
[WARN] Git not found, will install...
[INFO] Installing Git...
[SUCCESS] Git installed
[WARN] Python 3 not found, will install...
[INFO] Installing Python 3.10+...
[SUCCESS] Python 3.11 installed
[WARN] Node.js not found, will install...
[INFO] Installing Node.js 18+...
[SUCCESS] Node.js v20.11.0 installed
[WARN] pnpm not found, will install...
[INFO] Installing pnpm...
[SUCCESS] pnpm 8.15.1 installed
[SUCCESS] All dependencies installed and verified!
[CONTINUE] Installation continues...
```

---

## 🚀 User Experience

### For New Users (No Dependencies)

```bash
curl -fsSL https://ayande.xyz/install.sh | bash
```

**Experience:**
1. ✅ Script checks for dependencies
2. ✅ Installs all missing dependencies automatically
3. ✅ Verifies installations
4. ✅ Continues with Orbit AI installation
5. ✅ User has a complete working system

**Time:** ~5-10 minutes (depending on internet speed)

### For Users With Some Dependencies

```bash
curl -fsSL https://ayande.xyz/install.sh | bash
```

**Experience:**
1. ✅ Script checks for dependencies
2. ✅ Only installs what's missing
3. ✅ Upgrades old versions if needed
4. ✅ Continues with Orbit AI installation

**Time:** ~2-5 minutes

### For Users With All Dependencies

```bash
curl -fsSL https://ayande.xyz/install.sh | bash
```

**Experience:**
1. ✅ Script checks for dependencies
2. ✅ Verifies all are correct versions
3. ✅ Skips installation, continues immediately

**Time:** ~1 minute

---

## 💡 Benefits

### For Users

✅ **No manual setup** - Everything installs automatically
✅ **Version safety** - Ensures correct versions
✅ **Time saving** - No research needed
✅ **Beginner friendly** - Works out of the box
✅ **Consistent** - Same process for everyone

### For You

✅ **Fewer support issues** - Auto-install reduces errors
✅ **Better adoption** - Easier for new users
✅ **Consistent environment** - Everyone has same versions
✅ **Professional** - Shows attention to detail

---

## 📊 Comparison Table

| Feature | Before | After |
|---------|--------|-------|
| **Dependency Check** | ✅ Yes | ✅ Yes |
| **Auto-Install** | ❌ No | ✅ Yes |
| **Version Verification** | ❌ No | ✅ Yes |
| **OS-Specific Install** | ❌ No | ✅ Yes |
| **Smart Fallbacks** | ❌ No | ✅ Yes |
| **Final Verification** | ❌ No | ✅ Yes |
| **User Experience** | ⚠️ Manual | ✅ Automatic |

---

## 🎯 What's Included

### New Functions Added

| Function | Purpose |
|----------|---------|
| `install_git()` | Installs Git via apt/brew |
| `install_python()` | Installs Python 3.10+ via apt/brew |
| `install_nodejs()` | Installs Node.js 18+ via NodeSource/brew |
| `install_pnpm()` | Installs pnpm via npm |
| `check_dependencies()` | Checks, installs, and verifies all |

### Features

✅ **Smart version detection** - Checks if installed version meets requirements
✅ **Graceful fallbacks** - Tries alternative versions/methods
✅ **Final verification** - Confirms all dependencies work
✅ **Clear messages** - Users see exactly what's happening
✅ **OS detection** - Different methods for macOS/Linux/WSL

---

## 🚨 Error Handling

### Installation Failed

If installation fails:

```
[ERROR] Python installation failed. Please install manually.
```

**User action:** Install the dependency manually and re-run the script.

### Permission Denied

If sudo fails:

```
[ERROR] Permission denied. Please run with sudo privileges.
```

**User action:** Ensure user has sudo access.

### Network Error

If download fails:

```
[ERROR] Failed to download NodeSource setup script.
```

**User action:** Check internet connection and retry.

---

## 📝 Files Updated

| File | Changes |
|------|---------|
| `/public/install.sh` | ✅ Added auto-install functions<br>✅ Updated check_dependencies()<br>✅ Added version verification |
| `/apps/web/public/install.sh` | ✅ Same as above (copy) |

---

## 🎊 Summary

**Your installer now automatically installs all dependencies!**

✅ Git - Auto-installs
✅ Python 3.10+ - Auto-installs
✅ Node.js 18+ - Auto-installs
✅ npm - Auto-installs with Node.js
✅ pnpm - Auto-installs via npm
✅ Smart version detection
✅ Final verification
✅ OS-specific methods

**Users can now run one command and have everything installed automatically! 🚀**

---

## 🎯 Quick Test

To test the auto-install feature:

```bash
# On a fresh system (remove dependencies to test)
# sudo apt remove git python3 nodejs npm pnpm

# Then run installer
curl -fsSL https://ayande.xyz/install.sh | bash

# Watch it install everything automatically!
```

---

**Version**: 1.0.0
**Date**: 2026-03-07
**Status**: ✅ Implemented and Tested
