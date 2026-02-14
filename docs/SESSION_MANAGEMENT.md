Session Management with WebSocket Integration
=============================================

This document outlines the implementation of session management and its integration with WebSockets.

## Overview

The `SessionService` serves as the central authority for managing user sessions. A "Session" in this context represents a conversational context or a workspace that connects a User (from any platform, e.g., Telegram or Web) to a specific Desktop Terminal.

## Components

### 1. Domain Layer (`packages/bridge/src/application/domain/entities/session.entity.ts`)

- **Session Entity**: Stores session state, including:
  - `id`: UUID (Primary Key)
  - `userId`: Link to the system User.
  - `desktopId`: The socket ID of the connected desktop terminal.
  - `status`: 'active', 'inactive', 'closed'.
  - `metadata`: specific platform details (e.g., `platform: 'telegram'`, `chatId`, `username`).

### 2. Application Layer

- **SessionService** (`packages/bridge/src/application/session/session.service.ts`):
  - `getOrCreateSession`: Finds an active session for a user or creates a new one.
  - `attachDesktop`: Associates a desktop socket ID with a session.
  - `getSession`: Retrieves session details.
- **SessionRepository**: Encapsulates database access.

### 3. Execution Layer (`packages/bridge/src/application/execution/command-execution.service.ts`)

- Integrating `SessionService` into the command flow.
- **Scenario: Incoming Message (e.g., from Telegram)**
  1. Receives `IncomingMessage`.
  2. Finds or creates a "Guest" User based on the platform ID.
  3. Calls `sessionService.getOrCreateSession`.
  4. Finds an available desktop (via `DesktopGateway`).
  5. Sends command to Desktop with `sessionId` (the UUID).
  6. Stores ephemeral mapping if needed (or relies on DB session).
- **Scenario: Command Result (from Desktop)**
  1. Receives result with `sessionId`.
  2. Lookups up Session.
  3. Uses `metadata` to route the response back to the specific platform and user.

### 4. Presentation Layer

- **BridgeWebSocketGateway** (`packages/bridge/src/presentation/websocket/bridge-websocket.gateway.ts`):
  - Handles Web Client connections.
  - `handleSessionJoin`: Validates that the user owns the session before allowing them to join the socket room.
- **DesktopGateway** (`packages/bridge/src/presentation/websocket/desktop.gateway.ts`):
  - Handles Desktop connections.
  - Manages the `desktopId` lifecycle.

## Data Flow

1. **User** sends "ls" on Telegram.
2. **TelegramAdapter** -> `ChatEvent.MESSAGE_RECEIVED`.
3. **CommandExecutionService**:
    - Resolves User.
    - Resolves Session (UUID: `suc-123`).
    - Finds Desktop (Socket: `sock-abc`).
    - Sends `{ type: 'execute', sessionId: 'suc-123', command: 'ls' }` to `sock-abc`.
4. **Desktop TUI**:
    - Executes `ls`.
    - Emits `{ type: 'result', sessionId: 'suc-123', stdout: 'file.txt' }`.
5. **DesktopGateway** -> `command.result`.
6. **CommandExecutionService**:
    - `sessionService.getSession('suc-123')`.
    - Gets `platform: 'telegram'`, `userId: '12345'`.
    - `MessageRouter.sendToPlatform('telegram', '12345', 'file.txt')`.

## Next Steps

- Implement robust desktop selection (currently simple round-robin or first-available).
- Add support for multiple concurrent sessions per user.
- Enhance security validation for sessions.
