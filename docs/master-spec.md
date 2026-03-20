# Book Universe

## One-line Product Definition

The most beautiful way to organize, deliver, translate, and understand the books you actually own.

## Product Thesis

The winning product is not another Goodreads clone, not another utilitarian ebook manager, and not a desktop reader product.
It combines:

- a visually rich personal library for real EPUB and PDF files
- a delivery layer that gets books onto dedicated reading devices without cables
- a translation layer that makes long-form study practical
- an AI layer that understands authors, books, themes, relationships, and recommendations
- strong public metadata around books, authors, series, translators, publishers, and genres

The core user promise is simple:

- my real books are here
- they are automatically organized
- I can send them to the device I actually want to read on
- I can translate and study them deeply
- the system helps me understand authors and discover what to read next

## Product Positioning

Mental model:

- IMDb for book and author context
- Plex for owned media
- BookFusion / Booklore for visual library organization
- a device bridge for wireless delivery
- an AI curator for author intelligence and recommendations

This product should win on unified experience:

- discover
- own
- organize
- deliver
- translate
- understand

Most competitors only do one or two of these well.

## Product Scope

### In Scope

- personal library above owned files
- bulk import and folder watching
- automatic metadata enrichment
- manual metadata correction
- wireless delivery to reading devices
- book detail and rich author detail
- search across personal library
- translation workflow for passages and books
- Goodreads CSV import
- AI-driven author/book intelligence
- AI-driven recommendations

### Out of Scope for MVP

- full social network
- full desktop reader polish
- global discovery homepage
- AI chatbot
- MCP
- public community profiles
- advanced mobile apps

## Primary Audience

- readers with an existing ebook collection
- users frustrated by fragmented workflows between file manager, metadata sites, translation tools, and e-readers
- users who care about visual quality, clean metadata, device convenience, and deep understanding of books and authors

## Core User Jobs

1. Import and organize hundreds of owned books without chaos.
2. Quickly fix bad metadata, editions, translators, and covers.
3. Send a selected book wirelessly to the right reading device.
4. Translate passages or books well enough for long study.
5. Understand the author, bibliography, themes, and relationships behind a book.
6. Get genuinely useful recommendations for similar authors and books.

## Product Principles

1. Ownership-first.
   Public metadata and AI exist to enrich the books the user already owns.

2. Beauty is part of the product.
   This cannot look like admin software.

3. Device-first reading.
   Desktop reading is a utility, not the center of the product.

4. Metadata quality matters more than AI novelty.
   Broken metadata destroys trust.

5. AI should act as curator and analyst.
   The product needs active AI for author understanding, relationship mapping, and recommendations.

6. Translation is a core workflow, not a side feature.

## MVP Definition

### Must-have

- bulk upload of EPUB files
- optional watched folders
- Goodreads CSV import
- metadata extraction from file
- metadata enrichment from external sources
- manual edit and match review
- personal library grid/list
- filters and sorting
- device management and wireless delivery jobs
- book detail page
- rich author detail with bibliography and “where to start”
- search across owned library
- translation request flow
- first-pass AI author/book intelligence
- first-pass AI recommendations

### Nice-to-have if time allows

- lightweight series support in UI
- translator and publisher pages as simple linked records
- cover retry / rematch flow
- delivery history and device preferences
- translation glossary preferences

### Explicitly Later

- PDF reading polish
- discovery homepage rails
- global browsing by genre
- cloud sync across devices
- hosted billing
- community and social layer

## Data Model

### Canonical Entities

- Work
- Edition
- Author
- Translator
- Publisher
- Series
- Genre
- UserBook
- FileAsset
- ReadingProgress
- ReadingSession
- Highlight
- DeliveryDevice
- DeliveryJob
- TranslationJob
- AuthorIntelligence
- WorkIntelligence
- RecommendationCluster
- CustomShelf
- Tag

### Model Intent

Work:

- abstract literary work
- original title, original language, first publication year

Edition:

- concrete edition or translation
- tied to one Work
- contains language, publisher, translator, ISBN, page count, cover

UserBook:

- user ownership and reading relationship to one Edition

FileAsset:

- the actual EPUB or later PDF file the user owns

This separation is critical for multilingual markets and translator-sensitive use cases.

## Recommended Tech Stack

### Frontend

- Next.js 15
- React 19
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- next-intl
- epub.js
- Workbox + IndexedDB

### API

- Go
- Chi router
- repository pattern from day 1
- fsnotify for watched folders
- slog for structured logging
- goose for migrations

### Worker

- Python
- FastAPI
- ebooklib for EPUB parsing
- rapidfuzz for matching
- httpx for metadata source clients
- Pillow for cover processing

### Persistence

- SQLite for self-hosted single-user mode
- PostgreSQL for hosted multi-user mode
- local filesystem or S3-compatible object storage

## Metadata Strategy

Priority order:

1. internal EPUB metadata
2. Open Library
3. Google Books
4. National Library of the Czech Republic
5. manual correction by user

Requirements:

- ISBN-first matching when available
- title + author + year fuzzy fallback
- explicit review queue for uncertain matches

## Delivery and Intelligence Requirements

Must-have:

- user can register preferred delivery targets
- user can send a book to a selected device without cables
- translation requests are clearly scoped and track status
- author pages surface bibliography, themes, and suggested entry points
- recommendation output explains why the suggestion is relevant

Failure modes that must not happen:

- metadata mismatch after import
- book sent to wrong device or wrong format
- AI recommendation with no visible reasoning
- translation workflow that loses trust or context

## Non-functional Requirements

Performance targets:

- EPUB open under 2s
- first 50 covers rendered under 200ms after data is available
- personal library search under 300ms
- API P95 read under 200ms

Accessibility:

- WCAG 2.1 AA baseline
- keyboard navigation
- screen reader-safe semantics
- dyslexia-friendly typography options later

Privacy:

- no mandatory cloud dependency for self-hosted mode
- exportable user data
- deletable account data in hosted mode

## Key Risks

1. Overbuilding discovery before the personal library is excellent.
2. Underestimating bad metadata cleanup workload.
3. Treating PDF as “just one more format”.
4. Shipping AI before the reader and import pipeline are trustworthy.
5. Building too much custom reader infrastructure instead of using proven components.

## Recommended First Milestone

The first usable milestone is:

- import 100 EPUB files
- enrich enough metadata to make the library attractive
- correct bad matches manually
- open any imported book and preserve reading position

If this works well, the product already has a legitimate wedge.
