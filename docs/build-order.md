# Build Order

## Goal

Ship a focused ownership-first MVP around library, delivery, translation, and intelligence without collapsing under scope.

## Phase 0: Foundation

Duration:

- 1 week

Deliverables:

- final entity model
- repo structure
- Docker Compose skeleton
- DB abstraction interfaces
- migration setup
- environment config
- design concept direction approved

Decisions to lock:

- Work vs Edition model
- SQLite + PostgreSQL dual strategy
- local filesystem vs S3-compatible storage abstraction
- device-first product strategy
- translation and intelligence as core pillars

## Phase 1: Import and Library Core

Duration:

- 2 to 3 weeks

Deliverables:

- bulk upload flow
- watched folder ingestion
- EPUB metadata extraction
- Open Library and Google Books enrichment
- review queue for uncertain matches
- manual metadata edit
- personal library grid/list
- filters and sorting
- Goodreads CSV import

Success criteria:

- import 100 EPUB files with acceptable metadata quality
- user can fix mismatches without frustration
- library feels visually coherent

## Phase 2: Delivery Core

Duration:

- 2 weeks

Deliverables:

- device registry
- wireless delivery jobs
- per-device delivery preferences
- supported target matrix
- job status and error states
- format compatibility handling

Success criteria:

- user can choose a device and send a book without cables
- delivery state is legible and trustworthy
- failed delivery can be understood and retried

## Phase 3: Translation Core

Duration:

- 1 to 2 weeks

Deliverables:

- translation request flow
- passage translation
- book-level translation jobs
- job history
- glossary and terminology placeholders
- quality/cost mode selection

Success criteria:

- user can translate for actual study, not just quick lookup
- translation jobs feel predictable and resumable

## Phase 4: Author and Book Intelligence

Duration:

- 1 to 2 weeks

Deliverables:

- rich author detail page
- bibliography and “where to start”
- theme and style summaries
- book intelligence summaries
- relationship graph data layer
- search across owned library and linked author context

Rules:

- AI is central for understanding and recommendations
- no AI chat as the primary UI
- no fake precision
- user must be able to inspect why outputs exist

Success criteria:

- author pages feel substantially smarter than static metadata pages
- users can understand why a book or author matters in context

## Phase 5: Recommendations and Launch

Duration:

- 1 to 2 weeks

Deliverables:

- recommendation engine v1
- “similar books” and “similar authors”
- recommendation explanations
- onboarding tuned for ownership, delivery, and discovery
- performance pass
- accessibility pass
- self-hosted quickstart docs

Success criteria:

- new user can import books, understand an author, send a book to a device, and see useful recommendations quickly

## Explicit Later Phases

### Later 1

- PDF reader
- cloud sync
- hosted accounts

### Later 2

- discovery homepage
- genre hubs
- richer publisher universes
- collaborative and social discovery

### Later 3

- premium translation tools
- premium AI features
- public profiles or social layer

## Build-vs-Buy Rules

Use existing infrastructure where mature:

- EPUB and PDF rendering libraries only as supporting utilities
- Open Library and Google Books for metadata
- Booklore / BookFusion / Kavita / Komga as product and interaction references
- official device delivery paths where available

Build custom only where it creates product advantage:

- unified ownership-aware data model
- import matching and review flow
- beautiful library and detail page experience
- metadata cleanup UX
- wireless delivery abstraction
- translation orchestration
- author intelligence
- recommendation intelligence
