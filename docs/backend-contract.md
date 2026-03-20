# Backend Contract

## Goal

Keep the backend contract minimal, but aligned with the real product pillars:

1. library import and catalog
2. wireless delivery to devices
3. translation jobs
4. author and book intelligence
5. recommendation rails

## Route Groups

### Catalog

- `GET /api/books`
- `GET /api/books/{slug}`
- `GET /api/authors/{id}`
- `GET /api/import/review`
- `POST /api/import/review`

### Reader State

- `GET /api/reader/state/{workSlug}`
- `PUT /api/reader/state/{workSlug}`
- `POST /api/reader/state/{workSlug}/bookmarks`
- `DELETE /api/reader/state/{workSlug}/bookmarks/{bookmarkID}`

This remains secondary. It exists to support fallback web reading, not to define the product.

### Delivery

- `GET /api/delivery/devices`
- `GET /api/delivery/jobs`
- `GET /api/delivery/jobs/{id}`
- `POST /api/delivery/jobs`

### Translation

- `GET /api/translations/jobs`
- `GET /api/translations/jobs/{id}`
- `POST /api/translations/jobs`

### Intelligence

- `GET /api/intelligence/books/{workSlug}`
- `GET /api/intelligence/authors/{authorID}`

### Recommendations

- `GET /api/recommendations/books/{workSlug}`
- `GET /api/recommendations/authors/{authorID}`

## Core Domain Entities

### Existing

- `Work`
- `Edition`
- `Author`
- `Translator`
- `Publisher`
- `Series`
- `Genre`
- `UserBook`
- `FileAsset`

### New

- `DeliveryDevice`
- `DeliveryJob`
- `TranslationJob`
- `BookIntelligence`
- `AuthorIntelligence`
- `RecommendationRail`
- `RecommendationItem`

## Minimal Payload Intent

### DeliveryDevice

Represents a configured target the user can send books to.

Required fields:

- `id`
- `name`
- `provider`
- `delivery_method`
- `formats`

### DeliveryJob

Represents a single send action for a specific edition and target device.

Required fields:

- `id`
- `work_slug`
- `edition_id`
- `device_id`
- `format`
- `status`
- `queued_at`

### TranslationJob

Represents a queued or completed translation workflow.

Required fields:

- `id`
- `work_slug`
- `file_asset_id`
- `source_language`
- `target_language`
- `mode`
- `provider`
- `status`
- `output_format`
- `queued_at`

### BookIntelligence

Summarized AI understanding of a book, designed for study and recommendation explanation.

Required fields:

- `work_slug`
- `one_line_summary`
- `deep_summary`
- `themes`
- `moods`
- `generated_at`

### AuthorIntelligence

Summarized AI understanding of the author as a body of work, not just a biography blob.

Required fields:

- `author_id`
- `one_line_summary`
- `career_arc`
- `recurring_themes`
- `entry_points`
- `read_next_strategy`
- `generated_at`

### RecommendationRail

A concrete recommendation surface with reasons.

Required fields:

- `id`
- `title`
- `anchor_kind`
- `anchor_id`
- `items`
- `generated_at`

## Implementation Order

1. Catalog and import quality
2. Delivery devices and delivery jobs
3. Translation jobs
4. Intelligence payloads
5. Recommendation rails

## Guardrails

- Delivery failures must be explicit, never silent.
- Translation must be modeled as jobs with traceable status, not magic buttons.
- Intelligence must be explainable and editable.
- Recommendations must carry reasons, not only opaque scores.
- Reader-specific APIs must not pull the roadmap back into a reader-first product.
