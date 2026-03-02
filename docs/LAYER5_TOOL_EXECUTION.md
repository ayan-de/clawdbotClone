# 🛠️ Layer 5: Tool / Execution Layer (Phase 6)

**Duration**: 2 weeks
**Last Updated**: 2026-03-01

---

## Overview

Layer 5 is the Tool/Execution Layer that runs on the **Desktop (Node.js)** and allows the agent to act in the world through safe, isolated tool execution. Tools implement a common interface, are auto-discovered, execute in a sandbox, and support permission levels (auto, ask, deny).

**Key Architecture Point**: Tool execution happens via **Bridge → Desktop communication**:
- orbit-agent detects tool call → returns to Bridge
- Bridge routes tool request → sends to Desktop via WebSocket
- Desktop executes tool → returns result to Bridge via HTTP
- Bridge returns result → sends to orbit-agent

---

## Final MVP

**Agent can safely execute actions through Bridge:**
- User says: "List all Python files in my project directory"
- orbit-agent detects tool call → returns to Bridge
- Bridge sends to Desktop via WebSocket → Desktop executes → returns to Bridge
- Bridge returns to orbit-agent → orbit-agent returns final response to Bridge
- Bridge sends to Desktop TUI → displays: "Found 12 Python files in /home/user/project"

**Tool Execution Flow:**
```
orbit-agent (detects tool)
    ↓
Bridge (HTTP response)
    ↓
Desktop (WebSocket: tool request)
    ↓
Desktop executes tool (sandbox)
    ↓
Desktop → Bridge (HTTP POST /tool/result)
    ↓
Bridge → orbit-agent (HTTP POST with result)
    ↓
orbit-agent continues reasoning
```

**Key Capabilities:**
- ☐ Tool registry with auto-discovery (in Desktop)
- ☐ Common tool interface
- ☐ Execution sandbox (filesystem + process isolation)
- ☐ Permission model (auto, ask, deny)
- ☐ Timeout system
- ☐ Retry mechanism with backoff
- ☐ Audit logging
- ☐ Core tools (file, shell, network, memory)
- ☐ Tool execution via Bridge communication
- ☐ Tool result reporting back to Bridge

---

## Implementation Steps

### Week 1: Tool Infrastructure

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 1 | Design Tool Registry System (discovery, registration) | `packages/desktop/src/tools/registry.ts` | ⬜ |
| 2 | Create Tool Base Class with Standard Interface | `packages/desktop/src/tools/base-tool.ts` | ⬜ |
| 3 | Define Tool Schema (parameters, risk level, etc.) | `packages/desktop/src/tools/types.ts` | ⬜ |
| 4 | Implement Tool Execution Sandbox | `packages/desktop/src/tools/sandbox.ts` | ⬜ |
| 5 | Design Tool Permission Model (ask, auto, deny) | `packages/desktop/src/tools/permission-manager.ts` | ⬜ |
| 6 | Build Tool Result Handling (parsing, validation) | `packages/desktop/src/tools/result-handler.ts` | ⬜ |
| 7 | Create Tool Timeout System | `packages/desktop/src/tools/timeout-manager.ts` | ⬜ |
| 8 | Implement Tool Dependency Management | `packages/desktop/src/tools/dependency-manager.ts` | ⬜ |
| 9 | Design Tool Composition (chains of tools) | `packages/desktop/src/tools/composition/` | ⬜ |
| 10 | Build Tool Retry Mechanism with Backoff | `packages/desktop/src/tools/retry-manager.ts` | ⬜ |

### Week 2: Core Tools & Bridge Integration

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 11 | Create Tool Logging and Audit Trail | `packages/desktop/src/tools/audit-logger.ts` | ⬜ |
| 12 | Design Tool Capability Declaration | `packages/desktop/src/tools/capability-declaration.ts` | ⬜ |
| 13 | Implement Tool Versioning (backward compatibility) | `packages/desktop/src/tools/version-manager.ts` | ⬜ |
| 14 | Implement File System Tools (read, write, list, delete, search) | `packages/desktop/src/tools/file-system/` | ⬜ |
| 15 | Implement Shell Tools (execute, get cwd, list processes) | `packages/desktop/src/tools/shell/` | ⬜ |
| 16 | Implement Network Tools (http request, websocket, webhook) | `packages/desktop/src/tools/network/` | ⬜ |
| 17 | Implement Memory Tools (remember, retrieve, update preference) | `packages/desktop/src/tools/memory/` | ⬜ |
| 18 | Create Tool CLI/Command Parser | `packages/desktop/src/tools/cli-parser.ts` | ⬜ |
| 19 | Implement Tool Request Handler (receives from Bridge) | `packages/desktop/src/tools/tool-request-handler.ts` | ⬜ |
| 20 | Implement Tool Result Reporter (sends to Bridge) | `packages/desktop/src/tools/tool-result-reporter.ts` | ⬜ |
| 21 | Write Unit Tests for Tool Layer | `packages/desktop/src/tools/__tests__/` | ⬜ |

