# 🚀 MVP Implementation Guide

**Scope**: Memory + Human-in-the-Loop + Essential Tools
**Target**: Hobby/Solo Developer
**Duration**: 2-3 weeks
**Last Updated**: 2026-03-01

---

## Overview

This guide focuses on **shipping a useful MVP fast**. Skip the complex stuff (event loops, vector search, distributed architecture) and focus on what matters:

1. **Memory System** - Makes the agent remember things, with automatic compaction
2. **Human-in-the-Loop** - Safety for risky operations
3. **More Tools** - Expand capabilities

---

## Week 1: Memory System (Days 1-5)

**Goal**: Agent remembers user preferences and workflows between sessions.

### Day 1: Memory Directory Structure

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 1.1 | Create memory directory structure definition | `orbit-agent/src/memory/structure.py` | ✅ |
| 1.2 | Define base memory directory paths (~/.orbit/memory/) | `orbit-agent/src/memory/structure.py` | ✅ |
| 1.3 | Create subdirectory constants (identity, episodic, procedural) | `orbit-agent/src/memory/structure.py` | ✅ |

### Day 2: Memory Writer

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 2.1 | Create memory writer module | `orbit-agent/src/memory/writer.py` | ✅ |
| 2.2 | Implement write_to_memory function (saves to markdown) | `orbit-agent/src/memory/writer.py` | ✅ |
| 2.3 | Implement append_to_session function | `orbit-agent/src/memory/writer.py` | ✅ |
| 2.4 | Add timestamp headers to memory files | `orbit-agent/src/memory/writer.py` | ✅ |
| 2.5 | Implement update_user_profile function | `orbit-agent/src/memory/writer.py` | ✅ |

### Day 3: Memory Reader

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 3.1 | Create memory reader module | `orbit-agent/src/memory/reader.py` | ✅ |
| 3.2 | Implement read_memory_file function | `orbit-agent/src/memory/reader.py` | ✅ |
| 3.3 | Implement read_user_profile function | `orbit-agent/src/memory/reader.py` | ✅ |
| 3.4 | Implement read_workflows function | `orbit-agent/src/memory/reader.py` | ✅ |
| 3.5 | Implement read_recent_sessions function | `orbit-agent/src/memory/reader.py` | ✅ |

### Day 4: Memory Integration into Agent

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 4.1 | Create memory loader node for LangGraph | `orbit-agent/src/agent/nodes/memory_loader.py` | ✅ |
| 4.2 | Implement load_memory_context function | `orbit-agent/src/agent/nodes/memory_loader.py` | ✅ |
| 4.3 | Combine user profile + workflows into context | `orbit-agent/src/agent/nodes/memory_loader.py` | ✅ |
| 4.4 | Add recent sessions to context | `orbit-agent/src/agent/nodes/memory_loader.py` | ✅ |
| 4.5 | Update agent graph to include memory loader node | `orbit-agent/src/agent/graph.py` | ✅ |

### Day 5: Memory Compaction

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 5.1 | Create memory compaction module | `orbit-agent/src/memory/compaction.py` | ✅ |
| 5.2 | Implement check_compaction_needed function (detect when >80% of context window used) | `orbit-agent/src/memory/compaction.py` | ✅ |
| 5.3 | Implement extract_important_facts function (scan episodic memory for key info) | `orbit-agent/src/memory/compaction.py` | ✅ |
| 5.4 | Implement generate_summary function (create concise summaries of sessions) | `orbit-agent/src/memory/compaction.py` | ✅ |
| 5.5 | Implement consolidate_to_procedural function (move facts to workflows.md) | `orbit-agent/src/memory/compaction.py` | ✅ |
| 5.6 | Implement archive_old_sessions function (move old logs to archive folder) | `orbit-agent/src/memory/compaction.py` | ✅ |
| 5.7 | Add manual_compaction function (triggered by user request) | `orbit-agent/src/memory/compaction.py` | ✅ |
| 5.8 | Integrate compaction check into memory loader | `orbit-agent/src/agent/nodes/memory_loader.py` | ✅ |

