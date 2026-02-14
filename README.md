# Orbit

A scalable AI-powered terminal bot monorepo. Control your Linux terminal from Telegram, WhatsApp, Slack, or Discord through a secure bridge server.

## Architecture

```
┌─────────────────┐         WebSocket         ┌─────────────────┐
│   Telegram Bot  │ ◄─────────────────────► │   Bridge Server │
│   (Adapter 1)   │                          │     (NestJS)    │
└─────────────────┘                          └─────────────────┘
                                                    │
                                                    │ WebSocket
                                                    ▼
┌─────────────────┐         WebSocket         ┌─────────────────┐
│   Desktop TUI   │ ◄─────────────────────► │   Linux Shell   │
│   (Express)     │                          │   (Commands)    │
└─────────────────┘                          └─────────────────┘
```

## Monorepo Structure

```
orbit/
├── packages/
│   ├── common/          # Shared types, validators, security
│   ├── bridge/          # NestJS Bridge Server
│   ├── desktop/         # Desktop TUI Client
│   └── adapters/
│       └── telegram/    # Telegram Bot Adapter
├── apps/
│   └── web/            # Next.js Web Dashboard
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Installation

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install
```

### Development

```bash
# Start all packages in dev mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint all packages
pnpm lint
```

### Individual Package Development

```bash
# Start only bridge server
cd packages/bridge
pnpm dev

# Start only desktop TUI
cd packages/desktop
pnpm dev

# Start only web dashboard
cd apps/web
pnpm dev
```

## Packages

| Package | Description | Port |
|---------|-------------|------|
| `@orbit/bridge` | NestJS bridge server | 3000 |
| `@orbit/desktop` | Desktop TUI client | 4000 |
| `@orbit/common` | Shared utilities | - |
| `@orbit/adapters-telegram` | Telegram bot adapter | - |
| `@orbit/web` | Next.js web dashboard | 3001 |

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Bridge Server Framework](./BRIDGE_SERVER_FRAMEWORK.md)
- [Turbo vs Nx](./TURBO_VS_NX.md)
- [Git Strategy](./GIT_STRATEGY.md)
- [Project Plan](./ORBIT_PROJECT_PLAN.md)

## Tech Stack

- **Build System**: Turbo
- **Package Manager**: pnpm
- **Bridge Server**: NestJS
- **Desktop Client**: Express + Socket.io
- **Web Dashboard**: Next.js
- **Adapters**: Telegram (WhatsApp, Slack, Discord planned)
- **AI**: OpenAI/Claude/Ollama (optional)

## License

MIT
