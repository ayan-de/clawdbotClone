# 🔍 Layer 4: Memory Search System (Phase 5)

**Duration**: 3 weeks
**Last Updated**: 2026-03-01

---

## Overview

Layer 4 is the Memory Search System that efficiently retrieves relevant memory chunks using hybrid search (combining keyword/BM25 and semantic/vector search). Memory files are divided into searchable chunks, embeddings generated, and results fused and reranked for relevance.

---

## Final MVP

**Agent can find relevant past information:**
- User asks: "What did I do with git yesterday?"
- Agent searches memory → finds relevant chunks → ranks by relevance → returns: "Yesterday you created a feature branch 'fix/auth-bug', made 3 commits, and pushed to remote"
- User asks: "How do I usually handle authentication?"
- Agent searches procedural memory → returns your authentication workflow from learned procedures

**Key Capabilities:**
- ☐ Hybrid search (keyword + semantic)
- ☐ Markdown chunking (paragraph, section, fixed-size strategies)
- ☐ Multi-provider embedding generation (OpenAI, Anthropic, Ollama)
- ☐ Vector storage (local files or pgvector)
- ☐ Keyword index (BM25)
- ☐ Result fusion (RRF or weighted blend)
- ☐ Context-aware reranking
- ☐ Incremental indexing (only new chunks)

---

## Implementation Steps

### Week 1: Chunking & Embedding

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 1 | Implement Markdown Chunking System | `packages/desktop/src/search/chunking/chunker.ts` | ⬜ |
| 2 | Design Chunking Strategies (paragraph, section, fixed-size) | `packages/desktop/src/search/chunking/strategies/` | ⬜ |
| 3 | Create Chunk Metadata Structure | `packages/desktop/src/search/chunking/chunk-metadata.ts` | ⬜ |
| 4 | Implement Embedding Generation System (multi-provider) | `packages/desktop/src/search/embeddings/generator.ts` | ⬜ |
| 5 | Implement OpenAI Embedding Provider | `packages/desktop/src/search/embeddings/openai.ts` | ⬜ |
| 6 | Implement Anthropic Embedding Provider | `packages/desktop/src/search/embeddings/anthropic.ts` | ⬜ |
| 7 | Implement Ollama Embedding Provider | `packages/desktop/src/search/embeddings/ollama.ts` | ⬜ |
| 8 | Design Vector Storage System (local files or pgvector) | `packages/desktop/src/search/storage/vector-store.ts` | ⬜ |
| 9 | Implement Keyword Index System (BM25) | `packages/desktop/src/search/keyword/bm25-index.ts` | ⬜ |

### Week 2: Search Engine & Fusion

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 10 | Build Search Engine with Hybrid Scoring | `packages/desktop/src/search/search-engine.ts` | ⬜ |
| 11 | Design Result Fusion Algorithm (RRF or weighted blend) | `packages/desktop/src/search/fusion/fusion-strategy.ts` | ⬜ |
| 12 | Implement Reciprocal Rank Fusion (RRF) | `packages/desktop/src/search/fusion/rrf.ts` | ⬜ |
| 13 | Implement Weighted Blend Fusion | `packages/desktop/src/search/fusion/weighted-blend.ts` | ⬜ |
| 14 | Implement Reranking System (context relevance) | `packages/desktop/src/search/reranking/reranker.ts` | ⬜ |
| 15 | Create Memory Retrieval Pipeline (search → rank → fuse → rerank → retrieve) | `packages/desktop/src/search/pipeline/retrieval-pipeline.ts` | ⬜ |
| 16 | Build Cache for Frequent Searches | `packages/desktop/src/search/cache/search-cache.ts` | ⬜ |
| 17 | Design Query Expansion for Better Recall | `packages/desktop/src/search/query/expander.ts` | ⬜ |

### Week 3: Indexing & Integration

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 18 | Implement Incremental Indexing (new chunks only) | `packages/desktop/src/search/indexing/incremental-indexer.ts` | ⬜ |
| 19 | Create Reindexing Job (major changes, scheduled) | `packages/desktop/src/search/indexing/reindexer.ts` | ⬜ |
| 20 | Implement Index Watcher (auto-index on file changes) | `packages/desktop/src/search/indexing/watcher.ts` | ⬜ |
| 21 | Build Search API Endpoint | `packages/desktop/src/search/api/search-endpoint.ts` | ⬜ |
| 22 | Implement Search Suggestions/Autocomplete | `packages/desktop/src/search/api/suggestions.ts` | ⬜ |
| 23 | Write Unit Tests for Search System | `packages/desktop/src/search/__tests__/` | ⬜ |

---

## 📊 Total Progress

```
Layer 4: Memory Search         ░░░░░░░░░   0/23 steps
```

---

## Success Criteria

☐ Chunks created with appropriate granularity (not too small, not too large)
☐ Embeddings generated efficiently (uses configured provider)
☐ Both keyword and semantic searches work independently
☐ Fusion produces relevant results (better than either alone)
☐ Reranking improves relevance based on context
☐ Cache reduces latency for common queries
☐ Incremental indexing only processes new/changed files
☐ Search API returns results in reasonable time (< 500ms)

---

## Hybrid Search Workflow

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
  (Context-aware scoring:
   - Temporal proximity
   - Session continuity
   - User preferences)
                 ↓
       Final Top M Results
                 ↓
    Inject into Prompt
```

---

## Chunking Strategies

1. **Paragraph-based**: Split at paragraph boundaries (natural semantic units)
2. **Section-based**: Split at markdown headers (logical divisions)
3. **Fixed-size**: Split at N tokens (consistent chunk sizes)
4. **Hybrid**: Combine approaches (e.g., section-based with max size)

---

## Result Fusion Algorithms

### Reciprocal Rank Fusion (RRF)
Combines rankings from multiple sources:
- Formula: `score = Σ 1/(k + rank_position)`
- k is constant (typically 60)

### Weighted Blend
Assign weights to each search type:
- Formula: `score = α * keyword_score + (1-α) * semantic_score`
- α determined empirically or dynamically

---

## File Structure

```
~/.orbit/vector-index/
├── chunks/              # Chunk data files
├── embeddings/         # Vector embeddings
├── keyword-index/       # BM25 index
└── metadata/           # Index metadata

packages/desktop/src/search/
├── chunking/
│   ├── chunker.ts
│   ├── strategies/
│   │   ├── paragraph.ts
│   │   ├── section.ts
│   │   └── fixed-size.ts
│   └── chunk-metadata.ts
├── embeddings/
│   ├── generator.ts
│   ├── openai.ts
│   ├── anthropic.ts
│   └── ollama.ts
├── storage/
│   └── vector-store.ts
├── keyword/
│   └── bm25-index.ts
├── search-engine.ts
├── fusion/
│   ├── fusion-strategy.ts
│   ├── rrf.ts
│   └── weighted-blend.ts
├── reranking/
│   └── reranker.ts
├── pipeline/
│   └── retrieval-pipeline.ts
├── cache/
│   └── search-cache.ts
├── query/
│   └── expander.ts
├── indexing/
│   ├── incremental-indexer.ts
│   ├── reindexer.ts
│   └── watcher.ts
├── api/
│   ├── search-endpoint.ts
│   └── suggestions.ts
└── __tests__/
    └── ...
```

---

## Dependencies

**Requires**: Layer 3 (Memory System) complete
- Memory markdown files to index
- Memory write service to trigger reindexing

**Enables**: Layer 2 (Reasoning Layer)
- Context retrieval for prompt building
- Relevant memory injection

---

> **Document Version**: 1.0
> **Last Updated**: 2026-03-01
> **Status**: Ready for Implementation
