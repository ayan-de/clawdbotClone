# 🔄 Layer 6: Event Loop Integration (Phase 7)

**Duration**: 2 weeks
**Last Updated**: 2026-03-01

---

## Overview

Layer 6 is the **Distributed Event Loop** that ties all previous layers together for continuous autonomous operation. Unlike a single-process event loop, this architecture distributes the loop across **three components**:

1. **Bridge (NestJS)**: Main event queue and routing
2. **orbit-agent (Python)**: Processing loop (when request received)
3. **Desktop (Node.js)**: Tool execution loop (when tool request received)

Each component runs its own loop, coordinated via HTTP and WebSocket communication through Bridge.

---

## Final MVP

**Distributed event loops work together seamlessly:**
- Bridge receives event (from Telegram, TUI, etc.) → queues → routes to orbit-agent
- orbit-agent processes (LLM reasoning, memory search) → returns tool call or response
- Bridge receives tool call → routes to Desktop via WebSocket
- Desktop executes tool → returns result to Bridge
- Bridge forwards result to orbit-agent
- orbit-agent continues or returns final response to Bridge
- Bridge sends response to Desktop TUI → displays to user

**All loops run continuously:**
```
Bridge Loop          orbit-agent Loop       Desktop Loop
  ↓                        ↓                       ↓
Receive Event        Wait for Request       Wait for Tool Request
  ↓                        ↓                       ↓
Queue Event         Process LLM          Execute Tool
  ↓                        ↓                       ↓
Route to Agent      Search Memory          Return Result
  ↓                        ↓                       ↓
                  Extract Tool Call
                          ↓
                  Return Tool Call
                          ↓
Route to Desktop                   (continue)
                          ↓
                  Wait for Result
                          ↓
Receive Result
                          ↓
Route to Agent
                          ↓
              Continue with Result
                          ↓
              Return Final Response
                          ↓
Send to TUI
```

**Key Capabilities:**
- ☐ Distributed event loop across 3 components
- ☐ Event processing pipeline (all layers integrated)
- ☐ Memory load before reasoning
- ☐ Prompt building integrated
- ☐ LLM invocation integrated
- ☐ Tool execution with result capture
- ☐ Memory update after action
- ☐ State persistence after each iteration
- ☐ Error recovery within each loop
- ☐ Bridge as central coordinator

---

## Implementation Steps

### Week 1: Bridge Event Loop Core

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 1 | Design Bridge Event Loop Lifecycle | `packages/bridge/src/loop/event-lifecycle.ts` | ⬜ |
| 2 | Implement Event Received → Normalized → Queued Flow | `packages/bridge/src/loop/event-flow.ts` | ⬜ |
| 3 | Build Event Queue with Priority (in Bridge) | `packages/bridge/src/gateway/event-queue.ts` | ⬜ |
| 4 | Implement Session Manager (in Bridge) | `packages/bridge/src/session/session-manager.ts` | ⬜ |
| 5 | Create Event Router (routes to orbit-agent or Desktop) | `packages/bridge/src/gateway/event-router.ts` | ⬜ |
| 6 | Implement Rate Limiter (in Bridge) | `packages/bridge/src/gateway/rate-limiter.ts` | ⬜ |
| 7 | Create orbit-agent HTTP Client (Bridge calls orbit-agent) | `packages/bridge/src/clients/orbit-agent-client.ts` | ⬜ |
| 8 | Create Desktop WebSocket Client (Bridge → Desktop) | `packages/bridge/src/clients/desktop-websocket-client.ts` | ⬜ |
| 9 | Implement Tool Result Handler (receives from Desktop) | `packages/bridge/src/gateway/tool-result-handler.ts` | ⬜ |
| 10 | Create Response Handler (sends to TUI/messaging apps) | `packages/bridge/src/gateway/response-handler.ts` | ⬜ |

