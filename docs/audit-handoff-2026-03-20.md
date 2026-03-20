# Audit Handoff

Date: 2026-03-20

## What This App Is

This app is an ownership-first book platform.

It is not:

- a Goodreads clone
- a desktop reader product
- a generic AI chat app for books

It is:

- a clean visual library for books the user actually owns
- a wireless delivery control center for Kindle and later other devices
- a translation workspace for long-form study
- an AI intelligence layer for authors and books
- a recommendation system grounded in owned books and external bibliography

Core product promise:

- organize real books
- send them wirelessly to reading devices
- translate them for study
- understand authors and books deeply
- discover what to read next with reasons

## Product Priorities

Current locked order of importance:

1. Library OS
2. Wireless Delivery
3. Translation Layer
4. AI Author and Book Intelligence
5. AI Recommendation Engine

Important guardrail:

- desktop reading exists only as utility
- it must not dominate roadmap or architecture

## Current Architecture

The project currently has 3 app layers.

### Frontend

Path:
[frontend](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend)

Stack:

- Next.js 15
- React 19
- Tailwind-style custom CSS tokens
- server-rendered app routes

Main visible routes:

- [Home](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/page.tsx)
- [Library](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/library/page.tsx)
- [Book Detail](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/books/%5Bslug%5D/page.tsx)
- [Author Detail](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/authors/%5Bid%5D/page.tsx)
- [Devices](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/devices/page.tsx)
- [Translations](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/translations/page.tsx)
- [Translation Detail](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/translations/%5Bid%5D/page.tsx)
- [Search](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/search/page.tsx)
- [Import](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/import/page.tsx)

Frontend data layer:

- [api.ts](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/lib/api.ts)

The frontend currently prefers backend API data and falls back to mocks only where needed.

### Backend

Path:
[backend](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend)

Stack:

- Go
- stdlib HTTP server
- in-memory repository for now
- worker-oriented orchestrator

Main entrypoint:

- [main.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/cmd/server/main.go)

Important backend layers:

- [domain.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/domain/domain.go)
- [handler.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/handler/handler.go)
- [pillars.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/handler/pillars.go)
- [job_orchestrator.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/service/job_orchestrator.go)
- [mock.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/repository/mock.go)

Backend role:

- official read layer for delivery status
- official read layer for translation jobs
- official read layer for intelligence and recommendations
- device and delivery API surface

### Worker

Path:
[ai-worker](/Volumes/CODEX_DISK/apps/Ebook%20jinak/ai-worker)

Main file:

- [main.py](/Volumes/CODEX_DISK/apps/Ebook%20jinak/ai-worker/app/main.py)

Worker responsibilities:

- EPUB upload
- EPUB metadata extraction
- worker-owned catalog of imported books
- delivery job creation and background processing
- translation job creation and background processing
- translation document generation
- book intelligence generation
- author intelligence generation
- book recommendation generation
- author recommendation generation
- Open Library author enrichment

## What Is Already Implemented

### 1. Product and Design Foundation

These docs are already in place:

- [master-spec.md](/Volumes/CODEX_DISK/apps/Ebook%20jinak/docs/master-spec.md)
- [product-priorities.md](/Volumes/CODEX_DISK/apps/Ebook%20jinak/docs/product-priorities.md)
- [core-pillars-architecture.md](/Volumes/CODEX_DISK/apps/Ebook%20jinak/docs/core-pillars-architecture.md)
- [design-direction.md](/Volumes/CODEX_DISK/apps/Ebook%20jinak/docs/design-direction.md)
- [ui-spec.md](/Volumes/CODEX_DISK/apps/Ebook%20jinak/docs/ui-spec.md)

Design intent is already established:

- clean
- calm
- modern
- BookFusion-adjacent in refinement
- no emoji
- no AI slop
- no dashboard feel

### 2. Library and Import Foundation

Implemented:

- visual library shell
- book detail and author detail pages
- import review page
- sample EPUB path
- worker upload endpoint
- EPUB metadata extraction
- worker catalog listing

Important files:

- [import-wizard.tsx](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/components/import-wizard.tsx)
- [mock-data.ts](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/lib/mock-data.ts)
- [main.py](/Volumes/CODEX_DISK/apps/Ebook%20jinak/ai-worker/app/main.py)

### 3. Wireless Delivery

Implemented:

- device list
- SMTP connector status
- Kindle-oriented preflight endpoint
- delivery job creation
- delivery job retrieval
- delivery retry endpoint
- clear failed vs queued vs processing vs delivered status handling
- frontend retry button and receipt UX

Important files:

- [devices/page.tsx](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/devices/page.tsx)
- [delivery-retry-button.tsx](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/components/delivery-retry-button.tsx)
- [pillars.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/handler/pillars.go)
- [job_orchestrator.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/service/job_orchestrator.go)
- [main.py](/Volumes/CODEX_DISK/apps/Ebook%20jinak/ai-worker/app/main.py)

Current delivery logic:

- backend creates and reads delivery jobs through worker
- worker processes jobs in background
- Kindle path currently uses SMTP send-to-email model
- without SMTP config, receipts fail clearly with reason

### 4. Translation Layer

Implemented:

- translation job creation
- translation job listing
- translation detail page
- translation document endpoint
- chapter-oriented translation workspace
- chapter-level study fields
- optional DeepL-aware translation pass for excerpts

Important files:

- [translations/page.tsx](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/translations/page.tsx)
- [translations/[id]/page.tsx](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/translations/%5Bid%5D/page.tsx)
- [main.py](/Volumes/CODEX_DISK/apps/Ebook%20jinak/ai-worker/app/main.py)

Current translation output contains:

