# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Orbit is a scalable AI-powered terminal bot monorepo that allows controlling Linux terminals from messaging platforms (Telegram, WhatsApp, Slack, Discord) through a secure bridge server.

**Architecture**: Three-tier system - Chat Adapters → Bridge Server (NestJS) → Desktop TUI Clients → Linux Shell

**External Agent Service**: The bridge server communicates with an external Python-based AI agent (orbit-agent) at `AGENT_API_URL` for intelligent command processing.

## Common Commands

### Development
```bash
# Start all packages in dev mode
pnpm dev

# Start individual packages
cd packages/bridge && pnpm dev    # NestJS Bridge Server (port 3000)
cd packages/desktop && pnpm dev   # Desktop TUI Client (port 4000)
cd apps/web && pnpm dev          # Next.js Web Dashboard (port 3001)
```

### Build, Test, Lint
```bash
pnpm build        # Build all packages (Turbo handles dependencies)
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm clean        # Clean build artifacts
```

### Bridge Server (NestJS) specific
```bash
cd packages/bridge
pnpm migration:generate -d src/infrastructure/database/datasource.ts    # Create migration
pnpm migration:run -d src/infrastructure/database/datasource.ts         # Run migrations
pnpm migration:revert -d src/infrastructure/database/datasource.ts      # Revert migration
```

## Monorepo Structure

```
clawdbotClone/
├── packages/
│   ├── bridge/          # NestJS Bridge Server (application/infrastructure/presentation layers)
│   ├── desktop/         # Desktop TUI Client
│   ├── common/          # Shared types, validators, security
│   └── adapters/
│       └── telegram/    # Telegram Bot Adapter (currently in bridge/src/application/adapters/)
└── apps/
    └── web/            # Next.js Web Dashboard (port 3001)
```

**Package Dependencies**: Use `workspace:*` in package.json for internal dependencies (e.g., `"@orbit/common": "workspace:*"`)

**Turbo Configuration**: Build order respects dependencies. Common builds first, then adapters/desktop, then bridge.

## Architecture

### Bridge Server (`packages/bridge`)

**Layered Architecture** (DDD-inspired):
- `application/` - Business logic, use cases, orchestrators
  - `adapters/` - Chat platform adapters (Telegram, with pattern for adding more)
  - `auth/` - Authentication (JWT, Google OAuth, Gmail OAuth)
  - `domain/` - Domain entities
  - `execution/` - Command execution orchestrators
  - `session/` - Session management
  - `users/` - User management
- `infrastructure/` - External concerns (database, repositories)
- `presentation/` - Controllers, gateways, decorators
- `config/` - Configuration management
- `logger/` - Logging utilities (Winston with daily rotation)

**Key Design Patterns**:
- **Adapter Pattern**: `BaseChatAdapter` with `TelegramAdapter` implementation. Add new platforms by extending `BaseChatAdapter`
- **Strategy Pattern**: `MessageRouterService` routes messages to appropriate adapters via `IAdapterFactoryService`
- **Template Method Pattern**: `BaseWebSocketGateway` provides common WebSocket functionality
- **Interface Segregation Principle**: `IChatAdapter` composes smaller focused interfaces

**Message Flow**:
1. Chat Adapter (Telegram) receives message → emits `ChatEvent.MESSAGE_RECEIVED`
2. `MessageRouterService` handles event → finds user by Telegram username
3. Checks for active desktop session via `SessionService`
4. Routes command to desktop via WebSocket through Command Orchestrator
5. Desktop executes command → sends result back

### Desktop Client (`packages/desktop`)

Currently a skeleton. Needs:
- WebSocket client connecting to Bridge Server
- Command handler with security (whitelist, path validation)
- TUI interface (using inquirer, chalk)

### Common Package (`packages/common`)

Shared types and utilities:
- `types/` - Protocol interfaces (`BridgeToDesktop`, `DesktopToBridge`, `ChatAdapter`)
- `validators/` - Command/input validation
- `security/` - Security utilities
- `ai/` - AI service integrations

### Web Dashboard (`apps/web`)

Next.js app for:
- User signup (`/signup`)
- OAuth callback (`/auth/callback`)
- Main page with Orbit system overview

