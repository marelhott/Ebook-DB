# UI Spec

## Global Shell

### App Structure

- left navigation rail on desktop
- top utility bar for search and quick actions
- main content pane with generous horizontal padding
- responsive collapse to bottom navigation or compact drawer on smaller screens

### Navigation Items

- Home
- My Library
- Reading Now
- Authors
- Search
- Profile

Discovery can appear later and should not be a primary top-level burden in MVP.

## Screen 1: Home

### Goal

Make the collection feel alive immediately.

### Sections

- Continue Reading
- Recently Added
- Currently Reading
- Quiet suggestion rail based on owned books

### Layout

- top area with one dominant continue-reading module
- secondary horizontal rails beneath
- no dashboard-style statistics wall at the top

### Key Components

- continue-reading hero tile
- book rail cards
- mini author chips
- progress bars

## Screen 2: My Library

### Goal

Browse, filter, and manage owned books without losing visual delight.

### Controls

- search inside library
- grid/list toggle
- filters for:
  - reading status
  - language
  - format
  - author
- sort:
  - recently added
  - title
  - author
  - last opened

### Layout

- filters in a slim toolbar, not a heavy sidebar in MVP
- grid cards large enough to let covers breathe
- metadata below covers in 2 to 3 lines maximum

### Book Card

Fields:

- cover
- title
- author
- format chip
- owned state
- reading progress if relevant

Behavior:

- subtle hover lift
- quick actions on hover only if they stay quiet

## Screen 3: Import / Metadata Review

### Goal

Turn raw uploads into trusted book objects.

### Layout

- import progress on top
- queue of unmatched or low-confidence books below
- each row shows:
  - extracted title/author
  - proposed match
  - cover preview
  - confidence state

### Actions

- confirm
- rematch
- edit manually
- skip

### Tone

This screen should feel smart and helpful, not like a data cleanup console.

## Screen 4: Book Detail

### Goal

Give every book the emotional and informational weight of a premium media page.

### Structure

Left column:

- large cover
- owned formats
- reading CTA

Main column:

- title
- subtitle if present
- author line
- synopsis
- metadata row
- series placement
- translator and publisher where available

Supporting modules:

- about this edition
- related books
- about the author
- short AI summary panel later

### CTA Hierarchy

- primary: Read now / Continue reading
- secondary: Add bookmark, mark finished, metadata edit

## Screen 5: Author Detail

### Goal

Present a literary profile that feels rich and authoritative without becoming encyclopedic clutter.

### Structure

Top:

- portrait or placeholder monogram
- author name
- concise bio
- nationality / dates if available

Main:

- bibliography grid
- owned books clearly marked
- related authors
- “where to start” block

### Visual Note

This page should feel calmer than IMDb and more elegant than Goodreads.

## Screen 6: Reader

### Goal

Deliver a calm, fast, modern reading experience.

### Reader Chrome

- top bar with title and minimal actions
- bottom or floating controls only when needed
- hidden chrome by default during reading

### Controls

- font size
- font family
- line height
- page width
- theme
- TOC
- search
- bookmark
- highlight

### Themes

- light
- sepia
- dark
- AMOLED black later if needed

### Behavior

- immediate resume at last location
- no heavy transitions
- no visual clutter over text

## Screen 7: Search

### Goal

Search should feel instant and elegant.

### Behavior

- command-palette style overlay on desktop
- full-screen search on mobile
- owned books shown first
- secondary results for authors and series

### Result Card

- cover thumbnail
- title
- author
- type label
- ownership indicator

### Empty State

- calm suggestion language
- invite upload or retry, never a cold dead blank

## Component Rules

### Buttons

- medium weight
- rounded but not pill-heavy unless primary CTA
- one dominant primary style
- one quiet secondary style

### Inputs

- labels above input
- light border
- soft focus ring
- no overly bright accent glows

### Filters

- chip-like but refined
- active state should be subtle and inked

### Progress

- thin reading progress indicators
- avoid chunky bars

## Design Tokens

### Radius

- small: 10px
- medium: 16px
- large: 24px

### Shadow

- extremely soft
- low opacity
- broad diffusion

### Border

- 1px equivalent hairline
- warm gray tone

### Typography

- display reserved for page titles and editorial sections
- sans for body, metadata, controls

## Anti-Slop Checklist

- no emoji
- no default dashboard cards everywhere
- no purple AI startup palette
- no oversized glassmorphism
- no thick icon strokes
- no giant hero gradients
- no empty decorative shapes with no purpose
- no generic “AI assistant” block dominating layout

## MVP Visual Priority Order

1. library cover presentation
2. reader calmness
3. book detail richness
4. import review clarity
5. author page elegance