- study goal
- translation strategy
- terminology focus
- reading path
- chapter list
- source excerpts
- translated excerpts

### 5. AI Book and Author Intelligence

Implemented:

- book intelligence endpoint
- author intelligence endpoint
- backend read-through to worker
- persisted worker-generated payloads
- generator version invalidation
- Open Library author enrichment
- owned vs known works map

Current author payload can include:

- one line summary
- career arc
- recurring themes
- entry points
- read next strategy
- Open Library id
- bibliography source
- external work count
- notable works
- owned work count
- known work count
- owned works
- known works sample
- coverage ratio
- owned vs known map

### 6. Recommendation Layer

Implemented:

- book recommendation rail endpoint
- author recommendation rail endpoint
- backend read-through to worker
- signal-aware overlap scoring
- recommendation reasons

Current recommendation strategy is still heuristic, but no longer pure mock text.

## What Has Been Verified

### Frontend

Verified:

- `npm run build` passes in [frontend](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend)

### Worker

Verified:

- `python3 -m py_compile` passes for [main.py](/Volumes/CODEX_DISK/apps/Ebook%20jinak/ai-worker/app/main.py)
- live HTTP checks succeeded for:
  - `/health`
  - `/catalog/books`
  - `/jobs/delivery`
  - `/jobs/translation`
  - `/jobs/translation/{id}/document`
  - `/intelligence/books/{slug}`
  - `/intelligence/authors/{id}`
  - `/recommendations/authors/{id}`

### Backend

Verified:

- backend now builds cleanly with Go 1.24
- live runtime checks succeeded for:
  - `/healthz`
  - `/api/delivery/devices`
  - `/api/delivery/connectors/smtp`
  - `/api/delivery/devices/{id}/preflight`
  - `/api/delivery/jobs`
  - `/api/delivery/jobs/{id}`
  - `/api/delivery/jobs/{id}/retry`
  - `/api/intelligence/authors/{id}`

Important environment note:

- local machine Go was unavailable at first
- Go 1.22 tarball built but generated a Darwin 25 runtime issue
- Go 1.24.2 under [.tools/go124](/Volumes/CODEX_DISK/apps/Ebook%20jinak/.tools/go124) was used successfully for backend verification

## What Is Still Missing

### Delivery

Not done yet:

- real SMTP onboarding persistence
- UI form for SMTP config
- successful Kindle send with working credentials
- Kobo and other device connectors
- richer device troubleshooting flow

### Translation

Not done yet:

- full long-form translation engine
- terminology memory across sessions
- better chunking than current excerpt-first approach
- stable translation storage model beyond current worker artifacts
- quality review pass over full chapters

### Intelligence

Not done yet:

- better literary feature extraction
- less raw top-term style summaries
- stronger work-series-translator-publisher relationships
- richer author evolution modeling
- grounding beyond current owned corpus + Open Library mix

### Recommendations

Not done yet:

- hybrid retrieval plus rerank pipeline
- stronger cross-author similarity
- recommendations driven by bibliographic gaps in a more elegant way
- higher quality reasoning text
- better filtering of noisy Open Library known works

### Data and Persistence

Not done yet:

- real database-backed persistence
- migrations in active use
- repository implementations beyond in-memory backend mock repo
- durable syncing between backend and worker state

## Known Weak Spots

1. Backend repo is still mock/in-memory.
This is fine for product shaping, but not for durable product behavior.

2. Worker catalog and backend catalog are still partially split.
They are much more aligned than before, but not yet a single clean source of truth.

3. Author intelligence still has noisy terms.
Examples like `adventures`, `always`, `carroll` show that current feature extraction is improved but not yet strong enough.

4. Open Library known works are real now, but still noisy.
Some entries are compilations, translations, or odd editions rather than clean canonical works.

5. Translation is structurally useful, but not yet high-quality enough to call production translation.

## Recommended Next Steps

If another AI continues from here, the best order is:

1. improve author and book signal extraction
2. clean and rank Open Library bibliography items more intelligently
3. strengthen recommendation scoring using owned-vs-known gaps
4. add real SMTP configuration flow and successful Kindle send path
5. move backend from in-memory repo to real persistence

## Files Most Important For Continuation

Product direction:

- [master-spec.md](/Volumes/CODEX_DISK/apps/Ebook%20jinak/docs/master-spec.md)
- [product-priorities.md](/Volumes/CODEX_DISK/apps/Ebook%20jinak/docs/product-priorities.md)
- [core-pillars-architecture.md](/Volumes/CODEX_DISK/apps/Ebook%20jinak/docs/core-pillars-architecture.md)

Frontend:

- [api.ts](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/lib/api.ts)
- [devices/page.tsx](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/devices/page.tsx)
- [authors/[id]/page.tsx](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/authors/%5Bid%5D/page.tsx)
- [translations/[id]/page.tsx](/Volumes/CODEX_DISK/apps/Ebook%20jinak/frontend/app/translations/%5Bid%5D/page.tsx)

Backend:

- [domain.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/domain/domain.go)
- [pillars.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/handler/pillars.go)
- [job_orchestrator.go](/Volumes/CODEX_DISK/apps/Ebook%20jinak/backend/internal/service/job_orchestrator.go)

Worker:

- [main.py](/Volumes/CODEX_DISK/apps/Ebook%20jinak/ai-worker/app/main.py)

## Short Summary

This repo is no longer an empty concept.

It is currently:

- a strong product skeleton
- a clean frontend shell
- a verified backend API layer
- a working worker for upload, delivery jobs, translation jobs, and generated intelligence

The main unfinished work is not “build more screens.”
The main unfinished work is:

- make delivery truly usable
- make translation truly strong
- make author intelligence and recommendations genuinely smart
