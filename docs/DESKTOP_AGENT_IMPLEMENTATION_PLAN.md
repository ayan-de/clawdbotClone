# Desktop Autonomous AI Agent — Complete Implementation Plan

> **Status**: Design Phase | **Last Updated**: 2026-02-28
> **Target**: Production-grade local autonomous AI agent with persistent memory and event-driven execution

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture Requirements](#architecture-requirements)
3. [Implementation Phases](#implementation-phases)
4. [Deployment Strategy](#deployment-strategy)
5. [Deployment Architecture](#deployment-architecture)
6. [Memory and Event Integration](#memory--event-integration)
7. [Safety Requirements](#safety-requirements)
8. [Implementation Sequence](#implementation-sequence)

---

## SYSTEM OVERVIEW

### Current Project State

The Orbit project currently consists of:

1. **Bridge Server** (NestJS)
   - Routes messages from Telegram, WhatsApp, Slack, Discord to desktop clients
   - Layered architecture (application/infrastructure/presentation)
   - User authentication (JWT, Google OAuth)
   - Session management with PostgreSQL
   - WebSocket support for real-time communication

2. **Orbit-Agent** (Python)
   - AI agent with LangGraph for workflow orchestration
   - FastAPI for REST/WebSocket endpoints
   - Multi-LLM support (OpenAI, Anthropic, Gemini)
   - Currently in Phase 1 (9/93 implementation steps complete)
   - Shell tool with safety verification

3. **Desktop TUI** (Node.js)
   - Basic structure/skeleton established
   - Planned: Terminal interface, WebSocket client to Bridge, command handler

4. **Web Dashboard** (Next.js)
   - User signup and authentication
   - OAuth callback handling
   - System overview interface

### Deployment Goal

Enable end-users to run a single installation command that deploys:

1. **Local autonomous agent** with:
   - Continuous event loop processing
   - Persistent memory (markdown + vector search)
   - Tool execution sandbox
   - Safe, modular, extensible architecture

2. **LLM provider integration**:
   - User's choice of OpenAI, Anthropic, or local Ollama
   - Configurable via simple setup wizard

3. **Bridge connectivity**:
   - Connects to existing NestJS Bridge for routing
   - Supports messaging apps (Telegram, WhatsApp, etc.)

4. **Desktop integration**:
   - System daemon for background execution
   - TUI for direct interaction
   - System tray for status monitoring

---

## ARCHITECTURE REQUIREMENTS

The autonomous agent must implement four core layers, each with specific responsibilities and implementation requirements.

### Layer 1: Gateway Layer (Input Router / Event Gateway)

**Purpose**: Central entry point and message broker for all incoming inputs.

**Responsibilities**:
- Accept input from multiple sources:
  - User messages (Telegram, WhatsApp, Slack, Discord)
  - Timer events (scheduled cron jobs, heartbeats)
  - Internal system hooks (file changes, process events)
  - External webhooks (GitHub, GitLab, custom integrations)
  - Other agents (multi-agent coordination)

- Normalize all inputs into unified event format
- Queue events for processing with priority levels
- Maintain session isolation per channel/user
- Run as persistent background process

**Unified Event Schema**:
```typescript
interface UnifiedEvent {
  id: string;                    // Unique event identifier
  timestamp: Date;               // When the event occurred
  source: EventSource;             // Where the event came from
  type: EventType;                 // What kind of event it is
  payload: Record<string, any>;    // The actual event data
  metadata: EventMetadata;          // Additional context (user_id, session_id, etc.)
  priority: EventPriority;          // Processing priority (low, normal, high, critical)
}

type EventSource = 'telegram' | 'whatsapp' | 'slack' | 'discord' | 'desktop-tui' | 'timer' | 'webhook' | 'internal' | 'agent';

type EventType = 'message' | 'command' | 'timer' | 'webhook' | 'file-change' | 'process-event' | 'coordination';

type EventPriority = 'low' | 'normal' | 'high' | 'critical';

interface EventMetadata {
  userId?: string;               // User identifier
  sessionId?: string;            // Conversation session ID
  channel?: string;              // Specific channel within source
  traceId?: string;             // For distributed tracing
  tags?: string[];              // For filtering/routing
}
```

**Key Implementation Components**:
1. **Event Queue**: In-memory priority queue (or Redis for distributed)
2. **Input Adapters**: Separate modules for each source type
3. **Event Normalizer**: Transforms source-specific formats to unified schema
4. **Session Manager**: Maintains active sessions per channel
5. **Heartbeat Monitor**: Detects stale connections, sends keep-alive pings
6. **Event Router**: Routes events to appropriate handlers based on type/metadata

**Checklist**:
- ☐ Define unified event schema with all required fields
- ☐ Implement event queue system with priority levels
- ☐ Implement input adapter for Desktop TUI (WebSocket)
- ☐ Implement input adapter for Telegram (HTTP/Webhook)
- ☐ Implement input adapter for WhatsApp (HTTP/Webhook)
- ☐ Implement input adapter for Slack (Events API)
- ☐ Implement input adapter for Discord (Gateway)
- ☐ Implement input adapter for Timer/Cron Scheduler
- ☐ Implement input adapter for Internal System Hooks (fs.watch, process events)
- ☐ Implement input adapter for External Webhooks (POST endpoints)
- ☐ Implement input adapter for Multi-Agent Coordination
- ☐ Implement event normalization middleware (format transformation)
- ☐ Implement session manager with isolation per channel
- ☐ Implement heartbeat monitoring (detect disconnects)
- ☐ Implement event routing based on source and type
- ☐ Design event deduplication mechanism (prevent duplicates)
- ☐ Build rate limiting per source/user
- ☐ Implement event replay capability (for debugging/recovery)

---

### Layer 2: Reasoning Layer (LLM Orchestrator)

**Purpose**: Construct prompts, manage context, and invoke LLM for reasoning.

**Responsibilities**:
- Build megaprompt from multiple sources:
  - System instructions (agent personality, behavior)
  - Memory (identity, episodic, procedural)
  - Session context (recent conversation history)
  - Current event (user message/task)

- Manage context window constraints:
  - Token counting and limit enforcement
  - Intelligent truncation (keep most relevant content)
  - Model selection based on complexity

- Invoke LLM providers:
  - OpenAI (GPT-4, GPT-4o, GPT-4o-mini)
  - Anthropic (Claude 3 Opus, Sonnet, Haiku)
  - Ollama (local models like Llama, Mistral)
  - Provider abstraction for easy switching

- Interpret LLM responses:
  - Extract tool calls (if using function calling)
  - Parse natural language responses
  - Convert to actions or responses

**Prompt Assembly Pipeline**:

```
1. Load System Prompt
   ├─ Agent personality and behavior
   ├─ Tool descriptions and usage patterns
   └─ Safety guidelines

2. Load Identity Memory
   ├─ User preferences
   ├─ Known facts about user
   └─ User context (name, role, environment)

3. Load Relevant Episodic Memory
   ├─ Recent session context
   ├─ Relevant past interactions
   └─ Important events

4. Load Procedural Memory
   ├─ Available workflows
   ├─ Learned procedures
   └─ Best practices

5. Load Current Event
   ├─ User message/task
   ├─ Event metadata (source, context)
   └─ Available tools/capabilities

6. Apply Token Limits
   ├─ Count total tokens
   ├─ Prioritize content (system > identity > episodic > event)
   ├─ Truncate if needed (keep most recent/important)
   └─ Reserve space for LLM response

7. Build Final Megaprompt
   ├─ Combine all sections
   ├─ Add variable interpolation (user name, date, etc.)
   └─ Validate format and structure
```

**Checklist**:
- ☐ Design prompt assembly pipeline with clear stages
- ☐ Implement context loader for memory retrieval
- ☐ Implement memory loader for session history (with pagination)
- ☐ Implement system prompt template system (version-controlled)
- ☐ Build context window manager (token counting, limit enforcement)
- ☐ Implement model selection logic (simple queries → smaller models)
- ☐ Build prompt builder with variable interpolation
- ☐ Implement LLM provider abstraction (factory pattern)
- ☐ Create response interpreter for LLM outputs
- ☐ Build tool call extraction from LLM responses
- ☐ Implement response routing (direct response vs. tool execution)
- ☐ Design fallback mechanisms for LLM failures (retry, alternate provider)
- ☐ Implement streaming response handling (for real-time feedback)
- ☐ Build cost tracking per model/provider
- ☐ Create prompt versioning system (A/B testing, rollbacks)

---

### Layer 3: Memory System

The memory system has two major components: A) Markdown storage for durable persistence, and B) Vector search for efficient retrieval.

#### A) Memory Storage (Markdown-based)

**Purpose**: Store agent's knowledge in human-readable markdown files for inspection and editing.

**Memory Types**:

1. **Semantic Memory** (Long-term, factual)
   - User identity (name, role, preferences)
   - Facts about user (skills, projects, habits)
   - Environment context (OS, shell,常用命令)
   - File: `memory/identity/user_profile.md`

2. **Episodic Memory** (Time-based, narrative)
   - Session logs: Complete conversation transcripts
   - Daily logs: Summary of daily activities and learnings
   - Session snapshots: Important moments worth preserving
   - Files: `memory/episodic/sessions/session_YYYY-MM-DD_NNN.md`
   - Files: `memory/episodic/daily/YYYY-MM-DD.md`

3. **Procedural Memory** (Action-oriented, learned)
   - Workflows: Multi-step procedures for common tasks
   - Learned procedures: Patterns discovered through interaction
   - Best practices: Effective approaches the agent has learned
   - Files: `memory/procedural/workflows.md`
   - Files: `memory/procedural/learned_procedures.md`

**Directory Structure**:
```
~/.orbit/memory/
├── identity/
│   ├── user_profile.md        # User name, role, preferences
│   ├── facts.md              # Known facts about user
│   ├── environment.md         # OS, shell, paths,常用工具
│   └── contacts.md           # Known people, their roles
├── episodic/
│   ├── sessions/
│   │   ├── session_2024-02-28_001.md
│   │   ├── session_2024-02-28_002.md
│   │   └── session_2024-02-28_003.md
│   └── daily/
│       ├── 2024-02-26.md
│       ├── 2024-02-27.md
│       └── 2024-02-28.md
└── procedural/
    ├── workflows.md           # Pre-defined workflows
    ├── learned_procedures.md   # Agent-discovered procedures
    └── best_practices.md     # Effective approaches
```

**Memory Lifecycle Operations**:

1. **Bootstrap Memory Loading** (Agent Start)
   - Load identity memory into context
   - Load recent episodic memory (last 24 hours)
   - Load procedural memory (workflows, procedures)
   - Initialize memory write queue

2. **Memory Write Triggers**:
   - **On important events detected**:
     - User explicitly says "remember this"
     - Agent learns a new fact about user
     - Task completion with valuable outcome
     - Error discovery and resolution
   - **Before context compaction**:
     - When approaching token limit
     - Before summarizing old context
     - Ensure important info preserved
   - **On session end**:
     - Generate session summary
     - Write complete session log
     - Update daily log with key events
   - **On periodic consolidation**:
     - Daily: Consolidate multiple sessions into daily summary
     - Weekly: Summarize week's learnings
     - Monthly: Generate monthly retrospective

3. **Memory Consolidation**:
   - **Compaction Trigger**:
     - Context window approaching limit (80% of max tokens)
     - Multiple sessions in single day
     - Detected redundancy across memory files

   - **Important Info Extraction**:
     - Use LLM to identify:
       - Key facts to preserve
       - Important decisions made
       - Successful patterns
       - Errors and their resolutions
     - Apply importance scoring to extracted information

   - **Summary Generation**:
     - Create condensed summary of old memory
     - Maintain key details while reducing token count
     - Use bullet points for clarity
     - Include links to original sources

   - **Save Durable Memory**:
     - Write summary to episodic/daily log
     - Update identity memory with new facts
     - Archive old session logs (compress or move to archive)

   - **Memory Overwrite Logic**:
     - Detect contradictory information
     - Use timestamp for freshness (newer = more accurate)
     - Mark conflicting entries for manual review
     - Apply confidence scores for uncertain information

**Markdown File Format Example**:

```markdown
# Session Log: 2024-02-28_001

**Date**: 2024-02-28T14:30:00Z
**User**: John
**Session ID**: abc123
**Duration**: 15 minutes

## Conversation Summary

User asked about checking git status and switching branches. Agent guided through git workflow.

## Key Events

1. User requested git status
2. Agent detected uncommitted changes
3. User decided to create new feature branch
4. Agent suggested branching strategy (feature/ prefix)
5. User approved and agent executed commands

## Commands Executed

```bash
git status
git checkout -b feature/new-auth
git add .
git commit -m "feat: add new authentication module"
```

## Outcomes

✅ Successfully created feature branch
✅ Committed changes with descriptive message
⚠️ User mentioned wanting to push tomorrow

## Learnings

- User prefers feature branch naming convention
- User works on authentication module
- User tends to commit with descriptive messages
```

**Checklist**:
- ☐ Design memory directory structure with clear separation
- ☐ Implement identity memory schema and write service
- ☐ Implement episodic memory schema (session logs, daily logs)
- ☐ Implement procedural memory schema (workflows, procedures)
- ☐ Create memory write service with file operations
- ☐ Implement memory read service with parsing
- ☐ Design memory consolidation algorithm
- ☐ Implement memory compaction trigger (token-based)
- ☐ Build important information extraction (LLM-assisted)
- ☐ Create summary generation system (multi-level)
- ☐ Implement memory overwrite logic (conflict resolution)
- ☐ Design memory backup/restore mechanism
- ☐ Implement bootstrap memory loading on agent start
- ☐ Implement memory write on important events detected
- ☐ Implement memory write before compaction trigger
- ☐ Implement memory write on session end
- ☐ Implement periodic memory consolidation (scheduled job)
- ☐ Create memory integrity checks (detect corruption)

---

#### B) Memory Search System (Hybrid Search)

**Purpose**: Efficiently retrieve relevant memory chunks using both keyword and semantic search.

**Search Engine Design**:

The memory search system combines two complementary approaches:

1. **Keyword Search (BM25)**:
   - Fast, exact matches
   - Good for specific terms, IDs, names
   - No embedding generation required
   - Implementation: BM25 algorithm with term frequency scoring

2. **Semantic Search (Vector Embeddings)**:
   - Understands meaning and context
   - Good for vague queries, synonyms
   - Requires embedding generation (LLM API or local)
   - Implementation: Cosine similarity on vector embeddings

**Hybrid Search Workflow**:

```
User Query: "what did I do with git yesterday?"
           ↓
    ┌────────────┴────────────┐
    ↓                         ↓
Keyword Search            Semantic Search
(BM25 scoring)           (Vector similarity)
    ↓                         ↓
Top K Results            Top K Results
    └────────────┬────────────┘
                 ↓
      Result Fusion
  (Reciprocal Rank Fusion
   or weighted blend)
                 ↓
         Top N Candidates
                 ↓
      Reranking System
  (Context-aware scoring)
                 ↓
       Final Top M Results
                 ↓
    Inject into Prompt
```

**Chunking System**:

Memory files must be divided into searchable chunks:

- **Chunking Strategies**:
  1. **Paragraph-based**: Split at paragraph boundaries (natural semantic units)
  2. **Section-based**: Split at markdown headers (logical divisions)
  3. **Fixed-size**: Split at N tokens (consistent chunk sizes)
  4. **Hybrid**: Combine approaches (e.g., section-based with max size)

- **Chunk Metadata**:
  ```json
  {
    "id": "chunk_001",
    "source": "memory/episodic/sessions/session_2024-02-28_001.md",
    "content": "User asked about checking git status...",
    "section": "Key Events",
    "timestamp": "2024-02-28T14:30:00Z",
    "tags": ["git", "branch", "feature"]
  }
  ```

**Embedding Generation**:

- **Providers**:
  - OpenAI: `text-embedding-3-small` (fast, cost-effective)
  - Anthropic: Embeddings API (Claude 3)
  - Ollama: Local embedding models (nomic-embed-text, etc.)

- **Storage Options**:
  1. **Local files**: JSON files with vectors (simple, no DB)
  2. **Vector database**: PostgreSQL with pgvector (scalable)
  3. **In-memory**: FAISS index (fastest, ephemeral)

- **Incremental Indexing**:
  - Only embed new chunks (not entire memory)
  - Reindex on major changes only
  - Track last indexed timestamp per file

**Result Fusion Algorithms**:

1. **Reciprocal Rank Fusion (RRF)**:
   - Combines rankings from multiple sources
   - Formula: `score = Σ 1/(k + rank_position)`
   - k is constant (typically 60)

2. **Weighted Blend**:
   - Assign weights to each search type
   - Formula: `score = α * keyword_score + (1-α) * semantic_score`
   - α determined empirically or dynamically

**Reranking System**:

- Improve relevance by considering context:
  - **Temporal proximity**: Prefer recent memories
  - **Session continuity**: Prefer memories from same session
  - **User preferences**: Boost frequently referenced memories
  - **Query similarity**: Higher weight for exact matches
  - **Confidence scores**: From memory importance extraction

**Cache Strategy**:

- Cache frequent queries
- TTL-based invalidation (e.g., 1 hour)
- LRU eviction when cache full
- Precompute embeddings for common queries

**Checklist**:
- ☐ Implement markdown chunking system with multiple strategies
- ☐ Design chunking strategies (paragraph, section, fixed-size)
- ☐ Create chunk metadata structure
- ☐ Implement embedding generation system (multi-provider)
- ☐ Design vector storage system (local files or pgvector)
- ☐ Implement keyword index system (BM25 algorithm)
- ☐ Build search engine with hybrid scoring
- ☐ Design result fusion algorithm (RRF or weighted blend)
- ☐ Implement reranking system (context-aware)
- ☐ Create memory retrieval pipeline (search → rank → fuse → rerank → retrieve)
- ☐ Build cache for frequent searches
- ☐ Design query expansion for better recall
- ☐ Implement incremental indexing (new chunks only)
- ☐ Create reindexing job (major changes, scheduled)

---

### Layer 4: Tool / Execution Layer

**Purpose**: Allow agent to act in the world through safe, isolated tool execution.

**Tool Architecture**:

All tools implement a common interface:

```typescript
interface ToolDefinition {
  name: string;                    // Unique tool identifier
  description: string;             // What the tool does (for LLM)
  category: ToolCategory;            // file, shell, network, memory, etc.
  parameters: ToolParameter[];        // Schema for tool arguments
  riskLevel: RiskLevel;            // low, medium, high, critical
  permission: PermissionLevel;       // auto, ask, deny
  timeout: number;                  // Max execution time in ms
  dependencies?: string[];          // Other tools this tool requires
}

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type PermissionLevel = 'auto' | 'ask' | 'deny';
type ToolCategory = 'file' | 'shell' | 'network' | 'memory' | 'system' | 'custom';
```

**Tool Registry**:

- Auto-discovery: Scan `tools/` directory for tool definitions
- Manual registration: Explicit registration via configuration
- Metadata storage: Tool capabilities, permissions, dependencies
- Dynamic loading: Load tools at runtime (hot-reload for development)

**Tool Execution Sandbox**:

- **Filesystem Isolation**:
  - Restrict to allowed directories
  - Path validation (no directory traversal)
  - File permission checks

- **Process Isolation**:
  - Execute in separate process (child_process.spawn)
  - Resource limits (CPU, memory)
  - Timeout enforcement

- **Network Isolation** (optional):
  - Whitelist allowed domains
  - Rate limit per domain
  - Block dangerous protocols

**Permission Model**:

1. **Auto**: Tool executes without confirmation
   - Low-risk operations (read file, list directory)
   - Pre-approved by user (configuration)
   - Idempotent operations (ls, pwd)

2. **Ask**: Tool requires user confirmation
   - Medium-risk operations (write file, run shell command)
   - High-risk operations (delete file, network request)
   - Interactive prompts with explanation

3. **Deny**: Tool is completely blocked
   - Critical-risk operations (system shutdown, format disk)
   - Explicitly denied by user
   - Dangerous patterns (rm -rf /, sudo commands)

**Tool Timeout System**:

- Per-tool timeout (configured in tool definition)
- Global timeout (maximum any tool can run)
- Timeout handlers (graceful shutdown, cleanup)
- Retry mechanism with exponential backoff

**Tool Dependency Management**:

- Tools can depend on other tools
- Dependency graph traversal for execution order
- Circular dependency detection
- Parallel execution of independent tools

**Tool Composition**:

- Chains: Sequence of tools (tool A → tool B → tool C)
- Conditionals: If tool A succeeds, run tool B
- Loops: Repeat tool N times or until condition
- Fallback: If tool A fails, try tool B

**Tool Retry Mechanism**:

- Configurable retry count per tool
- Exponential backoff (1s, 2s, 4s, 8s...)
- Retry on specific errors (network, timeout)
- No retry on fatal errors (permission denied, invalid input)

**Tool Logging and Audit Trail**:

- Log all tool executions (timestamp, arguments, result)
- Store execution duration
- Record errors and stack traces
- Export audit log for compliance

**Core Tools to Implement**:

**File System Tools**:
```typescript
- readFile(path): string              // Read file content
- writeFile(path, content): void        // Write content to file
- listDirectory(path): string[]        // List directory contents
- createDirectory(path): void          // Create new directory
- deleteFile(path): void              // Delete file (ask permission)
- searchFiles(pattern): string[]       // Search files by pattern
```

**Shell Execution Tools**:
```typescript
- executeCommand(command, cwd): Result   // Execute shell command (ask permission)
- getWorkingDirectory(): string         // Get current directory
- listProcesses(): Process[]            // List running processes
```

**Network Tools**:
```typescript
- httpRequest(url, method, body): Response  // HTTP request (ask permission)
- websocketConnect(url): Connection           // WebSocket connection
- triggerWebhook(url, payload): void         // Send webhook payload
```

**Memory Tools**:
```typescript
- remember(fact): void                  // Store important fact (auto permission)
- retrieveMemory(query): MemoryChunk[]   // Search memory
- updatePreference(key, value): void     // Update user preference
```

**Checklist**:
- ☐ Design tool registry system (discovery, registration)
- ☐ Create tool base class with standard interface
- ☐ Define tool schema (parameters, risk level, etc.)
- ☐ Implement tool execution sandbox (filesystem + process isolation)
- ☐ Design tool permission model (ask, auto, deny)
- ☐ Build tool result handling (parsing, validation)
- ☐ Create tool timeout system with handlers
- ☐ Implement tool dependency management (graph traversal)
- ☐ Design tool composition patterns (chains, conditionals)
- ☐ Build tool retry mechanism with backoff
- ☐ Create tool logging and audit trail
- ☐ Design tool capability declaration
- ☐ Implement tool versioning (backward compatibility)
- ☐ Implement core file system tools (read, write, list, delete, search)
- ☐ Implement core shell tools (execute, get cwd, list processes)
- ☐ Implement core network tools (http request, websocket, webhook)
- ☐ Implement core memory tools (remember, retrieve, update preference)

---

## IMPLEMENTATION PHASES

The implementation is divided into 10 phases, each with clear deliverables and estimated effort.

### Phase 1 — Core Runtime Foundation

**Duration**: 2 weeks

**Goal**: Establish the fundamental infrastructure for the autonomous agent runtime.

**Deliverables**:
- Unified event schema
- Event queue with priority
- Background process manager
- Logging infrastructure
- Configuration management
- Error handling framework

**Checklist**:
- ☐ Define unified event schema across all components
- ☐ Implement event queue system with priority levels
- ☐ Design session isolation per channel/user
- ☐ Create persistent background process manager
- ☐ Implement graceful startup/shutdown handling
- ☐ Design process monitoring and health checks
- ☐ Create logging infrastructure with structured events
- ☐ Implement configuration management layer
- ☐ Design error handling and recovery patterns
- ☐ Create metrics collection framework

**Success Criteria**:
- Event queue accepts and processes events
- Background process runs reliably
- Logging produces structured, searchable logs
- Configuration can be changed without restart
- Errors are caught and logged with context

---

### Phase 2 — Gateway Layer

**Duration**: 3 weeks

**Goal**: Build central entry point for all input sources with normalization and routing.

**Deliverables**:
- Input adapters for all sources
- Event normalization middleware
- Session manager
- Heartbeat monitoring
- Event routing engine
- Rate limiting

**Checklist**:
- ☐ Implement input adapter for Desktop TUI (WebSocket)
- ☐ Implement input adapter for Telegram (HTTP/Webhook)
- ☐ Implement input adapter for WhatsApp (HTTP/Webhook)
- ☐ Implement input adapter for Slack (Events API)
- ☐ Implement input adapter for Discord (Gateway)
- ☐ Implement input adapter for Timer/Cron Scheduler
- ☐ Implement input adapter for Internal System Hooks
- ☐ Implement input adapter for External Webhooks
- ☐ Implement input adapter for Multi-Agent Coordination
- ☐ Implement event normalization middleware
- ☐ Build session manager with isolation per channel
- ☐ Implement heartbeat monitoring
- ☐ Create event routing based on source and type
- ☐ Design event deduplication mechanism
- ☐ Build rate limiting per source/user
- ☐ Implement event replay capability

**Success Criteria**:
- All input sources accept events
- Events normalized to unified schema
- Sessions properly isolated
- Heartbeats detect disconnects
- Events routed to correct handlers
- Rate limiting prevents abuse

---

### Phase 3 — Reasoning Layer

**Duration**: 2 weeks

**Goal**: Implement LLM integration with prompt assembly and response interpretation.

**Deliverables**:
- Prompt assembly pipeline
- Multi-LLM provider support
- Context window management
- Response interpretation
- Tool call extraction
- Streaming support

**Checklist**:
- ☐ Design prompt assembly pipeline with clear stages
- ☐ Implement context loader for memory retrieval
- ☐ Implement memory loader for session history
- ☐ Implement system prompt template system
- ☐ Build context window manager (token limits)
- ☐ Implement model selection based on task complexity
- ☐ Build prompt builder with variable interpolation
- ☐ Implement LLM provider abstraction (factory pattern)
- ☐ Create response interpreter for LLM outputs
- ☐ Build tool call extraction from LLM responses
- ☐ Implement response routing (direct response vs tool execution)
- ☐ Design fallback mechanisms for LLM failures
- ☐ Implement streaming response handling
- ☐ Build cost tracking per model/provider
- ☐ Create prompt versioning system

**Success Criteria**:
- Prompts assembled correctly from all sources
- LLM providers can be switched via config
- Context window respected and enforced
- LLM responses correctly interpreted
- Tool calls accurately extracted
- Streaming works without blocking

---

### Phase 4 — Memory System (Markdown Storage)

**Duration**: 2 weeks

**Goal**: Implement markdown-based persistent memory with lifecycle management.

**Deliverables**:
- Memory directory structure
- Memory read/write services
- Memory consolidation
- Summary generation
- Memory lifecycle operations

**Checklist**:
- ☐ Design memory directory structure
- ☐ Implement identity memory (user preferences, facts)
- ☐ Implement episodic memory (session logs, daily logs)
- ☐ Implement procedural memory (workflows, learned procedures)
- ☐ Create memory write service with file operations
- ☐ Implement memory read service with parsing
- ☐ Design memory consolidation process
- ☐ Implement memory compaction trigger
- ☐ Build important information extraction
- ☐ Create summary generation system
- ☐ Implement memory overwrite logic
- ☐ Design memory backup/restore mechanism
- ☐ Implement bootstrap memory loading on agent start
- ☐ Implement memory write on important events detected
- ☐ Implement memory write before compaction trigger
- ☐ Implement memory write on session end
- ☐ Implement periodic memory consolidation (daily)
- ☐ Implement memory compaction when token limit approached
- ☐ Design memory retention policy (archiving old sessions)
- ☐ Implement memory recovery from backup
- ☐ Create memory integrity checks

**Success Criteria**:
- Memory files created in correct structure
- Memory can be read and written reliably
- Consolidation produces useful summaries
- Important information preserved across compactions
- Bootstrap loads memory correctly on start

---

### Phase 5 — Memory Search System (Hybrid Search)

**Duration**: 3 weeks

**Goal**: Build efficient memory search combining keyword and semantic search.

**Deliverables**:
- Chunking system
- Embedding generation
- Vector storage
- Keyword index
- Hybrid search engine
- Result fusion
- Reranking
- Caching

**Checklist**:
- ☐ Implement markdown chunking system (semantic units)
- ☐ Design chunking strategies (paragraph, section, fixed-size)
- ☐ Implement embedding generation system (multi-provider)
- ☐ Design vector storage system (local files or pgvector)
- ☐ Implement keyword index system (BM25)
- ☐ Build search engine with hybrid scoring
- ☐ Design result fusion algorithm (keyword + semantic)
- ☐ Implement reranking system (context relevance)
- ☐ Create memory retrieval pipeline (search → rank → fuse → rerank → retrieve)
- ☐ Build cache for frequent searches
- ☐ Design query expansion for better recall
- ☐ Implement incremental indexing (new chunks only)

**Success Criteria**:
- Chunks created with appropriate granularity
- Embeddings generated efficiently
- Both keyword and semantic searches work
- Fusion produces relevant results
- Reranking improves relevance
- Cache reduces latency for common queries

---

### Phase 6 — Tool / Execution Layer

**Duration**: 2 weeks

**Goal**: Implement safe, isolated tool execution with sandboxing.

**Deliverables**:
- Tool registry
- Tool base class
- Execution sandbox
- Permission model
- Timeout system
- Retry mechanism
- Audit logging
- Core tools

**Checklist**:
- ☐ Design tool registry system (discovery, registration)
- ☐ Create tool base class with standard interface
- ☐ Implement tool execution sandbox
- ☐ Design tool permission model (ask, auto, deny)
- ☐ Build tool result handling (parsing, validation)
- ☐ Create tool timeout system
- ☐ Implement tool dependency management
- ☐ Design tool composition (chains of tools)
- ☐ Build tool retry mechanism with backoff
- ☐ Create tool logging and audit trail
- ☐ Design tool capability declaration
- ☐ Implement tool versioning
- ☐ Implement file system tools (read, write, list, delete, search)
- ☐ Implement shell tools (execute, get cwd, list processes)
- ☐ Implement network tools (http request, websocket, webhook)
- ☐ Implement memory tools (remember, retrieve, update preference)

**Success Criteria**:
- Tools discovered and registered automatically
- Tools execute in isolated environment
- Permission prompts work correctly
- Timeouts enforced
- Retries work on transient failures
- Audit logs capture all executions

---

### Phase 7 — Event Loop Integration

**Duration**: 2 weeks

**Goal**: Implement continuous autonomous event processing loop.

**Deliverables**:
- Event loop lifecycle
- Event processing pipeline
- Memory integration
- Prompt building integration
- LLM invocation
- Tool execution
- State persistence
- Error recovery

**Checklist**:
- ☐ Design event loop lifecycle (start → process → sleep → repeat)
- ☐ Implement event received → normalized → queued flow
- ☐ Build memory load before processing
- ☐ Implement prompt building pipeline in loop
- ☐ Integrate LLM invocation into loop
- ☐ Implement action interpretation from LLM response
- ☐ Build tool execution with result capture
- ☐ Implement memory update after action
- ☐ Design state persistence after each iteration
- ☐ Create error recovery within loop
- ☐ Implement loop iteration limits (safety guard)
- ☐ Design loop pause/resume mechanism

**Success Criteria**:
- Loop runs continuously
- Events processed in order
- Memory correctly loaded before reasoning
- Tools execute and results captured
- State persists across iterations
- Errors recovered gracefully

---

### Phase 8 — Desktop Runtime Integration

**Duration**: 3 weeks

**Goal**: Create local desktop deployment with service daemon and UI.

**Deliverables**:
- Service daemon
- System tray integration
- TUI interface
- Configuration system
- Plugin architecture
- Desktop integration
- Notification system

**Checklist**:
- ☐ Design local service daemon architecture
- ☐ Implement service manager (start/stop/restart/status)
- ☐ Build system tray process with status indicator
- ☐ Create local TUI (Terminal UI) for interaction
- ☐ Design local storage directory structure
- ☐ Implement configuration system (editable via UI)
- ☐ Build plugin system architecture (for extensions)
- ☐ Design desktop-specific security (file permissions, sandbox)
- ☐ Implement auto-update mechanism
- ☐ Create desktop notification system
- ☐ Build desktop integration (systemd service, launchd)

**Success Criteria**:
- Daemon runs as background service
- System tray shows correct status
- TUI allows direct interaction
- Configuration changes apply immediately
- Plugins can be loaded and unloaded
- Notifications appear for important events

---

### Phase 9 — Testing and Stabilization

**Duration**: 3 weeks

**Goal**: Ensure reliability with comprehensive test coverage.

**Deliverables**:
- Test architecture
- Unit tests
- Integration tests
- E2E tests
- Performance benchmarks
- Stress tests

**Checklist**:
- ☐ Design test architecture (unit, integration, e2e)
- ☐ Implement unit tests for all components
- ☐ Build integration tests for event flow
- ☐ Create e2e tests for full agent loop
- ☐ Implement memory system tests
- ☐ Build tool execution tests with mocking
- ☐ Create LLM integration tests with mock responses
- ☐ Design performance benchmarks
- ☐ Implement stress tests (high event load)
- ☐ Create failure scenario tests
- ☐ Build regression test suite
- ☐ Implement memory leak detection
- ☐ Design chaos testing (random failures)

**Success Criteria**:
- Unit test coverage > 80%
- Integration tests pass consistently
- E2E tests cover critical paths
- Performance meets baseline requirements
- System handles high load without degradation

---

### Phase 10 — Production Readiness

**Duration**: 2 weeks

**Goal**: Prepare for deployment to end users with installation, security, observability, documentation.

**Deliverables**:
- Installation scripts
- Security hardening
- Observability stack
- Documentation
- Packaging

**Checklist**:
- ☐ Create install.sh script with dependency checks
- ☐ Implement platform detection (Linux/macOS/Windows)
- ☐ Build interactive setup wizard
- ☐ Design first-run configuration flow
- ☐ Create uninstall script
- ☐ Build update mechanism
- ☐ Implement permission system (tool-level, user prompts)
- ☐ Design tool isolation (sandboxing)
- ☐ Create execution sandbox (containerized or limited)
- ☐ Implement memory protection (encryption at rest)
- ☐ Build secure local storage (file permissions)
- ☐ Design audit logging
- ☐ Implement secret management (API key encryption)
- ☐ Implement structured logging with levels
- ☐ Build metrics dashboard (optional web UI)
- ☐ Design alerting system (email, notifications)
- ☐ Create performance monitoring
- ☐ Implement error tracking (stack traces)
- ☐ Build usage analytics (opt-in)
- ☐ Write installation guide
- ☐ Create configuration reference
- ☐ Build troubleshooting guide
- ☐ Write tool development guide
- ☐ Create memory system documentation
- ☐ Design API reference (if exposing HTTP endpoints)
- ☐ Build quick start tutorial
- ☐ Create migration guide (upgrading versions)
- ☐ Build Linux binary distribution
- ☐ Build macOS app bundle (.dmg)
- ☐ Build Windows installer (.msi)
- ☐ Create Docker image for container users
- ☐ Design package signing
- ☐ Build release notes template
- ☐ Implement changelog generation

**Success Criteria**:
- Installation completes successfully on all platforms
- Security measures protect against common attacks
- System observability provides visibility
- Documentation enables users to self-service
- Packages install and run correctly

---

## DEPLOYMENT STRATEGY

### Option A: Single-Script Installation (Recommended for End Users)

**Target Audience**: Non-technical users who want quick setup

**User Experience**:
```bash
curl -fsSL https://install.orbit.sh | sh
```

**What the Script Does**:
1. **Platform Detection**
   - Identify OS (Linux, macOS, Windows)
   - Check architecture (x64, ARM)
   - Validate minimum requirements (Node.js 18+, Python 3.11+)

2. **Dependency Installation**
   - Install missing dependencies via package manager
   - Docker (if using containerized deployment)
   - Node.js, Python (if not present)

3. **Binary Download**
   - Download latest release for platform
   - Verify checksum
   - Extract to `~/.orbit/`

4. **System Integration**
   - Install systemd service (Linux) or launch agent (macOS)
   - Create desktop entry for app launcher
   - Set up system tray autostart

5. **First-Run Setup Wizard**
   - Interactive TUI or Web UI
   - LLM provider selection:
     - OpenAI → Prompt for API key
     - Anthropic → Prompt for API key
     - Ollama → Check if running or prompt for installation
   - Bridge URL (default: localhost:3000 or external URL)
   - Tool permissions (ask user for each risk level)

6. **Agent Start**
   - Launch daemon service
   - Show status in system tray
   - Open TUI for first interaction

**What Gets Installed**:
```
~/.orbit/
├── orbit-daemon          ← Service daemon binary
├── orbit-tui             ← TUI binary
├── config/
│   ├── agent.config.json
│   ├── llm.config.json
│   └── tools.config.json
├── data/
│   ├── memory/
│   ├── vector-index/
│   ├── sessions/
│   └── logs/
├── logs/
│   ├── orbit-daemon.log
│   └── orbit-tui.log
└── orbit-agent/           ← Python agent (if separate)
```

**Advantages**:
- One-command installation
- Automatic dependency handling
- Interactive setup wizard
- System integration out-of-the-box
- Easy for non-technical users

---

### Option B: Docker Compose (Recommended for Developers and Power Users)

**Target Audience**: Developers who want containerized deployment

**User Experience**:
```bash
git clone https://github.com/your-repo/orbit
cd orbit
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

**docker-compose.yml Structure**:
```yaml
version: '3.8'

services:
  orbit-agent:
    build: ./orbit-agent
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://orbit:password@db:5432/orbit
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
    volumes:
      - ./orbit-data:/data

  bridge:
    build: ./packages/bridge
    ports:
      - "3000:3000"
    environment:
      - NEON_DATABASE_URL=${NEON_DATABASE_URL}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=orbit
      - POSTGRES_USER=orbit
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama

volumes:
  postgres-data:
  orbit-data:
  ollama-data:
```

**Advantages**:
- Self-contained environment
- Easy to start/stop/destroy
- Persistent data volumes
- Reproducible across machines
- Good for development/testing

---

### Option C: Manual Installation (Recommended for Contributors)

**Target Audience**: Developers who want to modify and run from source

**User Experience**:
```bash
# Clone repository
git clone https://github.com/your-repo/orbit
cd orbit

# Install monorepo dependencies
pnpm install

# Install Python agent dependencies
cd orbit-agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run in development mode
pnpm dev

# Or build and run production
pnpm build
pnpm start
```

**Advantages**:
- Full control over build process
- Easy to modify and test changes
- No installation scripts to maintain
- Source code available for debugging

---

## DEPLOYMENT ARCHITECTURE

### Local Desktop Deployment (Primary Target)

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    User's Desktop                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ~/.orbit/                                                 │
│  ├─ orbit-daemon         ← Service daemon (Node.js)      │
│  │   ├─ Event Loop                                     │
│  │   ├─ Gateway Layer                                   │
│  │   ├─ Reasoning Layer (embedded or connects to agent)│
│  │   ├─ Memory System (markdown + vector)              │
│  │   └─ Tool Execution (local shell)                  │
│  │                                                         │
│  ├─ orbit-tui            ← TUI for direct interaction     │
│  │                                                         │
│  └─ System Tray Icon     ← Status, quick actions          │
│                                                             │
│  Communication:                                             │
│  ├─ Daemon ↔ Bridge Server (WebSocket)                     │
│  └─ Bridge ↔ Messaging Apps (Telegram, etc.)               │
└─────────────────────────────────────────────────────────────┘
```

**Flow**:
1. Daemon runs continuously as background service
2. Event loop processes incoming events from Bridge
3. Agent reasons using LLM (local API or via orbit-agent)
4. Tools execute on local machine (with sandbox)
5. Memory persisted to markdown files
6. Vector index updated for search
7. Results sent back via Bridge to messaging apps

**Advantages**:
- Privacy: All computation local
- Reliability: Works without internet (if using local LLM)
- Performance: No network latency for local operations
- Control: User has full visibility and control

---

### Hybrid Cloud-Local Deployment (Advanced)

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                        Cloud                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐ │
│  │Bridge       │   │Orbit Agent  │   │PostgreSQL   │ │
│  │Server       │←→│(Python)     │←→│Database     │ │
│  │(NestJS)     │   │(FastAPI)    │   │(Neon/managed)│ │
│  └─────────────┘   └─────────────┘   └─────────────┘ │
│         ↓                                              │
└─────────┼──────────────────────────────────────────────────────┘
          │ (WebSocket)
          ↓
┌─────────────────────────────────────────────────────────────┐
│                    User's Desktop                        │
├─────────────────────────────────────────────────────────────┤
│  Desktop TUI                ← Connects to Bridge         │
│  Local Tools Only          ← File ops, shell commands   │
│  Memory Cache (optional)   ← Optional local cache        │
└─────────────────────────────────────────────────────────────┘
```

**Flow**:
1. Bridge and Agent run in cloud (always available)
2. Desktop TUI connects to Bridge via WebSocket
3. Agent processes events in cloud
4. Local tools execute on desktop (only for file/shell operations)
5. Memory stored in PostgreSQL (with periodic backup to desktop)
6. User can control desktop from mobile (via Telegram/etc.)

**Advantages**:
- Availability: Bridge and Agent always online
- Mobile access: Control desktop from anywhere
- Resource sharing: Bridge serves multiple desktops
- Scalability: Add more agents to handle load

**Use Cases**:
- User wants mobile access to desktop
- Multiple desktops managed centrally
- Cloud LLM required (don't want local GPU)
- Team collaboration (shared Bridge)

---

## MEMORY + EVENT INTEGRATION

### Integration Points

**1. Memory Load at Session Start**
- **When**: Agent daemon starts or new session begins
- **What**: Load relevant memory into context
- **How**:
  - Read identity memory (always)
  - Read episodic memory (last N sessions, recent daily logs)
  - Read procedural memory (workflows, learned procedures)
  - Merge with session context

**2. Memory Write on Important Events**
- **When**: Event detected as important
- **Triggers**:
  - User says "remember this" or "don't forget"
  - Agent learns new fact about user
  - Task completion with valuable outcome
  - Error discovery and resolution
  - User preference expressed
- **How**:
  - Extract fact/information
  - Determine memory type (identity, episodic, procedural)
  - Write to appropriate markdown file
  - Update vector index (if search enabled)

**3. Memory Write Before Compaction Trigger**
- **When**: Context window approaching limit (e.g., 80%)
- **Why**: Ensure important info preserved before summarization
- **How**:
  - Identify important information in current context
  - Write to episodic memory (session checkpoint)
  - Trigger consolidation after compaction

**4. Memory Write on Session End**
- **When**: User closes session or timeout
- **What**: Generate session summary and persist
- **How**:
  - Summarize conversation with LLM
  - Extract key facts, decisions, outcomes
  - Write session log to episodic/sessions/
  - Update daily log with key events
  - Update identity if new facts learned

**5. Memory Consolidation (Periodic)**
- **When**: Scheduled job (daily, weekly)
- **What**: Merge and summarize to reduce redundancy
- **How**:
  - Detect duplicate information across memory files
  - Merge duplicates with metadata (timestamps, confidence)
  - Summarize old sessions (keep key info)
  - Update identity memory with consolidated facts
  - Archive old session logs

**6. Memory Compaction**
- **When**: Token limit reached (100% context window)
- **What**: Reduce context size while preserving important info
- **How**:
  - Use LLM to extract important information
  - Generate condensed summary
  - Replace old context with summary
  - Store removed context in episodic/archive/

**7. Memory Search Before Reasoning**
- **When**: LLM invocation about to happen
- **What**: Retrieve relevant context to inject into prompt
- **How**:
  - Extract key terms from user query
  - Run hybrid search (keyword + semantic)
  - Fuse and rerank results
  - Select top K relevant chunks
  - Inject into prompt as context

**8. Memory Indexing**
- **When**: New memory chunks created or files modified
- **What**: Update search index for fast retrieval
- **How**:
  - Chunk memory files into units
  - Generate embeddings for new chunks
  - Update vector index (append new, update existing)
  - Update keyword index (BM25)
  - Cache frequently accessed chunks

### Search Trigger Points

**Before LLM Invocation**:
- Retrieve top 5-10 relevant memory chunks
- Inject into context before current event
- Prioritize: identity > episodic > procedural

**On User Queries About Past**:
- "What did I do yesterday?" → Search daily logs
- "What was I working on last week?" → Search episodic memory
- "What do you know about me?" → Search identity memory
- "How do I usually handle X?" → Search procedural memory

**On Workflow Execution**:
- Search for relevant workflows in procedural memory
- Search for learned procedures for task type
- Inject workflow steps as context
- Allow LLM to adapt or skip steps

---

## SAFETY REQUIREMENTS IMPLEMENTATION

### Permission System

**Per-Tool Permission Levels**:

1. **Auto**: Execute without confirmation
   - **Criteria**:
     - Risk level: low
     - Operation: read-only, idempotent
     - Examples: `ls`, `pwd`, `cat file.txt`, memory retrieval

2. **Ask**: Require user confirmation
   - **Criteria**:
     - Risk level: medium or high
     - Operation: write, modify, network request
     - Examples: `mkdir`, `write file`, `http request`, `git commit`

3. **Deny**: Completely blocked
   - **Criteria**:
     - Risk level: critical
     - Operation: destructive, system-level
     - Examples: `rm -rf /`, `sudo`, `format disk`, `shutdown`

**Permission Configuration**:
```json
{
  "tools": {
    "readFile": "auto",
    "writeFile": "ask",
    "deleteFile": "ask",
    "executeCommand": "ask",
    "httpRequest": "ask",
    "remember": "auto",
    "systemShutdown": "deny"
  },
  "userOverrides": {
    "executeCommand": "ask",
    "httpRequest": "auto"
  }
}
```

**Prompt Example for "ask" Permission**:
```
The agent wants to execute the following command:

  Command: rm -rf /tmp/old-project
  Reason: Cleaning up temporary project directory

Do you want to allow this?

  [Y] Yes, execute
  [N] No, cancel
  [A] Always allow this command
  [D] Always deny this command
```

---

### Tool Isolation

**Filesystem Isolation**:
- **Allowed Directories**: Configurable via settings (default: `~/Documents`, `~/Projects`)
- **Path Validation**:
  - Resolve absolute paths
  - Check against allowed directories
  - Block directory traversal (`../`, symlinks)
- **File Permission Checks**:
  - Verify read/write permissions before operation
  - Handle permission denied gracefully

**Process Isolation**:
- **Separate Process**: Each tool runs in isolated child process
- **Resource Limits**:
  - Max CPU: 50% of available
  - Max Memory: 512MB
  - Max File Descriptors: 100
- **Timeout Enforcement**:
  - Per-tool timeout (default: 30s)
  - Hard timeout (default: 5min)
- **Cleanup**:
  - Kill process on timeout
  - Kill child processes
  - Close file descriptors

**Optional: Container Isolation** (Advanced):
- Run tools in Docker containers
- Limit filesystem access (volumes only)
- Network isolation (block external network)
- Resource cgroups

---

### Execution Sandbox

**Design Options**:

**Option 1: chroot/jail** (Linux only)
- Create isolated filesystem view
- Limit access to specific directories
- Requires root or CAP_SYS_CHROOT

**Option 2: Firejail** (Linux)
- User-space sandboxing
- Network, filesystem, process isolation
- No root required

**Option 3: Container (Docker/Podman)**
- Full isolation with Linux namespaces
- Resource limits via cgroups
- Cross-platform (Linux, macOS, Windows WSL2)

**Option 4: Limited Environment** (Cross-platform)
- Restrict environment variables
- Restrict PATH to safe commands
- Filesystem checks before operations

**Recommended**: Start with Option 4 (limited environment), progress to Option 3 (containers) for advanced users.

---

### Memory Protection

**Encryption at Rest**:
- Use user-provided encryption key (derived from password)
- Encrypt sensitive memory files (identity, secrets)
- Encrypt vector embeddings (if stored in files)
- Key stored in system keyring (macOS Keychain, Linux keyring, Windows Credential Manager)

**Access Control**:
- File permissions: 600 (user read/write only)
- Directory permissions: 700 (user only)
- Restrict access to `~/.orbit/`

**Backup Encryption**:
- Encrypt backup archives with user key
- Separate password from main key

---

### Secret Management

**API Key Storage**:
```bash
~/.orbit/secrets/
├── api_keys.enc           ← Encrypted API keys
├── encryption.key         ← Derived from user password
└── .gitkeep
```

**Encryption Flow**:
1. User enters password during setup
2. Derive encryption key using PBKDF2
3. Encrypt API keys with AES-256-GCM
4. Store encrypted keys
5. Store key derivation parameters (salt, iterations)
6. Discard key from memory

**Decryption Flow**:
1. User enters password
2. Derive key from password + salt
3. Decrypt API keys
4. Use in memory, never write to disk
5. Discard keys after use

**Keyring Integration** (Optional):
- Store encryption key in system keyring
- No password required after first unlock
- Platform-specific APIs:
  - macOS: Keychain
  - Linux: libsecret / KWallet
  - Windows: Credential Manager

---

### Command Whitelist

**Safe Commands** (auto-permission):
```javascript
const SAFE_COMMANDS = [
  // Navigation
  'ls', 'cd', 'pwd',

  // File operations
  'cat', 'head', 'tail', 'less', 'more',
  'cp', 'mv', 'mkdir', 'touch',
  'grep', 'find', 'wc', 'sort', 'uniq',

  // Development
  'git status', 'git log', 'git diff', 'git branch',
  'git checkout', 'git stash', 'git tag',
  'npm run', 'pnpm run', 'pip install',

  // Information
  'date', 'whoami', 'uname', 'hostname',
  'df', 'du', 'free',

  // Process
  'ps', 'top', 'htop'
];
```

**Dangerous Commands** (ask or deny permission):
```javascript
const DANGEROUS_COMMANDS = [
  // Destructive
  'rm', 'rmdir', 'dd', 'mkfs',
  'format', 'fdisk',

  // Privileged
  'sudo', 'su', 'doas',

  // System
  'reboot', 'shutdown', 'poweroff',
  'systemctl', 'service',

  // Network
  'iptables', 'nft', 'netfilter',

  // Config
  'passwd', 'usermod', 'userdel',
  'chmod 777', 'chown root'
];
```

**Dynamic Check**:
```javascript
function isCommandSafe(command) {
  const baseCommand = command.split(' ')[0];

  // Check against dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf/,           // rm -rf
    />\s*\//,              // Redirect overwrite
    /;\s*(rm|dd|format)/, // Chain with dangerous command
    /&&\s*(rm|dd|format)/,// And chain with dangerous command
    /\|\s*(rm|dd|format)/, // Pipe to dangerous command
  ];

  if (dangerousPatterns.some(pattern => pattern.test(command))) {
    return { safe: false, reason: 'Matches dangerous pattern' };
  }

  // Check whitelist
  if (SAFE_COMMANDS.includes(baseCommand)) {
    return { safe: true, reason: 'In whitelist' };
  }

  // Check blacklist
  if (DANGEROUS_COMMANDS.includes(baseCommand)) {
    return { safe: false, reason: 'In blacklist' };
  }

  // Unknown command - ask user
  return { safe: 'ask', reason: 'Unknown command' };
}
```

---

### User Confirmation for High-Risk Operations

**High-Risk Criteria**:
- Risk level: high or critical
- Modifies system state
- Network request to external domains
- Delete operation
- Privileged operation

**Confirmation UI**:
```
╔═══════════════════════════════════════════════════════╗
║ ⚠️  CONFIRMATION REQUIRED                              ║
║                                                           ║
║ The agent wants to perform a high-risk operation:          ║
║                                                           ║
║   Tool: execute_command                                   ║
║   Command: git push origin main                           ║
║   Reason: Push feature branch to remote repository          ║
║                                                           ║
║ This operation cannot be undone automatically.               ║
║                                                           ║
║   [Y] Yes, execute                                       ║
║   [N] No, cancel                                        ║
║   [A] Always allow this specific command                   ║
║   [D] Always deny this specific command                    ║
║   [V] View command details                                 ║
╚═══════════════════════════════════════════════════════╝
```

**Confirmation History**:
- Remember user's decisions
- Apply "always allow" or "always deny" for specific commands
- Reset history on security concern or user request

---

### Audit Logging

**Log Format**:
```json
{
  "timestamp": "2024-02-28T14:30:00Z",
  "event_type": "tool_execution",
  "tool": "execute_command",
  "user_id": "user123",
  "session_id": "session456",
  "command": "git push origin main",
  "arguments": {
    "cwd": "/home/user/project"
  },
  "permission": "ask",
  "user_confirmed": true,
  "execution_result": {
    "success": true,
    "exit_code": 0,
    "stdout": "...",
    "stderr": ""
  },
  "duration_ms": 1234,
  "risk_level": "high"
}
```

**Log Storage**:
- File: `~/.orbit/logs/audit.log`
- Rotation: Daily, keep 30 days
- Format: JSON Lines (one JSON object per line)

**Audit Queries**:
```bash
# View all high-risk operations
jq 'select(.risk_level == "high")' ~/.orbit/logs/audit.log

# View all tool executions
jq 'select(.event_type == "tool_execution")' ~/.orbit/logs/audit.log

# View denied operations
jq 'select(.permission == "deny")' ~/.orbit/logs/audit.log
```

---

### Rate Limiting

**Per-User Limits**:
- Tool executions: 100 per hour
- LLM invocations: 50 per hour
- Network requests: 20 per minute

**Per-Tool Limits**:
- Same tool: 10 per minute
- Shell commands: 20 per minute

**Sliding Window**:
- Track timestamps of recent operations
- Allow burst up to limit
- Block when limit exceeded
- Reset after window expires

**Implementation**:
```javascript
class RateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = []; // Timestamps
  }

  canExecute() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests
    this.requests = this.requests.filter(ts => ts > windowStart);

    // Check limit
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    // Record request
    this.requests.push(now);
    return true;
  }
}
```

---

### Timeout Enforcement

**Per-Tool Timeout**:
- File operations: 5 seconds
- Shell commands: 30 seconds
- Network requests: 10 seconds
- Memory operations: 1 second

**Global Timeout**:
- Hard limit: 5 minutes
- Applies to entire operation chain
- Prevents infinite loops

**Timeout Handling**:
- Kill child process
- Close file descriptors
- Clean up resources
- Log timeout event
- Return error to LLM

**Implementation**:
```javascript
async function executeWithTimeout(fn, timeoutMs) {
  const timeoutId = setTimeout(() => {
    // Cleanup and abort
  }, timeoutMs);

  try {
    const result = await fn();
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'TimeoutError') {
      logTimeout();
    }
    throw error;
  }
}
```

---

### Resource Limits

**Process Limits**:
```javascript
const RESOURCE_LIMITS = {
  maxCpu: 0.5,              // 50% of CPU
  maxMemory: 512 * 1024 * 1024,  // 512MB
  maxFiles: 100,             // Max open files
  maxProcesses: 10            // Max child processes
};
```

**Enforcement**:
- Linux: cgroups (CPU, memory)
- macOS: `taskpolicy` (CPU)
- Windows: Job Objects (all limits)

**Monitoring**:
- Track resource usage during execution
- Kill process if limits exceeded
- Log resource limit violations

---

## IMPLEMENTATION SEQUENCE

### Phase 1 — Core Runtime Foundation
**Duration**: 2 weeks | **Priority**: Critical
- Foundation for all other phases
- Cannot proceed without this
- Establishes architecture patterns

---

### Phase 2 — Gateway Layer
**Duration**: 3 weeks | **Priority**: High
- Enables event input from all sources
- Required before reasoning layer
- Blocking factor for multi-platform support

---

### Phase 3 — Reasoning Layer
**Duration**: 2 weeks | **Priority**: High
- LLM integration for agent intelligence
- Requires gateway for event input
- Required before tool execution

---

### Phase 4 — Memory System (Markdown Storage)
**Duration**: 2 weeks | **Priority**: High
- Persistent memory for agent knowledge
- Independent of other phases (can run parallel)
- Required before memory search

---

### Phase 5 — Memory Search System (Hybrid Search)
**Duration**: 3 weeks | **Priority**: Medium
- Enables efficient memory retrieval
- Requires markdown storage to be complete
- Improves agent responsiveness

---

### Phase 6 — Tool / Execution Layer
**Duration**: 2 weeks | **Priority**: High
- Enables agent to act on world
- Requires reasoning layer for orchestration
- Critical for autonomy

---

### Phase 7 — Event Loop Integration
**Duration**: 2 weeks | **Priority**: Critical
- Ties all layers together
- Continuous autonomous operation
- Requires all previous phases

---

### Phase 8 — Desktop Runtime Integration
**Duration**: 3 weeks | **Priority**: High
- User-facing deployment
- Can run parallel to Phase 7
- Requires event loop and tool execution

---

### Phase 9 — Testing and Stabilization
**Duration**: 3 weeks | **Priority**: High
- Ensures reliability and quality
- Required for production readiness
- Covers all phases

---

### Phase 10 — Production Readiness
**Duration**: 2 weeks | **Priority**: High
- User-facing delivery
- Installation, documentation, packaging
- Final polish before release

---

## SUMMARY

This implementation plan provides a complete roadmap from the current project state (skeleton desktop, working bridge, orbit-agent Phase 1) to a production-ready desktop autonomous AI agent.

**Key Outcomes**:
- Autonomous event loop processing inputs from multiple sources
- Persistent memory system with markdown storage and vector search
- Safe, isolated tool execution with comprehensive permission model
- Desktop deployment with daemon, TUI, and system tray
- Production-ready installation with security and observability

**Total Estimated Time**: 24 weeks (6 months)

**Dependencies**:
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1 and 2
- Phase 4 independent (can run parallel)
- Phase 5 depends on Phase 4
- Phase 6 depends on Phase 3
- Phase 7 depends on Phases 1-6
- Phase 8 depends on Phase 7
- Phase 9 depends on all previous phases
- Phase 10 depends on all previous phases

**Parallel Development Opportunities**:
- Phases 4 (Memory Storage) can run parallel to Phases 2-3
- Phase 8 (Desktop Runtime) can start after Phase 7 completes
- This can reduce total timeline

**Success Criteria**:
- User can install with single command
- Agent processes events continuously
- Memory persists across sessions
- Tools execute safely with sandboxing
- User can interact via TUI or messaging apps
- System is observable and debuggable
- Documentation enables self-service

---

## NEXT STEPS

1. **Review Plan**: Stakeholders review and approve this plan
2. **Assign Priorities**: Determine which phases to tackle first
3. **Set Milestones**: Define measurable goals for each phase
4. **Create Task List**: Break down phases into actionable tasks
5. **Start Implementation**: Begin with Phase 1 (Core Runtime Foundation)
6. **Track Progress**: Update this document as checkpoints are reached
7. **Iterate**: Adjust plan based on learnings and feedback

---

## REFERENCES

- **Existing Architecture**: `/docs/ARCHITECTURE.md`
- **Project Structure**: `/docs/PROJECT_STRUCTURE.md`
- **Orbit-Agent Blueprint**: `/orbit-agent/docs/ORBIT_AI_PYTHON_BLUEPRINT.md`
- **Orbit-Agent Roadmap**: `/orbit-agent/docs/IMPLEMENTATION_ROADMAP.md`
- **Bridge Framework**: `/docs/BRIDGE_SERVER_FRAMEWORK.md`
- **Quick Setup**: `/docs/QUICK_SETUP.md`

---

> **Document Version**: 1.0
> **Last Updated**: 2026-02-28
> **Status**: Design Phase - Ready for Implementation
