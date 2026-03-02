# 🧠 Layer 2: Reasoning Layer (Phase 3)

**Duration**: 2 weeks
**Last Updated**: 2026-03-01

---

## Overview

Layer 2 is the Reasoning Layer responsible for constructing prompts, managing context, and invoking LLM for reasoning. This layer builds megaprompts from multiple sources (system instructions, memory, session context, current event), manages context window constraints, and interprets LLM responses.

---

## Final MVP

**Agent can intelligently reason about user requests:**
- User says: "Check if there are any Python files with TODO comments"
- Agent retrieves relevant memory → builds contextual prompt → queries LLM → extracts tool call to search files
- User gets: "Found 3 Python files with TODO comments in /home/user/project"

**Key Capabilities:**
- ☐ Megaprompt assembly from system instructions + memory + context + event
- ☐ Multi-LLM support (OpenAI, Anthropic, Ollama) with easy switching
- ☐ Context window management (token counting, truncation, prioritization)
- ☐ LLM response interpretation (tool calls, natural language)
- ☐ Streaming responses for real-time feedback

---

## Implementation Steps

### Week 1: Prompt Assembly & Context Management

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 1 | Design Prompt Assembly Pipeline | `packages/desktop/src/reasoning/prompt-builder.ts` | ⬜ |
| 2 | Implement Context Loader for Memory Retrieval | `packages/desktop/src/reasoning/context-loader.ts` | ⬜ |
| 3 | Implement Memory Loader for Session History (with pagination) | `packages/desktop/src/reasoning/memory-loader.ts` | ⬜ |
| 4 | Implement System Prompt Template System (version-controlled) | `packages/desktop/src/reasoning/prompts/system-prompt.ts` | ⬜ |
| 5 | Build Context Window Manager (token counting, limit enforcement) | `packages/desktop/src/reasoning/context-manager.ts` | ⬜ |
| 6 | Implement Model Selection Logic (simple queries → smaller models) | `packages/desktop/src/reasoning/model-selector.ts` | ⬜ |

### Week 2: LLM Integration & Response Handling

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 7 | Build Prompt Builder with Variable Interpolation | `packages/desktop/src/reasoning/prompt-builder.ts` | ⬜ |
| 8 | Implement LLM Provider Abstraction (factory pattern) | `packages/desktop/src/reasoning/llm/factory.ts` | ⬜ |
| 9 | Implement OpenAI Provider | `packages/desktop/src/reasoning/llm/openai.ts` | ⬜ |
| 10 | Implement Anthropic Provider | `packages/desktop/src/reasoning/llm/anthropic.ts` | ⬜ |
| 11 | Implement Ollama Provider | `packages/desktop/src/reasoning/llm/ollama.ts` | ⬜ |
| 12 | Create Response Interpreter for LLM Outputs | `packages/desktop/src/reasoning/response-interpreter.ts` | ⬜ |
| 13 | Build Tool Call Extraction from LLM Responses | `packages/desktop/src/reasoning/tool-call-extractor.ts` | ⬜ |
| 14 | Implement Response Routing (direct response vs tool execution) | `packages/desktop/src/reasoning/response-router.ts` | ⬜ |
| 15 | Design Fallback Mechanisms for LLM Failures (retry, alternate provider) | `packages/desktop/src/reasoning/fallback-manager.ts` | ⬜ |
| 16 | Implement Streaming Response Handling | `packages/desktop/src/reasoning/stream-handler.ts` | ⬜ |
| 17 | Build Cost Tracking per Model/Provider | `packages/desktop/src/reasoning/cost-tracker.ts` | ⬜ |
| 18 | Create Prompt Versioning System (A/B testing, rollbacks) | `packages/desktop/src/reasoning/prompts/version-manager.ts` | ⬜ |
| 19 | Write Unit Tests for Reasoning Layer | `packages/desktop/src/reasoning/__tests__/` | ⬜ |

---

## 📊 Total Progress

```
Layer 2: Reasoning Layer        ░░░░░░░░░   0/19 steps
```

---

## Success Criteria

☐ Prompts assembled correctly from all sources (system, identity, episodic, procedural, event)
☐ LLM providers can be switched via config without code changes
☐ Context window respected and enforced (truncation happens intelligently)
☐ LLM responses correctly interpreted (natural language vs tool calls)
☐ Tool calls accurately extracted and structured
☐ Streaming works without blocking other operations
☐ Cost tracking shows accurate usage per model
☐ Fallback mechanisms handle LLM failures gracefully

---

## Prompt Assembly Pipeline Flow

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

---

## File Structure

```
packages/desktop/src/reasoning/
├── prompts/
│   ├── system-prompt.ts
│   └── version-manager.ts
├── llm/
│   ├── factory.ts
│   ├── openai.ts
│   ├── anthropic.ts
│   └── ollama.ts
├── prompt-builder.ts
├── context-loader.ts
├── memory-loader.ts
├── context-manager.ts
├── model-selector.ts
├── response-interpreter.ts
├── tool-call-extractor.ts
├── response-router.ts
├── fallback-manager.ts
├── stream-handler.ts
├── cost-tracker.ts
└── __tests__/
    └── ...
```

---

## Dependencies

**Requires**: Layer 1 (Gateway Layer) complete
- Event flow from Gateway → Reasoning
- Session management for context
- Metrics collection for LLM calls

**Enables**: Layer 3 (Memory System), Layer 5 (Tool/Execution)
- Memory retrieval for context
- Tool execution for LLM decisions

---

> **Document Version**: 1.0
> **Last Updated**: 2026-03-01
> **Status**: Ready for Implementation
