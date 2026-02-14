# Monorepo Visual Diagram

## High-Level View

```
┌─────────────────────────────────────────────────────────────────────┐
│                    clawdbot-clone (Monorepo)                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Root Workspace                         │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐     │   │
│  │  │         packages/                              │     │   │
│  │  │                                              │     │   │
│  │  │  ┌────────────────────────────────────┐       │     │   │
│  │  │  │     common/                     │       │     │   │
│  │  │  │     ↓ (no dependencies)           │       │     │   │
│  │  │  │  • types                        │       │     │   │
│  │  │  │  • validators                   │       │     │   │
│  │  │  │  • security                     │       │     │   │
│  │  │  │  • ai services                  │       │     │   │
│  │  │  │  • utils                        │       │     │   │
│  │  │  └────────────────────────────────────┘       │     │   │
│  │  │                                              │     │   │
│  │  │  ┌────────────────────────────────────┐       │     │   │
│  │  │  │     adapters/                   │       │     │   │
│  │  │  │     ↓ (depends on common)       │       │     │   │
│  │  │  │  • telegram/                   │       │     │   │
│  │  │  │  • whatsapp/                   │       │     │   │
│  │  │  │  • slack/                     │       │     │   │
│  │  │  │  • discord/                   │       │     │   │
│  │  │  └────────────────────────────────────┘       │     │   │
│  │  │                                              │     │   │
│  │  │  ┌────────────────────────────────────┐       │     │   │
│  │  │  │     desktop/                    │       │     │   │
│  │  │  │     ↓ (depends on common)       │       │     │   │
│  │  │  │  • TUI client                  │       │     │   │
│  │  │  │  • Command executor            │       │     │   │
│  │  │  │  • WebSocket client            │       │     │   │
│  │  │  └────────────────────────────────────┘       │     │   │
│  │  │                                              │     │   │
│  │  │  ┌────────────────────────────────────┐       │     │   │
│  │  │  │     bridge/                     │       │     │   │
│  │  │  │     ↓ (depends on common +     │       │     │   │
│  │  │  │       adapters)                   │       │     │   │
│  │  │  │  • NestJS server               │       │     │   │
│  │  │  │  • Websocket gateway           │       │     │   │
│  │  │  │  • Message router              │       │     │   │
│  │  │  │  • Desktop registry            │       │     │   │
│  │  │  └────────────────────────────────────┘       │     │   │
│  │  │                                              │     │   │
│  │  └────────────────────────────────────────────┘     │     │   │
│  │                                                     │     │   │
│  │  ┌────────────────────────────────────┐            │     │   │
│  │  │     apps/                       │            │     │   │
│  │  │     ↓ (independent)             │            │     │   │
│  │  │  • dashboard/                   │            │     │   │
│  │  └────────────────────────────────────┘            │     │   │
│  │                                                     │     │   │
│  │  ┌────────────────────────────────────┐            │     │   │
│  │  │     scripts/                     │            │     │   │
│  │  │     • build.sh                   │            │     │   │
│  │  │     • dev.sh                     │            │     │   │
│  │  │     • test.sh                    │            │     │   │
│  │  └────────────────────────────────────┘            │     │   │
│  │                                                     │     │   │
│  │  ┌────────────────────────────────────┐            │     │   │
│  │  │     docs/                       │            │     │   │
│  │  │     • ARCHITECTURE.md            │            │     │   │
│  │  │     • PROJECT_STRUCTURE.md        │            │     │   │
│  │  │     • BRIDGE_SERVER_FRAMEWORK.md  │            │     │   │
│  │  └────────────────────────────────────┘            │     │   │
│  │                                                     │     │   │
│  │  ┌────────────────────────────────────┐            │     │   │
│  │  │     .github/                    │            │     │   │
│  │  │     • workflows/                 │            │     │   │
│  │  │       └─ ci.yml, cd.yml          │            │     │   │
│  │  └────────────────────────────────────┘            │     │   │
│  │                                                     │     │   │
│  │  package.json (root)                                  │     │   │
│  │  pnpm-workspace.yaml                                   │     │   │
│  │  turbo.json                                           │     │   │
│  │  tsconfig.json                                         │     │   │
│  │  .gitignore                                           │     │   │
│  │                                                     │     │   │
│  └──────────────────────────────────────────────────────┘     │   │
│                                                             │   │
└─────────────────────────────────────────────────────────────────────┘
```

## Dependency Graph

```
┌─────────────┐
│   common    │ ← Base package, no dependencies
│  (types,    │
│  validators,│
│  security,  │
│  ai, utils) │
└──────┬──────┘
       │
       ├───────────────────┐
       │                   │
       ▼                   ▼
┌─────────────┐    ┌─────────────┐
│  adapters/  │    │  desktop/   │
│  (telegram,  │    │  (TUI)      │
│   whatsapp,  │    │             │
│   slack,     │    │             │
│   discord)   │    │             │
└──────┬──────┘    └──────┬──────┘
       │                   │
       └───────┬──────────┘
               │
               ▼
      ┌─────────────┐
      │   bridge/   │ ← Depends on common + adapters
      │ (NestJS)   │
      └─────────────┘
```