---

## Week 2: Human-in-the-Loop (Days 6-7)

**Goal**: Ask user confirmation before dangerous actions.

### Day 6: Tool Danger Levels

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 5.1 | Review all existing tools for danger_level | `orbit-agent/src/tools/` | ✅ |
| 5.2 | Add danger_level property to OrbitTool base class | `orbit-agent/src/tools/base.py` | ✅ |
| 5.3 | Define danger level scale (0-10) | `orbit-agent/src/tools/base.py` | ✅ |
| 5.4 | Set danger levels for each tool (0-2 for safe, 3-5 for moderate, 6-10 for dangerous) | `orbit-agent/src/tools/` | ✅ |

### Day 7: Permission Checker & Human Input

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 7.1 | Create permission checker module | `orbit-agent/src/tools/permission.py` | ✅ |
| 7.2 | Implement needs_confirmation function (check danger level) | `orbit-agent/src/tools/permission.py` | ✅ |
| 7.3 | Create human input node for LangGraph | `orbit-agent/src/agent/nodes/human_input.py` | ✅ |
| 7.4 | Implement user confirmation flow (ask Y/N) | `orbit-agent/src/agent/nodes/human_input.py` | ✅ |
| 7.5 | Add auto-approval for low-danger tools | `orbit-agent/src/agent/nodes/human_input.py` | ✅ |
| 7.6 | Update agent graph to use human input | `orbit-agent/src/agent/graph.py` | ✅ |

---

## Week 3: More Tools (Days 8-11)

**Goal**: Add useful tools to make agent more capable.

### Day 8: Git Branch Tool

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 8.1 | Create git branch tool module | `orbit-agent/src/tools/git/branch.py` | ⬜ |
| 8.2 | Implement GitBranchTool class (extends OrbitTool) | `orbit-agent/src/tools/git/branch.py` | ⬜ |
| 8.3 | Add tool input schema (branch parameter) | `orbit-agent/src/tools/git/branch.py` | ⬜ |
| 8.4 | Implement _run function (git rev-parse or git branch) | `orbit-agent/src/tools/git/branch.py` | ⬜ |
| 8.5 | Handle errors (not a git repository) | `orbit-agent/src/tools/git/branch.py` | ⬜ |

### Day 9: Git Commit Tool

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 9.1 | Create git commit tool module | `orbit-agent/src/tools/git/commit.py` | ⬜ |
| 9.2 | Implement GitCommitTool class | `orbit-agent/src/tools/git/commit.py` | ⬜ |
| 9.3 | Add tool input schema (message, files) | `orbit-agent/src/tools/git/commit.py` | ⬜ |
| 9.4 | Implement _run function (git commit) | `orbit-agent/src/tools/git/commit.py` | ⬜ |
| 9.5 | Handle commit validation (check for staged changes) | `orbit-agent/src/tools/git/commit.py` | ⬜ |

### Day 10: Git Push Tool

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 10.1 | Create git push tool module | `orbit-agent/src/tools/git/push.py` | ⬜ |
| 10.2 | Implement GitPushTool class | `orbit-agent/src/tools/git/push.py` | ⬜ |
| 10.3 | Add tool input schema (remote, branch) | `orbit-agent/src/tools/git/push.py` | ⬜ |
| 10.4 | Implement _run function (git push) | `orbit-agent/src/tools/push.py` | ⬜ |
| 10.5 | Set danger level to high (requires confirmation) | `orbit-agent/src/tools/git/push.py` | ⬜ |

### Day 11: File Search Tool

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 11.1 | Create file search tool module | `orbit-agent/src/tools/file/search.py` | ⬜ |
| 11.2 | Implement FileSearchTool class | `orbit-agent/src/tools/file/search.py` | ⬜ |
| 11.3 | Add tool input schema (pattern, directory) | `orbit-agent/src/tools/file/search.py` | ⬜ |
| 11.4 | Implement _run function (find command) | `orbit-agent/src/tools/file/search.py` | ⬜ |
| 11.5 | Add timeout to prevent hanging | `orbit-agent/src/tools/file/search.py` | ⬜ |

