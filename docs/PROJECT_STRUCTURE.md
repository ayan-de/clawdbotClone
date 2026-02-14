# Monorepo vs Polyrepo: Project Structure Recommendation

## Project Overview Analysis

After reviewing **ARCHITECTURE.md**, here's what your project includes:

### Components
1. **Bridge Server** (NestJS recommended)
   - Multiple messaging adapters (Telegram, WhatsApp, Slack, Discord)
   - Desktop registry and routing
   - Rate limiting, authentication
   - AI integration

2. **Desktop TUI** (Node.js)
   - Connects to Bridge Server via WebSocket
   - Executes shell commands safely
   - TUI interface
   - Command validation

3. **Shared Potential Code**
   - 📦 Communication protocol schemas (TypeScript interfaces)
   - 📦 Security utilities (path validation, command sanitization)
   - 📦 AI service integration (OpenAI/Claude)
   - 📦 Common error types
   - 📦 Logging utilities

---

## Decision: **MONOREPO** ✅

### Why Monorepo is Better for Your Project

#### 1. **Shared Code Duplication**
```
Polyrepo Problem:
bridge/          ✅ Has command validation
desktop/          ❌ Must duplicate command validation
telegram-adapter/  ❌ Must duplicate again
```

```
Monorepo Solution:
packages/common/     ✅ Single source of truth
  ├─ validators.ts   ✅ Shared by all packages
  ├─ types.ts        ✅ Shared interfaces
  └─ logger.ts       ✅ Unified logging
```

#### 2. **Type Safety Across Components**
```typescript
// Polyrepo: Different versions break
bridge:    types@1.0.0
desktop:   types@1.0.1  ← Version mismatch!
telegram:   types@1.0.0

// Monorepo: Always in sync
packages/
  ├─ bridge/
  │   └─ depends on: common@* (always latest)
  ├─ desktop/
  │   └─ depends on: common@* (always latest)
  └─ common/
      └─ single source of truth
```

#### 3. **Easier Local Development**
```bash
# Polyrepo: Multiple terminals
$ cd bridge && npm run dev        # Terminal 1
$ cd desktop && npm run dev       # Terminal 2
$ cd telegram-adapter && npm run dev  # Terminal 3
# ❌ Tedious, hard to test interactions

# Monorepo: Single command
$ npm run dev              # Runs everything
# ✅ Tests all packages together
```

#### 4. **Single CI/CD Pipeline**
```yaml
# Monorepo: One pipeline
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test          # Test all packages
      - run: npm run build        # Build all packages
```

#### 5. **Atomic Commits**
```
# Polyrepo: Breaking changes across repos
Commit 1 (bridge/): Update protocol schema
Commit 2 (desktop/): Update to match schema (hours/days later)
  ❌ Desktop is broken between commits

# Monorepo: Atomic updates
Commit (monorepo): Update protocol schema + all packages
  ✅ Everything updates together, nothing breaks
```

---

## When Polyrepo Would Make Sense

**Choose Polyrepo if:**
- ❌ Different teams with different release cycles
- ❌ Different deployment targets (serverless vs server)
- ❌ Completely independent stacks (Node.js vs Python vs Go)
- ❌ Package is meant for external users
- ❌ Different open-source licenses

**Your Project:** All of these are **false** → Monorepo wins.

---

## Recommended Monorepo Structure

### Tooling Recommendation: **pnpm workspaces** 🚀

**Why pnpm?**
- ⚡ Fastest package manager (2x faster than npm)
- 📦 Saves disk space (hard links instead of copies)
- 🎯 Perfect for monorepos
- 📊 Better lockfile resolution
- 🔒 More reliable than yarn workspaces

### Final Folder Structure