### Week 2: orbit-agent & Desktop Loops + Integration

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 11 | Design orbit-agent Processing Loop | `orbit-agent/src/loop/processing-loop.ts` | ⬜ |
| 12 | Implement Memory Loader in orbit-agent | `orbit-agent/src/memory/loader.ts` | ⬜ |
| 13 | Implement Prompt Builder in orbit-agent | `orbit-agent/src/reasoning/prompt-builder.ts` | ⬜ |
| 14 | Implement LLM Invoker in orbit-agent | `orbit-agent/src/reasoning/llm-invoker.ts` | ⬜ |
| 15 | Implement Tool Call Extractor in orbit-agent | `orbit-agent/src/reasoning/tool-extractor.ts` | ⬜ |
| 16 | Create Tool Result Receiver in orbit-agent | `orbit-agent/src/loop/tool-result-receiver.ts` | ⬜ |
| 17 | Implement Memory Updater in orbit-agent | `orbit-agent/src/memory/updater.ts` | ⬜ |
| 18 | Design Desktop Tool Execution Loop | `packages/desktop/src/loop/tool-execution-loop.ts` | ⬜ |
| 19 | Implement Tool Request Handler (receives from Bridge) | `packages/desktop/src/tools/tool-request-handler.ts` | ⬜ |
| 20 | Implement Tool Result Reporter (sends to Bridge) | `packages/desktop/src/tools/tool-result-reporter.ts` | ⬜ |
| 21 | Implement State Persistence (in each component) | `packages/*/src/persistence/state.ts` | ⬜ |
| 22 | Create Error Recovery in Each Loop | `packages/*/src/loop/error-recovery.ts` | ⬜ |
| 23 | Implement Loop Health Monitoring (all components) | `packages/*/src/monitoring/health-check.ts` | ⬜ |
| 24 | Build Loop Telemetry and Metrics (all components) | `packages/*/src/monitoring/telemetry.ts` | ⬜ |
| 25 | Create Loop Configuration (speed, limits, etc.) | `packages/*/src/config/loop-config.ts` | ⬜ |
| 26 | Write Integration Tests for Distributed Event Loop | `tests/integration/distributed-loop.test.ts` | ⬜ |

---

## 📊 Total Progress

```
Layer 6: Event Loop           ░░░░░░░░░   0/26 steps
```

---

## Success Criteria

☐ Bridge event loop runs continuously, receives and routes events
☐ orbit-agent processing loop activates on request, completes reasoning
☐ Desktop tool execution loop activates on tool request, executes safely
☐ Events processed in correct order (FIFO with priority)
☐ Memory correctly loaded before reasoning (orbit-agent)
☐ Tools execute and results captured properly (Desktop)
☐ State persists across iterations (all components)
☐ Errors recovered gracefully (no crashes)
☐ Loop health monitoring detects stuck loops
☐ All three loops coordinate correctly through Bridge

---

