# Design Direction

## Creative Direction

The product should feel like a premium digital reading salon, not a dashboard and not a file manager.

Reference feeling:

- BookFusion for clarity and cleanliness
- Booklore for library-first structure
- Apple Books for calmness
- Letterboxd and IMDb for rich media detail pages

This is not a loud cinematic product. It should feel:

- clean
- restrained
- ultra-modern
- editorial
- soft and intelligent

The experience should create trust, not spectacle.

## Design Principles

### 1. Clean First

Every screen should feel composed and intentional. No decorative clutter. No gimmick-heavy hero sections. No artificial visual noise.

### 2. Cover-Led Interface

Book covers are the visual anchor. Layout should elevate them, not compete with them.

### 3. Soft Depth, Not Hard Card UI

Avoid generic boxed SaaS cards. Use light layering, soft edge contrast, subtle borders, and carefully controlled depth.

### 4. Editorial Typography

Typography should do much of the emotional work. The interface must feel designed through spacing, rhythm, and hierarchy rather than through excessive decoration.

### 5. Ownership Should Feel Premium

A user-uploaded EPUB should feel as legitimate and beautiful as a major catalog title.

### 6. AI Should Be Visually Quiet

AI belongs in elegant side panels, concise summaries, metadata helpers, and recommendations. Never center the product visually around AI.

## Visual Personality

### General Mood

- literary
- calm
- premium
- precise
- contemporary

### What To Avoid

- purple-on-white AI startup visuals
- busy gradients
- emoji
- oversized glowing buttons
- developer-tool or enterprise-table aesthetics
- generic dashboard widgets
- chunky icons
- heavy shadows
- playful illustrations

## Palette

The palette should be warm-neutral with deep ink contrast.

### Core Neutrals

- background: warm ivory or very soft parchment
- elevated surface: clean warm white
- primary text: deep charcoal, almost ink black
- secondary text: muted graphite
- dividers: soft stone gray with low contrast

### Accent Strategy

Use one accent family at a time, with quiet saturation.

Recommended accents:

- dark forest green
- oxblood
- deep navy

Accent should be used for:

- active states
- subtle highlights
- reading progress
- selected filters

Do not use accent as a full-interface wash.

## Typography

Typography should avoid generic product defaults.

### Recommended Pairing

- Display: `Canela`, `Noe Display`, or `Ivar Display`
- UI / Body: `Suisse Intl`, `Neue Haas Grotesk`, `Söhne`, or `Akkurat`
- Fallback practical pairing for development:
  - Display: `Cormorant Garamond` only for selected editorial moments
  - UI / Body: `Geist` or `Plus Jakarta Sans`

### Rules

- Use serif sparingly and with purpose
- Use sans-serif for the majority of interface controls and metadata
- Headlines should be compact and elegant, not oversized for the sake of drama
- Metadata and secondary information must remain highly legible

## Iconography

Icons must be light, minimal, and precise.

Recommended families:

- Phosphor Light
- Remix Line
- Radix icons where appropriate

Rules:

- no emoji
- no thick Lucide-like visual weight unless restyled consistently
- icons should support the interface, not become decoration

## Layout System

### Grid Philosophy

- wide breathable content area
- strong alignment
- large cover imagery balanced by calm metadata columns
- asymmetric moments only where they improve hierarchy

### Recommended Container Widths

- application shell max width: 1440px
- content detail max width: 1280px
- reader shell should be narrower and calmer

### Spacing

Use an 8px base grid, but apply it with generous rhythm.

Suggested scale:

- 8
- 12
- 16
- 24
- 32
- 48
- 64
- 96

The interface should breathe. Avoid compression.

## Surface Language

### Surfaces

- slightly warm white
- ultra-soft border
- very subtle shadow diffusion
- large radii, but not bubbly

### Border Treatment

- hairline borders
- no harsh gray strokes
- no overuse of boxed sections

### Cards

Cards should feel like refined display panels, not widgets.

Use cards mainly for:

- book items
- metadata review blocks
- reading progress modules
- summary panels

Do not wrap everything in cards.

## Motion

Motion should be restrained and premium.

### Use Motion For

- cover hover lift
- rail reveals
- smooth page transitions
- quiet filter transitions
- reader chrome fade in/out

### Avoid

- flashy parallax
- over-animated backgrounds
- bouncing UI
- exaggerated glassmorphism

Motion style:

- spring-based
- soft easing
- duration usually between 180ms and 320ms

## Page-Level Direction

### Home

Feels like a premium personal bookshelf and editorial front page.

- strong continue reading section
- recently added rail
- clean recommendation rail
- large breathing room

### Library

Should feel efficient but never technical.

- clean filters
- powerful but quiet controls
- covers dominate
- metadata remains readable

### Book Detail

This is where the product should feel richest.

- large cover
- elegant synopsis
- ownership clearly visible
- author, series, metadata, and reading actions arranged in a composed layout

### Author Detail

Should feel close to an IMDb profile but calmer and more literary.

- portrait if available
- biography
- bibliography grid
- “where to start”

### Reader

This should be the calmest surface in the app.

- minimal chrome
- careful typography
- quiet controls
- no visual distractions

### Import / Metadata Review

Must feel intelligent, not technical.

- confidence states
- side-by-side match previews
- clean corrective actions

## Brand Tone

The interface should imply:

- this app respects books
- this app respects taste
- this app respects the reader's collection

It should feel more like a premium cultural product than a productivity app.
