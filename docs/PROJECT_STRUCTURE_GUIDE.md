# Orbit Project Structure Guide

This document explains the purpose of each folder and what files should be placed in them.

---

## 📁 Root Directory

```
orbit/
├── .gitignore           # Git ignore patterns (node_modules, dist, build, etc.)
├── pnpm-workspace.yaml # pnpm workspace configuration (defines packages & apps)
├── turbo.json          # Turbo build pipeline configuration
├── tsconfig.base.json  # Root TypeScript configuration
├── package.json        # Root package with scripts: dev, build, test, lint, clean
├── README.md           # Main project documentation
└── docs/              # All documentation files (except README.md)
```

### Root Purpose
- Configuration files for the entire monorepo
- Scripts to run all packages together
- Central documentation (README.md)

---

## 📦 packages/ - Shared Code & Services

```
packages/
├── common/              # ✅ Shared utilities, types, validators used by ALL packages
├── bridge/              # ✅ NestJS server that connects messaging apps to desktop
├── desktop/             # ✅ Desktop TUI client that executes shell commands
└── adapters/            # ✅ Messaging platform adapters
    └── telegram/       # ✅ Telegram Bot adapter (WhatsApp, Slack, Discord to be added)
```

---

## 📦 packages/common - Shared Library

**Purpose**: Types, validators, security, and AI services shared across all packages.

```
packages/common/
├── src/
│   ├── types/           # TypeScript interfaces and types
│   │   └── index.ts   # BridgeToDesktop, DesktopToBridge, ChatAdapter interfaces
│   ├── validators/      # Input and command validation
│   │   └── index.ts   # validateCommand(), CommandSchema
│   ├── security/        # Security utilities
│   │   └── index.ts   # sanitizeInput(), isPathSafe(), SAFE_COMMANDS
│   ├── ai/             # AI service interfaces
│   │   └── index.ts   # AICommandGenerator, AIConfig
│   ├── utils/          # Utility functions
│   │   └── index.ts   # logger, error handling, constants
│   └── index.ts       # Main export file
├── package.json
├── tsconfig.json
└── dist/              # Built output (not in git)
```

**What Goes Here?**
- `types/` - Protocol schemas (WebSocket messages, HTTP requests)
- `validators/` - Command whitelists, input sanitization
- `security/` - Path validation, safe commands list
- `ai/` - AI service interfaces (OpenAI, Claude, Ollama)
- `utils/` - Logger, error handlers, constants

**Dependencies**: None (base package, other packages depend on this)

---

## 📦 packages/bridge - NestJS Bridge Server

**Purpose**: Routes messages from Telegram/WhatsApp/Slack to Desktop TUI. Handles authentication, rate limiting, and WebSocket connections.

```
packages/bridge/
├── src/
│   ├── main.ts                  # Entry point, boots NestJS app
│   ├── app.module.ts             # Root module that imports all feature modules
│   ├── chat/                   # Chat/messaging functionality
│   │   ├── chat.module.ts       # Chat module
│   │   ├── adapters/           # Platform adapters
│   │   │   ├── chat.adapter.ts      # Base adapter interface
│   │   │   └── telegram/
│   │   │       ├── telegram.module.ts  # Telegram feature module
│   │   │       ├── telegram.adapter.ts # Telegram adapter implementation
│   │   │       ├── telegram.controller.ts # HTTP endpoints
│   │   │       ├── telegram.service.ts   # Business logic
│   │   │       └── telegram.dto.ts      # Data transfer objects
│   │   └── message.router.ts   # Routes messages to correct adapter
│   ├── websocket/              # WebSocket gateway for desktop connections
│   │   ├── websocket.module.ts
│   │   └── websocket.gateway.ts
│   ├── desktop/                # Desktop connection management
│   │   ├── desktop.module.ts
│   │   └── desktop.gateway.ts
│   ├── config/                 # Configuration files
│   │   └── config.ts
│   └── common/                # Shared bridge code
│       ├── guards/
│       ├── interceptors/
│       ├── decorators/
│       └── filters/
├── test/
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env                    # Environment variables (not in git)
└── dist/                   # Built output (not in git)
```

**What Goes Here?**
- `main.ts` - Bootstrap NestJS application
- `chat/adapters/` - Telegram, WhatsApp, Slack, Discord implementations
- `websocket/` - Socket.io gateway for real-time communication
- `desktop/` - Desktop TUI connection management
- `config/` - Environment configuration
- `common/` - Guards (auth), interceptors (logging), decorators

**Dependencies**: `@orbit/common`, `@orbit/adapters-telegram`

**Port**: 3000

---

## 📦 packages/desktop - Desktop TUI Client

**Purpose**: Runs on Linux desktop, connects to Bridge Server, executes shell commands safely, displays terminal output.

```
packages/desktop/
├── src/
│   ├── main.ts                # Entry point
│   ├── server.ts              # Express server (optional)
│   ├── websocket.client.ts     # Socket.io client to connect to bridge
│   ├── command.handler.ts      # Validates and executes shell commands
│   ├── terminal/
│   │   └── tui.ts          # Terminal UI (Blessed.js/Inquirer.js)
│   ├── ai/
│   │   └── ai.service.ts   # AI integration (optional)
│   ├── security/             # Security validations
│   │   ├── validators.ts     # (uses @orbit/common/validators)
│   │   └── sanitizers.ts    # (uses @orbit/common/security)
│   └── index.ts
├── test/
├── package.json
├── tsconfig.json
├── .env                    # Environment variables (not in git)
└── dist/                   # Built output (not in git)
```