## Data Flow in Monorepo

```
┌─────────────┐
│   common    │
│  (types)    │
└──────┬──────┘
       │
       │ 1. Define protocol interface
       │
       ▼
┌─────────────────────────────────────────────────────┐
│           packages/adapters/telegram             │
│           (implements ChatAdapter)             │
│                                              │
│  export class TelegramAdapter               │
│    implements ChatAdapter {                 │
│    sendMessage(userId, msg) {              │
│      // Telegram API calls                │
│    }                                     │
│  }                                        │
└─────────────────────────────────────────────────────┘
       │
       │ 2. Used by Bridge
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              packages/bridge                   │
│          (NestJS Application)                │
│                                              │
│  import { TelegramAdapter }                   │
│    from '@clawdbot/adapters-telegram';      │
│                                              │
│  @Injectable()                               │
│  class MessageRouter {                        │
│    route(platform, message) {                 │
│      const adapter = this.adapters.get(platform);│
│      await adapter.sendMessage(userId, message);  │
│    }                                         │
│  }                                            │
└─────────────────────────────────────────────────────┘
       │
       │ 3. Routes to Desktop
       │
       ▼
┌─────────────────────────────────────────────────────┐
│             packages/desktop                    │
│          (TUI + WebSocket Client)              │
│                                              │
│  import { validateCommand }                   │
│    from '@clawdbot/common/validators';      │
│                                              │
│  async executeCommand(command) {               │
│    if (!validateCommand(command)) {            │
│      throw new Error('Invalid command');      │
│    }                                         │
│    // Execute shell command                  │
│  }                                            │
└─────────────────────────────────────────────────────┘
```

## Shared Code Examples

### 1. Types (Shared by all packages)

```typescript
// packages/common/src/types/protocol.ts
export interface ChatAdapter {
  platform: string;
  sendMessage(userId: string, message: string): Promise<void>;
}
```

### 2. Validators (Shared by bridge & desktop)

```typescript
// packages/common/src/validators/command.ts
export function validateCommand(cmd: string) {
  // Same validation logic used everywhere
  return SAFE_COMMANDS.includes(cmd.split(' ')[0]);
}
```

### 3. Security (Shared by all packages)

```typescript
// packages/common/src/security/whitelist.ts
export const SAFE_COMMANDS = [
  'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat',
  // ... all safe commands
] as const;
```

## Build Order

```bash
$ pnpm run build

1. Building packages/common... (no dependencies)
   ✓ Done

2. Building packages/adapters/telegram... (depends on common)
   ✓ Done

3. Building packages/desktop... (depends on common)
   ✓ Done

4. Building packages/bridge... (depends on common + adapters)
   ✓ Done

All packages built successfully! 🎉
```

## Development Workflow

```bash
# Terminal 1: Start all packages
$ pnpm run dev
> turbo run dev

• packages/common dev
  ✓ Watching files...

• packages/adapters/telegram dev
  ✓ Watching files...

• packages/desktop dev
  ✓ Starting Desktop TUI on :4000...

• packages/bridge dev
  ✓ Starting Bridge Server on :3000...

# Terminal 2: Make changes
$ cd packages/common/src/validators/
$ vim command.ts

# Watcher automatically rebuilds:
✓ packages/common rebuilt

# Depending packages automatically rebuild:
✓ packages/bridge rebuilt (depends on common)
✓ packages/desktop rebuilt (depends on common)

# Hot reload! No manual restart needed 🚀
```

## Git Workflow

```bash
# One repo, one commit
$ git status
M packages/common/src/validators/command.ts
M packages/bridge/src/message.router.ts
M packages/desktop/src/command.executor.ts

$ git add .
$ git commit -m "Update command validation across all packages"

# All changes in one atomic commit! ✅
```

## Testing in Monorepo

```bash
# Run all tests
$ pnpm run test
• packages/common test
  ✓ All tests passed

• packages/bridge test
  ✓ All tests passed

• packages/desktop test
  ✓ All tests passed

# Run tests for specific package
$ pnpm --filter @clawdbot/bridge test

# Run tests that changed (Turbo magic!)
$ pnpm run test --filter=[HEAD^1]
```

## Deployment Strategy

```bash
# Build all packages
$ pnpm run build

# Deploy Bridge Server (only bridge needed in cloud)
$ cd packages/bridge
$ pnpm deploy

# Desktop runs locally (no deployment)
# Just: cd packages/desktop && pnpm start

# Adapters are part of bridge (deployed together)
# Common is library (no deployment)
```

## Summary: Why This Structure?

1. **Single Source of Truth** → No code duplication
2. **Type Safety** → Types always in sync
3. **Easy Development** → One command to start all
4. **Fast Builds** → Turbo builds only changed packages
5. **Atomic Commits** → All changes together
6. **Simple CI/CD** → One pipeline for all packages
7. **Perfect Scalability** → Easy to add new adapters/platforms
