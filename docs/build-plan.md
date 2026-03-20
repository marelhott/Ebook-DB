# Build Plan

## Goal
Ship a credible ownership-first product centered on library quality, wireless delivery, translation, and AI intelligence.

## Phase 0: Definition and skeleton

### Outputs
- final entity map
- initial database schema
- service boundaries
- design prompt and target screens
- repo structure

### Deliverables
- architecture decision notes
- empty app skeletons for frontend, backend, and worker
- Docker Compose baseline

## Phase 1: Personal library foundation

### Scope
- local watched folder support
- bulk upload
- EPUB metadata extraction
- external metadata enrichment
- manual metadata edit
- Goodreads CSV import
- personal library pages

### Success criteria
- user can import 50 plus EPUB files
- at least most books have usable metadata
- mismatches are easy to repair

## Phase 2: Wireless delivery foundation

### Scope
- device registry
- delivery target configuration
- delivery job creation
- delivery history
- retries and failure states

### Success criteria
- user can send a chosen book to a chosen device cleanly
- delivery status is transparent
- wireless delivery feels like a first-class workflow

## Phase 3: Translation and study foundation

### Scope
- translation jobs
- passage translation
- book translation queue
- glossary placeholders
- study-oriented translation UX

### Success criteria
- translation is usable for real long-form study
- translation requests do not feel like detached utility tools

## Phase 4: Author and book intelligence

### Scope
- rich author pages
- bibliography intelligence
- theme/style summaries
- relationship graph data
- “where to start” guidance

### Success criteria
- AI makes author and book understanding materially better
- outputs are inspectable and feel grounded

## Phase 5: Recommendations and expansion

### Scope
- similar books
- similar authors
- explanation layer for recommendations
- genre discovery
- hosted sync and cloud connectors

### Success criteria
- expansion does not regress library and delivery quality

## Recommended repo structure

```text
/
  docs/
    master-spec.md
    build-plan.md
  prompts/
    figma-make-prompt.md
  frontend/
  backend/
  ai-worker/
  infra/
```

## Build order by system

### Frontend
1. shell and navigation
2. library pages
3. import review UI
4. devices and delivery pages
5. translation pages
6. book and author intelligence pages
7. recommendation surfaces

### Backend
1. schema and repositories
2. upload and watcher pipeline
3. metadata endpoints
4. delivery endpoints
5. translation endpoints
6. intelligence endpoints
7. recommendation endpoints

### Worker
1. EPUB extraction
2. metadata matching
3. cover handling
4. translation orchestration
5. author/book intelligence enrichment
6. recommendation signals

## Main risks

- metadata quality will fail on a meaningful minority of files
- device delivery will be fragmented across ecosystems
- translation can become expensive quickly
- AI can create false confidence if grounding is weak

## Guardrails

- no reader polish before delivery and translation basics are in place
- no heavy discovery homepage before the owned-library and author-intelligence experience is strong
- no opaque recommendation output without visible reasoning