```
clawdbot-clone/                         # Root monorepo
├── packages/                            # All packages
│   ├── bridge/                          # Bridge Server (NestJS)
│   │   ├── src/
│   │   │   ├── main.ts                 # Entry point
│   │   │   ├── app.module.ts            # Root module
│   │   │   ├── chat/
│   │   │   │   ├── chat.module.ts       # Chat adapters module
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── chat.adapter.ts  # Base interface
│   │   │   │   │   └── telegram/
│   │   │   │   │       ├── telegram.module.ts
│   │   │   │   │       ├── telegram.adapter.ts
│   │   │   │   │       ├── telegram.controller.ts
│   │   │   │   │       └── telegram.service.ts
│   │   │   │   ├── message.router.ts   # Routes messages to adapters
│   │   │   │   └── dto/               # Data transfer objects
│   │   │   ├── websocket/
│   │   │   │   ├── websocket.module.ts
│   │   │   │   └── websocket.gateway.ts
│   │   │   ├── desktop/
│   │   │   │   ├── desktop.module.ts
│   │   │   │   └── desktop.gateway.ts
│   │   │   └── config/
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   └── e2e/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   ├── desktop/                         # Desktop TUI (Node.js)
│   │   ├── src/
│   │   │   ├── main.ts                 # Entry point
│   │   │   ├── server.ts               # WebSocket client
│   │   │   ├── command.handler.ts       # Execute commands
│   │   │   ├── security/
│   │   │   │   ├── validators.ts       # (uses common)
│   │   │   │   └── sanitizers.ts      # (uses common)
│   │   │   ├── terminal/
│   │   │   │   └── tui.ts            # Terminal UI
│   │   │   └── ai/
│   │   │       └── ai.service.ts       # (uses common)
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── adapters/                        # Messaging adapters (reusable)
│   │   ├── telegram/
│   │   │   ├── src/
│   │   │   │   ├── telegram.adapter.ts # Implements IChatAdapter
│   │   │   │   ├── message.handler.ts
│   │   │   │   └── output.sender.ts
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   ├── whatsapp/                  # Future
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   ├── slack/                     # Future
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   └── discord/                   # Future
│   │       ├── src/
│   │       ├── package.json
│   │       └── tsconfig.json
│   │
│   └── common/                          # Shared code
│       ├── src/
│       │   ├── types/
│       │   │   ├── index.ts            # Export all types
│       │   │   ├── protocol.ts         # WebSocket/HTTP protocols
│       │   │   ├── adapters.ts        # Adapter interfaces
│       │   │   └── commands.ts        # Command types
│       │   ├── validators/
│       │   │   ├── command.ts         # Command validation
│       │   │   ├── path.ts            # Path safety checks
│       │   │   └── input.ts           # Input sanitization
│       │   ├── security/
│       │   │   ├── whitelist.ts       # Safe commands list
│       │   │   └── rate-limit.ts      # Rate limiting utils
│       │   ├── ai/
│       │   │   ├── openai.service.ts   # OpenAI integration
│       │   │   ├── claude.service.ts   # Anthropic integration
│       │   │   └── ollama.service.ts   # Local Ollama
│       │   └── utils/
│       │       ├── logger.ts           # Unified logging
│       │       ├── error.ts           # Custom errors
│       │       └── constants.ts       # Shared constants
│       ├── test/
│       ├── package.json
│       └── tsconfig.json
│
├── apps/                               # Standalone apps (optional)
│   └── dashboard/                       # Web dashboard (future)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── scripts/                            # Build scripts
│   ├── build.sh                        # Build all packages
│   ├── dev.sh                          # Start all in dev mode
│   └── test.sh                         # Test all packages
│
├── docs/                               # Documentation
│   ├── ARCHITECTURE.md
│   ├── BRIDGE_SERVER_FRAMEWORK.md
│   └── PROJECT_STRUCTURE.md
│
├── .github/                            # GitHub Actions
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
│
├── .gitignore
├── pnpm-workspace.yaml                 # Workspace configuration
├── package.json                        # Root package.json
├── tsconfig.json                       # Root TypeScript config
└── README.md
```

---

## Package Dependencies

### How Dependencies Work in Monorepo

#### 1. **Internal Dependencies** (packages → packages)
```json
// packages/bridge/package.json
{
  "name": "@clawdbot/bridge",
  "dependencies": {
    "@clawdbot/common": "workspace:*",         ← Points to packages/common
    "@clawdbot/adapters-telegram": "workspace:*"
  }
}
```

```json
// packages/desktop/package.json
{
  "name": "@clawdbot/desktop",
  "dependencies": {
    "@clawdbot/common": "workspace:*",         ← Same common package
    "@clawdbot/ai-openai": "workspace:*"
  }
}
```

#### 2. **External Dependencies**
```json
// packages/common/package.json
{
  "name": "@clawdbot/common",
  "dependencies": {
    "zod": "^3.0.0",                    ← External
    "class-validator": "^0.14.0",
    "openai": "^4.0.0"
  }
}
```

#### 3. **Root Workspace Configuration**
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

#### 4. **Root package.json**
```json
{
  "name": "clawdbot-clone",
  "version": "1.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^1.11.0",                  ← Build system
    "pnpm": "^8.0.0",                    ← Package manager
    "typescript": "^5.0.0",
    "prettier": "^3.0.0",
    "eslint": "^8.0.0"
  },
  "private": true
}
```

---

## Build System: Turbo + pnpm

### Why Turbo?

- 🚀 Fast incremental builds (only build changed packages)
- 🔗 Package dependency graph (knows what to rebuild)
- 📊 Build caching (no rebuild if nothing changed)
- 🎯 Perfect with monorepos

### Package Scripts

```json
// packages/bridge/package.json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "test": "jest",
    "lint": "eslint"
  }
}
```

```json
// packages/desktop/package.json
{
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint"
  }
}
```

### Run All Packages from Root

```bash
# Start all in dev mode
npm run dev
# → Runs: packages/bridge dev
# → Runs: packages/desktop dev
# → Runs: packages/adapters/telegram dev

# Build all packages
npm run build
# → Builds: packages/common first (no dependencies)
# → Then: packages/adapters, packages/desktop
# → Finally: packages/bridge (depends on others)

# Test all packages
npm run test
# → Tests all packages in correct order
```

---

## Common Package: What to Share