## Distributed Event Loop Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BRIDGE EVENT LOOP (NestJS)                    │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  1. RECEIVE EVENTS (from all sources)              │    │
│  │     • Telegram webhook                               │    │
│  │     • WhatsApp webhook                               │    │
│  │     • Slack Events API                               │    │
│  │     • Discord Gateway                               │    │
│  │     • Desktop TUI (WebSocket)                        │    │
│  │     • External webhooks                               │    │
│  │     • Timer scheduler                               │    │
│  │     • Internal system hooks                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  2. NORMALIZE EVENTS                               │    │
│  │     • Transform to UnifiedEvent schema                 │    │
│  │     • Assign priority                                │    │
│  │     • Validate schema                                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  3. ENQUEUE EVENTS (priority queue)                 │    │
│  │     • Queue by priority (critical > high > normal > low)│    │
│  │     • Deduplicate events                             │    │
│  │     • Rate limit per source/user                     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  4. MANAGE SESSIONS                               │    │
│  │     • Get or create session for event                  │    │
│  │     • Track session activity                           │    │
│  │     • Timeout idle sessions                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  5. ROUTE EVENTS                                   │    │
│  │     • Determine: needs processing (orbit-agent)?        │    │
│  │     • Send to orbit-agent if needed                   │    │
│  │     • Otherwise, direct response                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  6. ORBIT-AGENT CLIENT (HTTP)                      │    │
│  │     POST http://localhost:8000/api/v1/agent/invoke   │    │
│  │     • Wait for response (tool call or answer)          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  7. HANDLE RESPONSE                                │    │
│  │                                                        │    │
│  │     If [tool call]:                                  │    │
│  │        • Route to Desktop via WebSocket                │    │
│  │        • Wait for tool result from Desktop            │    │
│  │        • Send result back to orbit-agent              │    │
│  │                                                        │    │
│  │     If [direct answer]:                              │    │
│  │        • Send to TUI via WebSocket                  │    │
│  │        • Send to messaging platforms                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  8. TOOL RESULT HANDLER (from Desktop)              │    │
│  │     POST /api/v1/tool/result                         │    │
│  │     • Forward to orbit-agent                         │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  9. FINAL RESPONSE HANDLER                        │    │
│  │     • Receive final response from orbit-agent            │    │
│  │     • Send to Desktop TUI (WebSocket)               │    │
│  │     • Send to messaging platforms                     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  [REPEAT FROM STEP 1]                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## orbit-agent Processing Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│              ORBIT-AGENT PROCESSING LOOP (Python)                 │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  1. RECEIVE REQUEST (from Bridge HTTP)              │    │
│  │     POST /api/v1/agent/invoke                       │    │
│  │     • Message content                                 │    │
│  │     • Session ID                                     │    │
│  │     • Event metadata                                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  2. LOAD MEMORY (from ~/.orbit/memory/)             │    │
│  │     • Identity memory (user profile, facts)          │    │
│  │     • Episodic memory (recent sessions)               │    │
│  │     • Procedural memory (workflows, procedures)       │    │
│  │     • Search for relevant chunks                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  3. BUILD PROMPT                                   │    │
│  │     • System instructions                            │    │
│  │     • Memory context                                 │    │
│  │     • Current event/message                           │    │
│  │     • Apply token limits                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  4. INVOKE LLM                                    │    │
│  │     • Call configured provider (OpenAI/Anthropic)     │    │
│  │     • Support streaming                               │    │
│  │     • Handle errors (retry, fallback)                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  5. INTERPRET RESPONSE                              │    │
│  │                                                        │    │
│  │     If [tool call detected]:                          │    │
│  │        • Extract tool name and arguments               │    │
│  │        • Return tool call to Bridge                   │    │
│  │        • Wait for tool result (via /tool/result)     │    │
│  │                                                        │    │
│  │     If [direct answer]:                              │    │
│  │        • Return answer to Bridge                       │    │
│  │                                                        │    │
│  │     If [need more tools]:                             │    │
│  │        • Rebuild prompt with tool results             │    │
│  │        • Invoke LLM again                             │    │
│  │        • Repeat until done                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  6. TOOL RESULT RECEIVER (from Bridge)              │    │
│  │     POST /api/v1/tool/result                         │    │
│  │     • Extract tool output                            │    │
│  │     • Continue processing with result                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  7. UPDATE MEMORY (if important)                  │    │
│  │     • Write to ~/.orbit/memory/                      │    │
│  │     • Update episodic memory                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  [WAIT FOR NEXT REQUEST]                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Desktop Tool Execution Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│            DESKTOP TOOL EXECUTION LOOP (Node.js)                  │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  1. CONNECT TO BRIDGE (WebSocket)                   │    │
│  │     ws://localhost:3000/ws/desktop                      │    │
│  │     • Send heartbeat                                  │    │
│  │     • Listen for messages                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  2. WAIT FOR TOOL REQUEST                          │    │
│  │     • Message from Bridge: {                          │    │
│  │         type: "toolExecution",                      │    │
│  │         tool: "executeCommand",                      │    │
│  │         args: { ... }                               │    │
│  │       }                                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  3. CHECK PERMISSIONS                               │    │
│  │     • Determine permission level (auto/ask/deny)       │    │
│  │     • If "ask": prompt user via TUI                 │    │
│  │     • If "deny": reject and return error              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  4. LOAD TOOL FROM REGISTRY                       │    │
│  │     • Get tool implementation                        │    │
│  │     • Validate tool exists                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  5. VALIDATE ARGUMENTS                             │    │
│  │     • Check against tool schema                       │    │
│  │     • Apply default values                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  6. LOG AUDIT ENTRY                                │    │
│  │     • Record tool execution                           │    │
│  │     • Timestamp, user, arguments                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  7. EXECUTE TOOL (SANDBOX)                        │    │
│  │     • Spawn child process                            │    │
│  │     • Enforce timeout                               │    │
│  │     • Enforce resource limits                        │    │
│  │     • Capture stdout/stderr                           │    │
│  │     • Handle errors                                  │    │
│  │     • Retry on transient failures (if configured)       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  8. PROCESS RESULT                                 │    │
│  │     • Parse output                                  │    │
│  │     • Validate result                                │    │
│  │     • Format for Bridge                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  9. SEND RESULT TO BRIDGE (HTTP)                    │    │
│  │     POST http://localhost:3000/api/v1/tool/result     │    │
│  │     {                                                │    │
│  │       executionId: "exec-123",                       │    │
│  │       tool: "executeCommand",                        │    │
│  │       result: { success, stdout, stderr, ... }      │    │
│  │     }                                                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  [WAIT FOR NEXT TOOL REQUEST]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Complete Example Flow

