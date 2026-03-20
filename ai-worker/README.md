# AI Worker

This service will handle:

- EPUB metadata extraction
- external metadata enrichment
- fuzzy matching
- delivery job orchestration with SMTP-based send-to-device attempts
- translation job orchestration with persisted output artifacts
- later AI summaries and tagging

Current implemented endpoint:

- `GET /health`
- `GET /catalog/books`
- `GET /connectors/smtp/status`
- `GET /intelligence/books/{slug}`
- `GET /intelligence/authors/{id}`
- `GET /recommendations/books/{slug}`
- `GET /recommendations/authors/{id}`
- `GET /jobs/delivery`
- `GET /jobs/delivery/{id}`
- `GET /jobs/translation`
- `GET /jobs/translation/{id}`
- `GET /jobs/translation/{id}/document`
- `GET /artifacts/translations/{job_id}.md`
- `GET /artifacts/translations/{job_id}.json`
- `GET /files/{checksum}.epub`
- `POST /extract/epub-metadata`
- `POST /upload/epub`
- `POST /jobs/delivery`
- `POST /jobs/translation`

`/extract/epub-metadata` accepts a local file path and returns basic EPUB metadata extracted through `ebooklib`.

`/upload/epub` accepts JSON with:

- `file_name`
- `content_base64`

The worker stores the EPUB in local upload storage and returns extracted metadata plus the stored path and checksum.

Uploaded EPUBs are also added to a lightweight JSON catalog so the frontend can surface them in the library before the main backend persistence layer is complete.

Delivery and translation jobs are persisted as lightweight JSON queues and now act as the source of truth for job reads as the backend grows out of mock-only orchestration.

Current lifecycle behavior:

- delivery jobs transition `queued -> processing -> delivered|failed`
- translation jobs transition `queued -> processing -> completed|failed`
- translation completion writes both markdown and chapter JSON artifacts under the translation output root
- if `DEEPL_API_KEY` is configured and the provider path is `deepl-*`, chapter excerpts are translated through DeepL before the study workspace is persisted
- job processing happens in background threads after the request returns
- intelligence and recommendation payloads can be generated on first read and persisted to worker storage
- author intelligence can optionally enrich owned-corpus reasoning with cached Open Library bibliography data

Relevant worker env vars:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_USE_TLS`
- `PUBLIC_BASE_URL`
- `TRANSLATION_OUTPUT_ROOT`
- `INTELLIGENCE_BOOK_ROOT`
- `INTELLIGENCE_AUTHOR_ROOT`
- `RECOMMENDATION_BOOK_ROOT`
- `RECOMMENDATION_AUTHOR_ROOT`
- `OPENLIBRARY_BASE_URL`
- `OPENLIBRARY_APP_NAME`
- `OPENLIBRARY_CONTACT`
- `DEEPL_API_KEY`
- `DEEPL_API_BASE_URL`

The first real Kindle-style delivery path uses the selected device email plus SMTP credentials. If the source file is not present in worker storage or SMTP is not configured, the job finishes with a clear failure reason instead of staying permanently queued.

For Open Library usage, identify your application with a useful `User-Agent` contact string and keep requests low-volume and cached.