---

## 📊 Total Progress

```
Layer 5: Tool Execution        ░░░░░░░░░   0/21 steps
```

---

## Success Criteria

☐ Tools discovered and registered automatically from directory
☐ Tools execute in isolated environment (sandbox)
☐ Permission prompts work correctly (auto/ask/deny)
☐ Timeouts enforced (per-tool and global)
☐ Retries work on transient failures (network, timeout)
☐ Audit logs capture all executions with full context
☐ Core tools work reliably (file, shell, network, memory)
☐ Tool dependencies resolved correctly
☐ Tool requests received from Bridge via WebSocket
☐ Tool results sent to Bridge via HTTP

---

## Tool Execution Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORBIT-AGENT                          │
│                                                               │
│  1. LLM returns response with tool call                      │
│     {                                                        │
│       "tool": "executeCommand",                              │
│       "arguments": { "command": "git status" }              │
│     }                                                        │
│                                                               │
│  2. orbit-agent → Bridge (HTTP Response)                     │
│     POST http://localhost:8000/api/v1/agent/invoke            │
│     Response: {                                              │
│       "toolCall": {                                          │
│         "tool": "executeCommand",                              │
│         "args": { "command": "git status" },                 │
│         "executionId": "exec-123"                             │
│       }                                                      │
│     }                                                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BRIDGE                               │
│                                                               │
│  3. Bridge receives tool call from orbit-agent                │
│                                                               │
│  4. Bridge creates tool request                              │
│     {                                                        │
│       "type": "toolExecution",                               │
│       "executionId": "exec-123",                             │
│       "tool": "executeCommand",                              │
│       "args": { "command": "git status" }                   │
│     }                                                        │
│                                                               │
│  5. Bridge → Desktop (WebSocket)                              │
│     ws://localhost:3000/ws/desktop                            │
│     Send: Tool request message                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DESKTOP                              │
│                                                               │
│  6. Desktop receives tool request via WebSocket               │
│                                                               │
│  7. Tool Request Handler processes request                     │
│     • Check permissions                                       │
│     • Load tool from registry                                 │
│     • Validate arguments                                      │
│                                                               │
│  8. Execute Tool (Sandbox)                                  │
│     • Spawn child process                                    │
│     • Enforce timeout                                        │
│     • Capture stdout/stderr                                  │
│                                                               │
│  9. Tool Result Handler processes result                      │
│     • Parse output                                           │
│     • Validate result                                         │
│     • Log to audit trail                                     │
│                                                               │
│ 10. Desktop → Bridge (HTTP POST /tool/result)               │
│     POST http://localhost:3000/api/v1/tool/result             │
│     {                                                        │
│       "executionId": "exec-123",                             │
│       "tool": "executeCommand",                              │
│       "result": {                                           │
│         "success": true,                                     │
│         "stdout": "On branch main...",                        │
│         "stderr": "",                                        │
│         "exitCode": 0,                                      │
│         "duration": 1234                                     │
│       }                                                      │
│     }                                                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BRIDGE                               │
│                                                               │
│ 11. Bridge receives tool result                              │
│                                                               │
│ 12. Bridge → orbit-agent (HTTP POST with result)             │
│     POST http://localhost:8000/api/v1/tool/result            │
│     Body: Tool result from Desktop                            │
│                                                               │
│ 13. Bridge → Desktop TUI (WebSocket)                         │
│     Send: Update (optional, for streaming)                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ORBIT-AGENT                          │
│                                                               │
│ 14. orbit-agent receives tool result                         │
│                                                               │
│ 15. Continue reasoning with result                           │
│     • If more tools needed → repeat flow                      │
│     • If done → generate final response                        │
│                                                               │
│ 16. orbit-agent → Bridge (final response)                     │
│                                                               │
│ 17. Bridge → Desktop TUI (final response)                   │
│     Display to user                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Bridge Integration Points

### Desktop Receives Tool Requests

**File**: `packages/desktop/src/tools/tool-request-handler.ts`

```typescript
export class ToolRequestHandler {
  constructor(
    private toolRegistry: ToolRegistry,
    private permissionManager: PermissionManager,
    private sandbox: ToolSandbox,
    private auditLogger: AuditLogger
  ) {}

  async handleToolRequest(request: ToolRequest): Promise<void> {
    // 1. Check permissions
    const permission = await this.permissionManager.check(request.tool);
    if (permission === 'deny') {
      throw new Error('Tool execution denied');
    }

    // 2. Load tool from registry
    const tool = this.toolRegistry.getTool(request.tool);
    if (!tool) {
      throw new Error(`Tool not found: ${request.tool}`);
    }

    // 3. Validate arguments
    tool.validateArgs(request.args);

    // 4. Log audit
    await this.auditLogger.logToolExecution(request);

    // 5. Execute in sandbox
    const result = await this.sandbox.execute(tool, request.args);

    // 6. Send result to Bridge
    await this.sendResultToBridge(request.executionId, result);
  }

  private async sendResultToBridge(executionId: string, result: ToolResult) {
    await fetch('http://localhost:3000/api/v1/tool/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        executionId,
        tool: result.tool,
        result: result.data
      })
    });
  }
}
```