### 1. **Types**
```typescript
// packages/common/src/types/protocol.ts
export interface BridgeToDesktop {
  type: 'execute' | 'heartbeat';
  sessionId: string;
  command: string;
  userMessage: string;
}

export interface DesktopToBridge {
  type: 'result' | 'error' | 'status';
  sessionId: string;
  command: string;
  stdout: string;
  stderr: string;
  success: boolean;
}

export interface ChatAdapter {
  platform: 'telegram' | 'whatsapp' | 'slack' | 'discord';
  sendMessage(userId: string, message: string): Promise<void>;
  sendStream(userId: string, data: ReadableStream): Promise<void>;
}
```

### 2. **Validators**
```typescript
// packages/common/src/validators/command.ts
import { SAFE_COMMANDS } from '../security/whitelist';

export function validateCommand(command: string): ValidationResult {
  const cmd = command.split(' ')[0];
  if (!SAFE_COMMANDS.includes(cmd)) {
    return { valid: false, reason: 'Command not allowed' };
  }
  return { valid: true };
}

// Used in bridge
import { validateCommand } from '@clawdbot/common';

// Used in desktop
import { validateCommand } from '@clawdbot/common';
```

### 3. **Security**
```typescript
// packages/common/src/security/whitelist.ts
export const SAFE_COMMANDS = [
  'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'echo',
  'grep', 'find', 'cp', 'mv', 'rm', 'chmod', 'chown',
  // ... all safe commands
] as const;

export type SafeCommand = typeof SAFE_COMMANDS[number];
```

### 4. **AI Services**
```typescript
// packages/common/src/ai/openai.service.ts
export class OpenAIService {
  async generateCommand(prompt: string): Promise<string> {
    // Implementation
  }
}

// Used in bridge (optional AI)
import { OpenAIService } from '@clawdbot/common/ai';

// Used in desktop (optional AI)
import { OpenAIService } from '@clawdbot/common/ai';
```

---

## Getting Started

### 1. Initialize Monorepo

```bash
# Create root directory
mkdir clawdbot-clone
cd clawdbot-clone

# Initialize git
git init

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'apps/*'
EOF

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "clawdbot-clone",
  "version": "1.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^1.11.0"
  },
  "private": true
}
EOF

# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install
```

### 2. Create Turbo Configuration

```bash
# Create turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": {
      "cache": false
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
EOF
```

### 3. Create Common Package

```bash
mkdir -p packages/common/src

cat > packages/common/package.json << 'EOF'
{
  "name": "@clawdbot/common",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types/index.js",
    "./validators": "./dist/validators/index.js",
    "./security": "./dist/security/index.js",
    "./ai": "./dist/ai/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.0.0",
    "openai": "^4.0.0",
    "class-validator": "^0.14.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
EOF
```

### 4. Create Bridge Package

```bash
mkdir -p packages/bridge/src

cat > packages/bridge/package.json << 'EOF'
{
  "name": "@clawdbot/bridge",
  "version": "1.0.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "test": "jest"
  },
  "dependencies": {
    "@clawdbot/common": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "socket.io": "^4.0.0"
  }
}
EOF
```

### 5. Create Desktop Package

```bash
mkdir -p packages/desktop/src

cat > packages/desktop/package.json << 'EOF'
{
  "name": "@clawdbot/desktop",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@clawdbot/common": "workspace:*",
    "socket.io-client": "^4.0.0",
    "inquirer": "^9.0.0",
    "chalk": "^5.0.0"
  }
}
EOF
```

### 6. Start Development

```bash
# Install all dependencies
pnpm install

# Start all packages in dev mode
pnpm run dev
# → Builds common package
# → Starts desktop TUI
# → Starts bridge server
# → All running together!
```

---

## CI/CD Configuration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm run test

      - name: Build
        run: pnpm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Bridge Server
        run: |
          cd packages/bridge
          # Deploy to Render/Heroku
```

---

## Summary: Why Monorepo Wins

| Aspect | Monorepo ✅ | Polyrepo |
|---------|--------------|----------|
| **Code Sharing** | Single source of truth | Duplication across repos |
| **Type Safety** | Always in sync | Version mismatches |
| **Local Dev** | Single command | Multiple terminals |
| **Testing** | Test integration easily | Harder to test interactions |
| **CI/CD** | Single pipeline | Multiple pipelines |
| **Refactoring** | Atomic commits | Breaking changes |
| **Release** | Single version | Multiple versions |
| **Learning Curve** | Medium | Low |
| **Suitability** | **Perfect for your project** | ❌ Too complex |

---

## Next Steps

1. **Initialize monorepo** (commands above)
2. **Create `packages/common`** (shared types, validators, security)
3. **Create `packages/bridge`** (NestJS server)
4. **Create `packages/desktop`** (TUI client)
5. **Create `packages/adapters/telegram`** (Telegram adapter)
6. **Add CI/CD** (GitHub Actions)
7. **Start development!** 🚀

**Estimated Time**: ~2 hours to set up complete monorepo structure.

---

## Resources

- [pnpm workspaces](https://pnpm.io/workspaces)
- [Turbo monorepo](https://turbo.build/repo/docs)
- [NestJS monorepo guide](https://docs.nestjs.com/recipes/microservices)
- [Monorepo best practices](https://monorepo.tools/)