---

## Week 4: Tool Registration & Integration (Days 12-13)

**Goal**: Register new tools and integrate with agent.

### Day 12: Update Tool Registry

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 12.1 | Update tool registry to include new git tools | `orbit-agent/src/tools/registry.py` | ⬜ |
| 12.2 | Update tool registry to include file search tool | `orbit-agent/src/tools/registry.py` | ⬜ |
| 12.3 | Add auto-discovery calls for git tools | `orbit-agent/src/tools/registry.py` | ⬜ |
| 12.4 | Add auto-discovery calls for file search | `orbit-agent/src/tools/registry.py` | ⬜ |
| 12.5 | Test tool discovery (all tools registered) | `orbit-agent/src/tools/` | ⬜ |

### Day 13: Graph Integration

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 13.1 | Update agent graph to include git tools | `orbit-agent/src/agent/graph.py` | ⬜ |
| 13.2 | Update agent graph to include file search tool | `orbit-agent/src/agent/graph.py` | ⬜ |
| 13.3 | Add conditional edge for human confirmation | `orbit-agent/src/agent/graph.py` | ⬜ |
| 13.4 | Test full workflow with git tools | `orbit-agent/src/agent/` | ⬜ |
| 13.5 | Test full workflow with file search | `orbit-agent/src/agent/` | ⬜ |

---

## Week 5: Testing & Bug Fixes (Days 14-16)

**Goal**: Ensure all features work reliably.

### Day 14: Memory System Testing

| Step | Task | Status |
|------|------|--------|
| 14.1 | Test memory writer creates files in ~/.orbit/memory/ | ⬜ |
| 14.2 | Test memory reader loads files correctly | ⬜ |
| 14.3 | Test memory context appears in LLM prompts | ⬜ |
| 14.4 | Verify user profile updates work | ⬜ |
| 14.5 | Verify session logs are created | ⬜ |
| 14.6 | Test compaction trigger detects full memory | ⬜ |
| 14.7 | Test important facts extraction from episodic memory | ⬜ |
| 14.8 | Test summary generation for old sessions | ⬜ |
| 14.9 | Test consolidation to procedural memory | ⬜ |
| 14.10 | Test manual compaction via user request | ⬜ |

### Day 15: Human-in-the-Loop Testing

| Step | Task | Status |
|------|------|--------|
| 15.1 | Test low-danger tools execute without confirmation | ⬜ |
| 15.2 | Test medium-danger tools trigger confirmation | ⬜ |
| 15.3 | Test user can approve dangerous actions | ⬜ |
| 15.4 | Test user can reject actions | ⬜ |
| 15.5 | Verify danger levels are correct for all tools | ⬜ |

### Day 16: Tools Testing

| Step | Task | Status |
|------|------|--------|
| 16.1 | Test git branch tool shows current branch | ⬜ |
| 16.2 | Test git branch tool can switch branches | ⬜ |
| 16.3 | Test git commit tool commits changes | ⬜ |
| 16.4 | Test git push tool requires confirmation | ⬜ |
| 16.5 | Test file search tool finds matching files | ⬜ |
| 16.6 | Test file search tool handles wildcards | ⬜ |
| 16.7 | Verify all tools appear in LLM tool list | ⬜ |
| 16.8 | Test error messages are helpful | ⬜ |

---

## Success Criteria

### MVP is Complete When:

**Memory System:**
☐ User can say "remember that I prefer TypeScript" and agent saves it
☐ User can say "what's my deployment workflow?" and agent recalls it
☐ User preferences appear in agent responses
☐ Agent remembers what happened yesterday (from session logs)
☐ Memory files are human-readable markdown
☐ Memory automatically compacts when exceeding 80% of context window
☐ Important facts extracted and consolidated to procedural memory
☐ Old session logs archived to prevent memory bloat
☐ User can trigger manual compaction on demand

