# 🔍 Installation Process - Detailed Breakdown

## ✅ What the Install Script Actually Does

The install script correctly installs and runs all components. Here's the detailed breakdown:

---

## 📦 Component-by-Component Installation

### 1. Python Agent (orbit-agent)

**Location:** `~/.orbit/orbit-agent`

**What the script does:**

```bash
# Step 1: Navigate to agent directory
cd "$INSTALL_DIR/orbit-agent"

# Step 2: Create virtual environment
python3 -m venv .venv

# Step 3: Activate virtual environment
source .venv/bin/activate

# Step 4: Upgrade pip
pip install --upgrade pip

# Step 5: Install requirements
pip install -r requirements.txt

# Step 6: Start the service (background)
uvicorn main:app --host 0.0.0.0 --port $AGENT_PORT
```

**Package.json scripts:** (Not applicable - Python project)

**What actually runs:**
- ✅ Creates Python virtual environment (`.venv/`)
- ✅ Installs all dependencies from `requirements.txt`
- ✅ Starts FastAPI with `uvicorn` on configured port (default 8888)

---

### 2. Bridge Server (packages/bridge)

**Location:** `~/.orbit/clawdbotClone/packages/bridge`

**What the script does:**

```bash
# Step 1: Navigate to monorepo root
cd "$INSTALL_DIR/clawdbotClone"

# Step 2: Install all dependencies (pnpm install)
pnpm install

# Step 3: Build the bridge package
cd packages/bridge
pnpm build

# Step 4: Start the service (background)
pnpm start
```

**Package.json scripts:**
```json
{
  "dev": "nest start --watch",
  "build": "nest build",
  "start": "node dist/main.js",
  "start:prod": "node dist/main.js"
}
```

**What actually happens:**

| Command | Action |
|---------|--------|
| `pnpm install` | Installs all dependencies (root + all packages) |
| `pnpm build` | Runs `nest build` → Compiles TypeScript to `dist/` |
| `pnpm start` | Runs `node dist/main.js` → Starts NestJS server |

**What runs:**
- ✅ Installs all Node.js dependencies via pnpm
- ✅ Builds TypeScript to JavaScript (`nest build`)
- ✅ Starts NestJS server in production mode on configured port (default 8443)

---

### 3. Web Dashboard (apps/web)

**Location:** `~/.orbit/clawdbotClone/apps/web`

**What the script does:**

```bash
# Step 1: Navigate to monorepo root
cd "$INSTALL_DIR/clawdbotClone"

# Step 2: Install all dependencies
pnpm install

# Step 3: Build the web app
cd apps/web
pnpm build

# Step 4: Start the service (background)
pnpm start
```

**Package.json scripts:**
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

**What actually happens:**

| Command | Action |
|---------|--------|
| `pnpm install` | Installs all dependencies (shared via workspace) |
| `pnpm build` | Runs `next build` → Creates production build in `.next/` |
| `pnpm start` | Runs `next start` → Starts Next.js production server |

**What runs:**
- ✅ Installs all Node.js dependencies via pnpm
- ✅ Builds Next.js for production (`next build`)
- ✅ Starts Next.js production server on configured port (default 8444)

---

### 4. Desktop TUI (packages/desktop)

**Location:** `~/.orbit/clawdbotClone/packages/desktop`

**What the script does:**

```bash
# Step 1: Navigate to monorepo root
cd "$INSTALL_DIR/clawdbotClone"

# Step 2: Install all dependencies
pnpm install

# Step 3: Build the desktop package
cd packages/desktop
pnpm build

# Step 4: USER MUST START MANUALLY (interactive TUI)
# User runs: pnpm dev
```

**Package.json scripts:**
```json
{
  "dev": "tsx watch src/main.ts",
  "start": "tsx src/main.ts",
  "build": "tsc",
  "test": "jest",
  "lint": "eslint"
}
```

**What actually happens:**