### External Agent Service (`orbit-agent`)

Separate Python-based AI agent service that:
- Provides intelligent command processing and generation
- Communicates with Bridge Server via HTTP at `AGENT_API_URL`
- Located in parent directory `/home/ayande/Projects/bigProject/ClaudBot/orbit-agent/`

## Adding New Chat Adapters

1. Extend `BaseChatAdapter` in `packages/bridge/src/application/adapters/`
2. Implement required methods: `sendMessage()`, `sendStream()`, `processUpdate()`
3. Register in `AdapterFactoryService`
4. Add transformer in `MessageRouterService.initializeTransformers()`

## Environment Configuration

Bridge server requires `.env` file (see `packages/bridge/.env.example`):

```
# Required
TELEGRAM_BOT_TOKEN=
NEON_DATABASE_URL=               # PostgreSQL connection
JWT_SECRET=

# Optional for development
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Agent API (external Python service)
AGENT_API_URL=http://localhost:8000

# Gmail OAuth (for email sending)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=

# Rate limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
LOG_TO_FILE=true
```

## Database

- **TypeORM** with PostgreSQL (Neon recommended)
- **Entities**: User, Session, etc.
- **Migrations**: Use TypeORM CLI scripts in bridge/package.json
- **Datasource**: `packages/bridge/src/infrastructure/database/datasource.ts`

## Authentication Flow

1. User signs up via web dashboard (`/signup`)
2. Google OAuth redirects to `/auth/callback`
3. JWT token issued
4. Desktop TUI connects via WebSocket (session managed in `SessionService`)
5. Chat adapter validates user by Telegram username lookup

## Session Management

- Sessions stored in database via `SessionService`
- Active sessions tracked per user
- WebSocket gateways use sessions to route commands to connected desktops
- Heartbeat mechanism detects stale connections (2 min timeout)

## Logging

- **Winston** with daily log rotation
- Console output with colors and timestamps
- File output: `{appName}-{DATE}.log` (max 20MB, 14 days retention)
- Error log: `{appName}-error-{DATE}.log` (max 20MB, 30 days retention)
- Use `BridgeLogger` service in all bridge modules

## Rate Limiting

- NestJS Throttler module configured
- Default: 100 requests per 60 seconds per window
- Configured via `RATE_LIMIT_TTL` and `RATE_LIMIT_MAX` environment variables

## Key Files to Understand Architecture

- `packages/bridge/src/application/adapters/message-router.service.ts` - Message routing logic
- `packages/bridge/src/application/adapters/telegram.adapter.ts` - Telegram adapter implementation
- `packages/bridge/src/presentation/websocket/base-websocket.gateway.ts` - Base WebSocket functionality
- `packages/bridge/src/application/adapters/chat-adapter.interface.ts` - Adapter interface definitions
- `packages/bridge/src/logger/logger.service.ts` - Winston logger configuration
- `turbo.json` - Build task configuration and dependencies

## Development Notes

- The adapter pattern allows adding WhatsApp/Slack/Discord without modifying core bridge logic
- Message transformers use Strategy Pattern (no switch statements - see `MessageRouterService.initializeTransformers()`)
- Desktop connections are WebSocket-based; chat adapters use HTTP/webhooks
- TypeORM entities use decorators; relationships configured in entity files
- NestJS modules export providers for injection into other modules
- Bridge server communicates with external Python agent (`orbit-agent`) via HTTP
- All adapters follow Interface Segregation Principle with composed interfaces

## Current Status

**Implemented**:
- Bridge server with layered architecture
- Telegram adapter with `/start`, `/help`, `/status` commands
- User authentication (JWT + Google OAuth + Gmail OAuth)
- Session management with database
- Base WebSocket gateway with heartbeat
- Web dashboard for signup/authentication
- Winston logging with daily rotation
- Rate limiting with NestJS Throttler
- Message transformers for Telegram, Discord, Slack (adapters may not be fully implemented)

**TODO (Phase 2)**:
- Desktop TUI implementation
- Command execution orchestrator
- WebSocket routing to desktop clients
- WhatsApp/Slack/Discord adapters (connectors exist but need full implementation)