**Human-in-the-Loop:**
☐ Low-danger tools (read file, git status) execute automatically
☐ Medium-danger tools (git commit, send email) ask for confirmation
☐ High-danger tools (git push, delete files) ask for confirmation
☐ User can approve or reject actions
☐ Approval/rejection is respected

**Git Tools:**
☐ Git branch tool shows current branch correctly
☐ Git commit tool commits changes successfully
☐ Git push tool pushes with confirmation
☐ Git tools return helpful error messages

**File Search:**
☐ File search finds files by name
☐ File search supports wildcards (*.py, test_*)
☐ Search results are limited and timeout enforced

**Integration:**
☐ Memory context appears in LLM prompts
☐ Tools are accessible to LLM
☐ Full workflow works end-to-end
☐ Errors are handled gracefully

---

## What You're Building

**A Personal Assistant That:**
- Remembers your preferences and workflows
- Automatically compacts memory to stay efficient
- Extracts important facts from past sessions
- Consolidates knowledge into procedural memory
- Helps with git operations
- Can search your files
- Asks before dangerous actions
- Remembers what it did yesterday
- Works reliably without complex architecture

---

## Testing Strategy

### Unit Tests (Optional - can add later)
- Test memory writer in isolation
- Test memory reader in isolation
- Test permission checker in isolation
- Test each tool in isolation

### Integration Tests (Manual for MVP)
- Test full user workflows:
  1. Ask about git status → Should work
  2. Commit changes → Should ask for confirmation
  3. Push changes → Should ask for confirmation
  4. Search for files → Should return results
  5. Ask to remember preference → Should save to memory
  6. Ask about deployment → Should recall from memory
  7. Create many sessions → Should trigger automatic compaction
  8. Request manual compaction → Should consolidate and archive

---

## File Structure

```
orbit-agent/
├── memory/
│   ├── __init__.py
│   ├── structure.py      # Directory layout definition
│   ├── writer.py          # Save to markdown files
│   ├── reader.py          # Load from markdown files
│   ├── compaction.py      # NEW - memory consolidation
│   └── loader.py          # Inject into LangGraph prompts
├── tools/
│   ├── base.py            # Update danger levels
│   ├── permission.py       # NEW - permission checker
│   ├── registry.py         # Update with new tools
│   ├── git/
│   │   ├── __init__.py
│   │   ├── branch.py
│   │   ├── commit.py
│   │   └── push.py
│   └── file/
│       ├── __init__.py
│       └── search.py
└── agent/
    ├── nodes/
    │   ├── __init__.py
    │   ├── memory_loader.py   # NEW - memory context + compaction check
    │   └── human_input.py      # NEW - user confirmation
    └── graph.py                # Update to use new nodes

~/.orbit/memory/
├── identity/
│   └── user_profile.md
├── episodic/
│   ├── sessions/
│   └── archive/              # NEW - for archived old sessions
└── procedural/
    └── workflows.md
```

---

## 📊 Total Progress

```
Week 1: Memory System               ████████   26/26 steps ✅ COMPLETE
Week 2: Human-in-the-Loop         ████████   10/10 steps ✅ COMPLETE
Week 3: More Tools               ░░░░░░░░   0/10 steps
Week 4: Registration & Integration ░░░░░░░░   0/10 steps
Week 5: Testing & Fixes           ░░░░░░░░   0/23 steps
────────────────────────────────────────────
Total                             ▏▏▏▏▏▏░░░   36/80 steps
```

---

## Next Steps After MVP

Once you ship MVP, you can iterate based on user feedback:
- Vector search (if memory gets large)
- More external tools (Jira, GitHub, Slack, Discord)
- Better TUI with file browser
- Desktop notifications
- Auto-updates
- Mobile app

**Focus on shipping first, get feedback, then iterate!** 🚀

---

> **MVP Guide Version**: 1.0
> **Last Updated**: 2026-03-01
> **Status**: Ready for Implementation