| Command | Action |
|---------|--------|
| `pnpm install` | Installs all dependencies |
| `pnpm build` | Runs `tsc` → Compiles TypeScript to `dist/` |
| `pnpm start` | Runs `tsx src/main.ts` → Runs in dev mode |
| `pnpm dev` | Runs `tsx watch src/main.ts` → Dev mode with hot reload |

**Why Desktop TUI is not auto-started:**
- ❌ Desktop TUI is **interactive** (requires terminal input)
- ❌ Cannot run in background (`nohup` won't work)
- ✅ User starts it manually in a **dedicated terminal**
- ✅ User sees all output and can interact with the TUI

**User instructions after install:**
```bash
cd ~/.orbit/clawdbotClone/packages/desktop
pnpm dev
```

---

## 🔄 Build Order

The script builds packages in the **correct dependency order**:

```bash
# 1. Build common package (shared types)
cd packages/common && pnpm build && cd ../..

# 2. Build bridge (depends on common)
cd packages/bridge && pnpm build && cd ../..

# 3. Build desktop (depends on common)
cd packages/desktop && pnpm build && cd ../..

# 4. Build web (depends on common)
cd apps/web && pnpm build && cd ../..
```

This ensures that:
- ✅ Common package is built first (other packages depend on it)
- ✅ Bridge can import from common
- ✅ Desktop can import from common
- ✅ Web can import from common

---

## 🚀 Service Startup

### Services Started Automatically (Background)

```bash
# Python Agent
cd ~/.orbit/orbit-agent
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8888 &

# Bridge Server
cd ~/.orbit/clawdbotClone/packages/bridge
pnpm start &

# Web Dashboard
cd ~/.orbit/clawdbotClone/apps/web
pnpm start &
```

**All run with `nohup`** (no hang up) to continue running after installation completes.

### Service Started Manually (Foreground)

```bash
# Desktop TUI (in new terminal)
cd ~/.orbit/clawdbotClone/packages/desktop
pnpm dev
```

**Runs in foreground** because it's an interactive TUI.

---

## 📊 Comparison Table

| Component | Venv | Install | Build | Run Command | Auto-Start? |
|-----------|------|---------|-------|-------------|-------------|
| **Python Agent** | ✅ Yes | `pip install -r requirements.txt` | N/A | `uvicorn main:app` | ✅ Yes |
| **Bridge** | ❌ No | `pnpm install` | `pnpm build` | `pnpm start` | ✅ Yes |
| **Web** | ❌ No | `pnpm install` | `pnpm build` | `pnpm start` | ✅ Yes |
| **Desktop** | ❌ No | `pnpm install` | `pnpm build` | `pnpm dev` | ❌ No (interactive) |

---

## 🎯 Dev vs Production Mode

### Agent (Python)

| Mode | Command | Usage |
|------|---------|-------|
| **Production** | `uvicorn main:app` | Auto-started by install script |
| **Development** | `uvicorn main:app --reload` | Not used in install |

### Bridge (NestJS)

| Mode | Package Script | Command | Usage |
|------|---------------|---------|-------|
| **Production** | `pnpm start` | `node dist/main.js` | ✅ Auto-started |
| **Development** | `pnpm dev` | `nest start --watch` | Not used in install |

### Web (Next.js)

| Mode | Package Script | Command | Usage |
|------|---------------|---------|-------|
| **Production** | `pnpm start` | `next start` | ✅ Auto-started |
| **Development** | `pnpm dev` | `next dev` | Not used in install |

### Desktop (TUI)

| Mode | Package Script | Command | Usage |
|------|---------------|---------|-------|
| **Production** | N/A | N/A | Not applicable |
| **Development** | `pnpm dev` | `tsx watch src/main.ts` | ✅ Manual start |

---

## ✅ Verification Checklist

### Python Agent

- [x] Virtual environment created (`.venv/`)
- [x] Dependencies installed from `requirements.txt`
- [x] Service starts with `uvicorn main:app`
- [x] Runs in background with `nohup`
- [x] Logs to `~/.orbit/logs/agent.log`
- [x] PID saved to `~/.orbit/logs/agent.pid`

### Bridge Server

- [x] Dependencies installed via `pnpm install`
- [x] TypeScript compiled with `pnpm build` (→ `dist/`)
- [x] Service starts with `pnpm start` (→ `node dist/main.js`)
- [x] Runs in background with `nohup`
- [x] Logs to `~/.orbit/logs/bridge.log`
- [x] PID saved to `~/.orbit/logs/bridge.pid`

### Web Dashboard

- [x] Dependencies installed via `pnpm install`
- [x] Next.js built with `pnpm build` (→ `.next/`)
- [x] Service starts with `pnpm start` (→ `next start`)
- [x] Runs in background with `nohup`
- [x] Logs to `~/.orbit/logs/web.log`
- [x] PID saved to `~/.orbit/logs/web.pid`

### Desktop TUI

- [x] Dependencies installed via `pnpm install`
- [x] TypeScript compiled with `pnpm build` (→ `dist/`)
- [x] User instructed to run `pnpm dev` manually
- [x] Runs in foreground (interactive)
- [x] Not auto-started (requires terminal input)

---

## 🔍 Debug Installation

### Check if Agent is Running

```bash
# Check process
ps aux | grep uvicorn

# Check port
lsof -i:8888

# Check logs
tail -f ~/.orbit/logs/agent.log

# Test health endpoint
curl http://localhost:8888/health
```

### Check if Bridge is Running

```bash
# Check process
ps aux | grep "node dist/main.js"

# Check port
lsof -i:8443

# Check logs
tail -f ~/.orbit/logs/bridge.log

# Test health endpoint
curl http://localhost:8443/health
```

### Check if Web is Running

```bash
# Check process
ps aux | grep "next start"

# Check port
lsof -i:8444

# Check logs
tail -f ~/.orbit/logs/web.log

# Test in browser
open http://localhost:8444
```

### Check Desktop TUI

```bash
# Start manually
cd ~/.orbit/clawdbotClone/packages/desktop
pnpm dev

# The TUI should appear in your terminal
```

---

## 🎯 Summary

### ✅ What Works Correctly

1. **Python Agent**
   - ✅ Creates virtual environment
   - ✅ Installs requirements.txt
   - ✅ Starts with uvicorn
   - ✅ Auto-started in background

2. **Bridge Server**
   - ✅ Installs with pnpm install
   - ✅ Builds with pnpm build
   - ✅ Starts with pnpm start (production)
   - ✅ Auto-started in background

3. **Web Dashboard**
   - ✅ Installs with pnpm install
   - ✅ Builds with pnpm build
   - ✅ Starts with pnpm start (production)
   - ✅ Auto-started in background

4. **Desktop TUI**
   - ✅ Installs with pnpm install
   - ✅ Builds with pnpm build
   - ✅ User runs pnpm dev manually (correct - it's interactive)

### 🎯 The Install Script is **Correct!**

Everything works as intended:
- ✅ Virtual environment created for Python
- ✅ All dependencies installed
- ✅ All packages built
- ✅ Services run in production mode
- ✅ Desktop TUI left for manual start (interactive)

---

## 📝 Manual Installation Commands (for reference)

If you want to do it manually:

```bash
# 1. Python Agent
cd ~/.orbit/orbit-agent
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 2. Bridge
cd ~/.orbit/clawdbotClone
pnpm install
cd packages/bridge
pnpm build
pnpm start

# 3. Web
cd ~/.orbit/clawdbotClone/apps/web
pnpm build
pnpm start

# 4. Desktop (new terminal)
cd ~/.orbit/clawdbotClone/packages/desktop
pnpm dev
```

---

**Version**: 1.0.0
**Date**: 2026-03-07
**Status**: ✅ Installation Process Verified Correct
