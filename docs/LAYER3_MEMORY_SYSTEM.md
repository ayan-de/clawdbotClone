# 💾 Layer 3: Memory System (Phase 4)

**Duration**: 2 weeks
**Last Updated**: 2026-03-01

---

## Overview

Layer 3 is the Memory System with two major components: A) Markdown storage for durable persistence, and B) Vector search for efficient retrieval. Memory stores the agent's knowledge in human-readable markdown files for inspection and editing.

---

## Final MVP

**Agent remembers and persists knowledge:**
- User says: "Remember that I prefer using TypeScript over JavaScript"
- Agent stores: "User preference: TypeScript over JavaScript" in `memory/identity/user_profile.md`
- Later, user asks: "What do you know about my preferences?"
- Agent retrieves: "You prefer TypeScript over JavaScript"

**Key Capabilities:**
- ☐ Markdown-based memory storage (identity, episodic, procedural)
- ☐ Session logs and daily summaries
- ☐ Memory consolidation (summarize and compact old memory)
- ☐ Bootstrap memory loading on agent start
- ☐ Memory write triggers (important events, session end, compaction)

---

## Implementation Steps

### Week 1: Memory Storage Structure & Basic Operations

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 1 | Design Memory Directory Structure | `packages/desktop/src/memory/structure.ts` | ⬜ |
| 2 | Implement Identity Memory Schema and Write Service | `packages/desktop/src/memory/identity/identity.service.ts` | ⬜ |
| 3 | Implement Episodic Memory Schema (session logs, daily logs) | `packages/desktop/src/memory/episodic/episodic.service.ts` | ⬜ |
| 4 | Implement Procedural Memory Schema (workflows, procedures) | `packages/desktop/src/memory/procedural/procedural.service.ts` | ⬜ |
| 5 | Create Memory Write Service with File Operations | `packages/desktop/src/memory/memory-writer.ts` | ⬜ |
| 6 | Implement Memory Read Service with Parsing | `packages/desktop/src/memory/memory-reader.ts` | ⬜ |
| 7 | Design Memory Consolidation Algorithm | `packages/desktop/src/memory/consolidation/algorithm.ts` | ⬜ |
| 8 | Implement Memory Compaction Trigger (token-based) | `packages/desktop/src/memory/consolidation/compaction-trigger.ts` | ⬜ |
| 9 | Build Important Information Extraction (LLM-assisted) | `packages/desktop/src/memory/consolidation/info-extractor.ts` | ⬜ |

### Week 2: Advanced Memory Operations & Lifecycle

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 10 | Create Summary Generation System (multi-level) | `packages/desktop/src/memory/consolidation/summary-generator.ts` | ⬜ |
| 11 | Implement Memory Overwrite Logic (conflict resolution) | `packages/desktop/src/memory/memory-overwrite.ts` | ⬜ |
| 12 | Design Memory Backup/Restore Mechanism | `packages/desktop/src/memory/backup/backup-manager.ts` | ⬜ |
| 13 | Implement Bootstrap Memory Loading on Agent Start | `packages/desktop/src/memory/bootstrap/loader.ts` | ⬜ |
| 14 | Implement Memory Write on Important Events Detected | `packages/desktop/src/memory/write-triggers/event-trigger.ts` | ⬜ |
| 15 | Implement Memory Write Before Compaction Trigger | `packages/desktop/src/memory/write-triggers/compaction-trigger.ts` | ⬜ |
| 16 | Implement Memory Write on Session End | `packages/desktop/src/memory/write-triggers/session-trigger.ts` | ⬜ |
| 17 | Implement Periodic Memory Consolidation (scheduled job) | `packages/desktop/src/memory/consolidation/scheduler.ts` | ⬜ |
| 18 | Implement Memory Compaction When Token Limit Approached | `packages/desktop/src/memory/consolidation/compactor.ts` | ⬜ |
| 19 | Design Memory Retention Policy (archiving old sessions) | `packages/desktop/src/memory/retention/policy.ts` | ⬜ |
| 20 | Implement Memory Recovery from Backup | `packages/desktop/src/memory/backup/recovery.ts` | ⬜ |
| 21 | Create Memory Integrity Checks (detect corruption) | `packages/desktop/src/memory/integrity/checker.ts` | ⬜ |
| 22 | Write Unit Tests for Memory System | `packages/desktop/src/memory/__tests__/` | ⬜ |