```
User sends: "Check my git status"

1. Bridge receives event (from Desktop TUI)
   └─ Normalizes to UnifiedEvent

2. Bridge enqueues event (normal priority)

3. Bridge routes to orbit-agent
   POST http://localhost:8000/api/v1/agent/invoke

4. orbit-agent processing loop activates
   ├─ Loads memory from ~/.orbit/memory/
   ├─ Builds prompt
   ├─ Invokes LLM
   └─ LLM returns: Use tool executeCommand('git status')

5. orbit-agent returns tool call to Bridge

6. Bridge receives tool call
   └─ Routes to Desktop via WebSocket

7. Desktop tool execution loop activates
   ├─ Checks permissions (ask)
   ├─ User confirms
   ├─ Loads tool from registry
   ├─ Validates arguments
   ├─ Logs audit entry
   ├─ Executes in sandbox
   └─ Captures result

8. Desktop sends result to Bridge
   POST http://localhost:3000/api/v1/tool/result

9. Bridge receives result
   └─ Forwards to orbit-agent

10. orbit-agent receives result
    ├─ Continues processing
    ├─ No more tools needed
    └─ Generates final response

11. orbit-agent returns final response to Bridge

12. Bridge receives final response
    └─ Sends to Desktop TUI via WebSocket

13. Desktop TUI displays to user
    "Your git status: On branch main, Your branch is up to date..."
```

---

## Event Loop States

| Component | States | Description |
|-----------|---------|-------------|
| **Bridge** | Idle, Processing, Error, Stopped | Main orchestration loop |
| **orbit-agent** | Idle, Processing, WaitingForResult, Error | On-demand processing |
| **Desktop** | Idle, ExecutingTool, Error, Stopped | Tool execution loop |

---

## Safety Limits (Per Component)

| Component | Limit | Description |
|-----------|-------|-------------|
| **Bridge** | 10,000 max queue size | Prevent memory exhaustion |
| **Bridge** | 100 events/second per source | Rate limiting |
| **orbit-agent** | 10 iterations per request | Prevent infinite loops |
| **orbit-agent** | 5 minute max processing time | Timeout safeguard |
| **Desktop** | 30 second tool timeout | Per-tool limit |
| **Desktop** | 512MB max memory | Resource limit |

---

## Health Monitoring

Each component publishes health:

```json
// Bridge Health
{
  "component": "bridge",
  "status": "healthy",
  "queueSize": 23,
  "activeConnections": 5,
  "lastActivity": "2026-03-01T10:30:00Z"
}

// orbit-agent Health
{
  "component": "orbit-agent",
  "status": "idle",
  "activeRequests": 0,
  "pendingToolResults": 0,
  "lastActivity": "2026-03-01T10:29:45Z"
}

// Desktop Health
{
  "component": "desktop",
  "status": "idle",
  "activeToolExecutions": 0,
  "pendingResults": 0,
  "lastActivity": "2026-03-01T10:30:15Z"
}
```

---

## Error Recovery Strategies

| Error Type | Component | Recovery Strategy |
|-------------|------------|------------------|
| **LLM timeout** | orbit-agent | Retry 3x, fallback to alternative provider |
| **Tool timeout** | Desktop | Kill process, return error, orbit-agent tries alternative |
| **Network error** | Bridge | Retry with exponential backoff |
| **Memory error** | orbit-agent | Use cached fallback, continue without memory |
| **WebSocket disconnect** | Bridge/Desktop | Reconnect with backoff, queue events during disconnect |

---

## File Structure

```
packages/bridge/src/
├── loop/
│   ├── event-lifecycle.ts
│   ├── event-flow.ts
│   └── error-recovery.ts
├── gateway/
│   ├── event-queue.ts
│   ├── event-router.ts
│   ├── rate-limiter.ts
│   ├── tool-result-handler.ts
│   └── response-handler.ts
├── session/
│   └── session-manager.ts
├── clients/
│   ├── orbit-agent-client.ts
│   └── desktop-websocket-client.ts
└── monitoring/
    ├── health-check.ts
    └── telemetry.ts

orbit-agent/src/
├── loop/
│   ├── processing-loop.ts
│   ├── tool-result-receiver.ts
│   └── error-recovery.ts
├── memory/
│   ├── loader.ts
│   └── updater.ts
├── reasoning/
│   ├── prompt-builder.ts
│   ├── llm-invoker.ts
│   └── tool-extractor.ts
└── monitoring/
    ├── health-check.ts
    └── telemetry.ts

packages/desktop/src/
├── loop/
│   ├── tool-execution-loop.ts
│   └── error-recovery.ts
├── tools/
│   ├── tool-request-handler.ts
│   └── tool-result-reporter.ts
└── monitoring/
    ├── health-check.ts
    └── telemetry.ts
```

---

## Dependencies

**Requires**: All previous layers complete
- Layer 1 (Gateway Layer) - Bridge event queue, routing
- Layer 2 (Reasoning Layer) - orbit-agent LLM integration
- Layer 3 (Memory System) - Desktop memory writing
- Layer 5 (Tool Execution) - Desktop tool execution

**Enables**: Layer 7 (Desktop Runtime Integration)
- Autonomous daemon for desktop deployment
- Full coordination between all components

---

> **Document Version**: 1.0
> **Last Updated**: 2026-03-01
> **Status**: Ready for Implementation