### Desktop WebSocket Connection

**File**: `packages/desktop/src/daemon/bridge-connection.ts`

```typescript
export class BridgeConnection {
  private ws?: WebSocket;

  async connect() {
    this.ws = new WebSocket('ws://localhost:3000/ws/desktop');

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'toolExecution') {
        // Route to Tool Request Handler
        this.toolRequestHandler.handleToolRequest(message);
      }
    });
  }
}
```

---

## Permission Model

### Auto (Execute without confirmation)
- **Criteria**: Risk level: low
- **Operations**: Read-only, idempotent
- **Examples**: `ls`, `pwd`, `cat file.txt`, memory retrieval

### Ask (Require user confirmation)
- **Criteria**: Risk level: medium or high
- **Operations**: Write, modify, network request
- **Examples**: `mkdir`, `write file`, `http request`, `git commit`

### Deny (Completely blocked)
- **Criteria**: Risk level: critical
- **Operations**: Destructive, system-level
- **Examples**: `rm -rf /`, `sudo`, `format disk`, `shutdown`

---

## Core Tools

### File System Tools
- `readFile(path)` - Read file content
- `writeFile(path, content)` - Write content to file
- `listDirectory(path)` - List directory contents
- `createDirectory(path)` - Create new directory
- `deleteFile(path)` - Delete file (ask permission)
- `searchFiles(pattern)` - Search files by pattern

### Shell Execution Tools
- `executeCommand(command, cwd)` - Execute shell command (ask permission)
- `getWorkingDirectory()` - Get current directory
- `listProcesses()` - List running processes

### Network Tools
- `httpRequest(url, method, body)` - HTTP request (ask permission)
- `websocketConnect(url)` - WebSocket connection
- `triggerWebhook(url, payload)` - Send webhook payload

### Memory Tools
- `remember(fact)` - Store important fact (auto permission)
- `retrieveMemory(query)` - Search memory
- `updatePreference(key, value)` - Update user preference

---

## Tool Composition Patterns

### Chains
Sequence of tools: tool A → tool B → tool C
- Each tool's result is input to next tool

### Conditionals
If tool A succeeds, run tool B
- Conditional logic based on tool results

### Loops
Repeat tool N times or until condition
- Iterate with break conditions

### Fallback
If tool A fails, try tool B
- Graceful degradation

---

## File Structure

```
packages/desktop/src/tools/
├── registry.ts
├── base-tool.ts
├── types.ts
├── sandbox.ts
├── permission-manager.ts
├── result-handler.ts
├── timeout-manager.ts
├── dependency-manager.ts
├── retry-manager.ts
├── audit-logger.ts
├── capability-declaration.ts
├── version-manager.ts
├── cli-parser.ts
├── tool-request-handler.ts       # Receives requests from Bridge
├── tool-result-reporter.ts      # Sends results to Bridge
├── file-system/
│   ├── read-file.tool.ts
│   ├── write-file.tool.ts
│   ├── list-directory.tool.ts
│   ├── create-directory.tool.ts
│   ├── delete-file.tool.ts
│   └── search-files.tool.ts
├── shell/
│   ├── execute-command.tool.ts
│   ├── get-working-directory.tool.ts
│   └── list-processes.tool.ts
├── network/
│   ├── http-request.tool.ts
│   ├── websocket-connect.tool.ts
│   └── trigger-webhook.tool.ts
├── memory/
│   ├── remember.tool.ts
│   ├── retrieve-memory.tool.ts
│   └── update-preference.tool.ts
└── __tests__/
    └── ...
```

---

## API Endpoints

### Desktop → Bridge (Tool Results)

**POST** `/api/v1/tool/result`

```json
{
  "executionId": "exec-123",
  "tool": "executeCommand",
  "result": {
    "success": true,
    "stdout": "On branch main...",
    "stderr": "",
    "exitCode": 0,
    "duration": 1234
  }
}
```

### Bridge → Desktop (Tool Requests - WebSocket)

```json
{
  "type": "toolExecution",
  "executionId": "exec-123",
  "tool": "executeCommand",
  "args": {
    "command": "git status",
    "cwd": "/home/user/project"
  }
}
```

---

## Dependencies

**Requires**:
- Layer 1 (Gateway Layer) - Bridge WebSocket connection
- Layer 2 (Reasoning Layer) - orbit-agent sends tool calls via Bridge
- Layer 3 (Memory System) - Desktop writes to markdown

**Enables**:
- Layer 6 (Event Loop Integration) - Tool execution in distributed loop
- Full agent autonomy

---

> **Document Version**: 1.0
> **Last Updated**: 2026-03-01
> **Status**: Ready for Implementation