---

## 📊 Total Progress

```
Layer 3: Memory System          ░░░░░░░░░   0/22 steps
```

---

## Success Criteria

☐ Memory files created in correct directory structure
☐ Memory can be read and written reliably
☐ Consolidation produces useful summaries
☐ Important information preserved across compactions
☐ Bootstrap loads memory correctly on start
☐ Memory write triggers work for important events, session end, compaction
☐ Backup/restore works correctly
☐ Integrity checks detect corrupted files

---

## Memory Types

### Identity Memory (Long-term, factual)
- User identity (name, role, preferences)
- Facts about user (skills, projects, habits)
- Environment context (OS, shell,常用命令)
- **File**: `~/.orbit/memory/identity/user_profile.md`

### Episodic Memory (Time-based, narrative)
- Session logs: Complete conversation transcripts
- Daily logs: Summary of daily activities and learnings
- Session snapshots: Important moments worth preserving
- **Files**: `~/.orbit/memory/episodic/sessions/session_YYYY-MM-DD_NNN.md`
- **Files**: `~/.orbit/memory/episodic/daily/YYYY-MM-DD.md`

### Procedural Memory (Action-oriented, learned)
- Workflows: Multi-step procedures for common tasks
- Learned procedures: Patterns discovered through interaction
- Best practices: Effective approaches the agent has learned
- **Files**: `~/.orbit/memory/procedural/workflows.md`
- **Files**: `~/.orbit/memory/procedural/learned_procedures.md`

---

## Memory Write Triggers

1. **On Important Events Detected**:
   - User explicitly says "remember this"
   - Agent learns a new fact about user
   - Task completion with valuable outcome
   - Error discovery and resolution

2. **Before Context Compaction**:
   - When approaching token limit (80% of max)
   - Before summarizing old context
   - Ensure important info preserved

3. **On Session End**:
   - Generate session summary
   - Write complete session log
   - Update daily log with key events

4. **On Periodic Consolidation**:
   - Daily: Consolidate multiple sessions into daily summary
   - Weekly: Summarize week's learnings
   - Monthly: Generate monthly retrospective

---

## File Structure

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

packages/desktop/src/memory/
├── identity/
│   └── identity.service.ts
├── episodic/
│   └── episodic.service.ts
├── procedural/
│   └── procedural.service.ts
├── consolidation/
│   ├── algorithm.ts
│   ├── compaction-trigger.ts
│   ├── info-extractor.ts
│   ├── summary-generator.ts
│   ├── scheduler.ts
│   └── compactor.ts
├── write-triggers/
│   ├── event-trigger.ts
│   ├── compaction-trigger.ts
│   └── session-trigger.ts
├── backup/
│   ├── backup-manager.ts
│   └── recovery.ts
├── retention/
│   └── policy.ts
├── integrity/
│   └── checker.ts
├── bootstrap/
│   └── loader.ts
├── structure.ts
├── memory-writer.ts
├── memory-reader.ts
├── memory-overwrite.ts
└── __tests__/
    └── ...
```

---

## Dependencies

**Requires**: Layer 1 (Gateway Layer)
- Session management for episodic memory
- Event queue for memory write triggers

**Independent**: Can run parallel with Layer 2 (Reasoning Layer)

**Enables**: Layer 4 (Memory Search), Layer 2 (Reasoning Layer)
- Search needs indexed memory
- Reasoning needs memory for context

---

> **Document Version**: 1.0
> **Last Updated**: 2026-03-01
> **Status**: Ready for Implementation