**What Goes Here?**
- `main.ts` - Bootstraps the desktop TUI
- `websocket.client.ts` - Connects to bridge via WebSocket
- `command.handler.ts` - Executes shell commands safely
- `terminal/tui.ts` - Renders terminal UI
- `ai/ai.service.ts` - Optional AI command translation
- `security/` - Extra security validations

**Dependencies**: `@orbit/common`

**Port**: 4000 (optional, for local web UI)

---

## 📦 packages/adapters/telegram - Telegram Bot Adapter

**Purpose**: Implements Telegram Bot API, receives messages from users, sends responses back.

```
packages/adapters/telegram/
├── src/
│   ├── index.ts              # Main export
│   ├── telegram.adapter.ts   # Implements ChatAdapter interface
│   ├── message.handler.ts     # Parses incoming Telegram messages
│   ├── output.sender.ts       # Sends terminal output to user
│   ├── message.store.ts       # Stores message history (optional)
│   └── webhook.handler.ts     # Handles Telegram webhooks
├── test/
├── package.json
├── tsconfig.json
└── dist/                   # Built output (not in git)
```

**What Goes Here?**
- `telegram.adapter.ts` - Telegram-specific message sending
- `message.handler.ts` - Parses Telegram message format
- `output.sender.ts` - Streams terminal output to Telegram
- `webhook.handler.ts` - HTTP webhook endpoint for Telegram

**Dependencies**: `@orbit/common`, `node-telegram-bot-api`

---

## 📦 apps/ - Standalone Applications

**Purpose**: Independent applications that use Orbit packages.

```
apps/
└── web/                    # Next.js Web Dashboard
```

---

## 📦 apps/web - Next.js Web Dashboard

**Purpose**: Web-based dashboard to control Orbit, view terminal output, manage configurations.

```
apps/web/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── dashboard/        # Dashboard pages
│   │   │   └── page.tsx
│   │   └── globals.css       # Global styles
│   ├── components/            # React components
│   │   ├── Terminal.tsx      # Terminal display
│   │   ├── ChatInterface.tsx # Chat UI
│   │   └── CommandHistory.tsx
│   └── lib/                 # Utilities
│       ├── api.ts           # API client functions
│       └── hooks.ts        # React hooks
├── public/                  # Static assets
├── test/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env.local              # Environment variables (not in git)
└── .next/                 # Next.js build output (not in git)
```

**What Goes Here?**
- `app/` - Next.js App Router pages
- `components/` - Reusable React components
- `lib/` - API client, hooks, utilities

**Dependencies**: `@orbit/common`, `socket.io-client`

**Port**: 3001

---

## 📚 docs/ - Documentation

**Purpose**: All project documentation (except README.md).

```
docs/
├── ARCHITECTURE.md           # Full system architecture
├── BRIDGE_SERVER_FRAMEWORK.md # Framework comparisons (NestJS vs Express)
├── PROJECT_STRUCTURE.md      # Monorepo vs Polyrepo decision
├── QUICK_SETUP.md            # Setup commands for monorepo
├── MONOREPO_DIAGRAM.md       # Visual diagrams
├── TURBO_VS_NX.md          # Build system comparison
├── GIT_STRATEGY.md           # Git strategy (single .git)
├── ORBIT_PROJECT_PLAN.md     # Implementation roadmap
└── PROJECT_STRUCTURE_GUIDE.md # This file
```

---

## 🚀 Development Workflow

### Adding New Features

1. **Types**: Add to `packages/common/src/types/`
2. **Validators**: Add to `packages/common/src/validators/`
3. **Security**: Add to `packages/common/src/security/`
4. **Bridge Logic**: Add to `packages/bridge/src/`
5. **Desktop Logic**: Add to `packages/desktop/src/`
6. **Adapter Logic**: Add to `packages/adapters/telegram/src/`
7. **Web UI**: Add to `apps/web/src/`

### Build Order

When you run `pnpm build`, Turbo builds in this order:

1. `@orbit/common` (no dependencies)
2. `@orbit/adapters-telegram` (depends on common)
3. `@orbit/desktop` (depends on common)
4. `@orbit/bridge` (depends on common + adapters)
5. `@orbit/web` (depends on common)

### Dependency Graph

```
common
  ├─→ adapters/telegram
  ├─→ desktop
  ├─→ bridge
  └─→ web

adapters/telegram
  └─→ bridge
```

---

## 🔧 Environment Variables

### packages/bridge/.env
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
BRIDGE_SERVER_PORT=3000
OPENAI_API_KEY=your_api_key_here
NODE_ENV=development
```

### packages/desktop/.env
```
BRIDGE_WS_URL=ws://localhost:3000
ALLOWED_DIR=$HOME
NODE_ENV=development
```

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

---

## 📝 File Naming Conventions

| Type | Convention | Example |
|------|------------|----------|
| TypeScript files | `lowercase.ts` | `main.ts`, `websocket.client.ts` |
| Component files | `PascalCase.tsx` | `Terminal.tsx`, `ChatInterface.tsx` |
| DTO files | `*.dto.ts` | `telegram.dto.ts` |
| Module files | `*.module.ts` | `telegram.module.ts` |
| Controller files | `*.controller.ts` | `telegram.controller.ts` |
| Service files | `*.service.ts` | `telegram.service.ts` |
| Gateway files | `*.gateway.ts` | `websocket.gateway.ts` |
