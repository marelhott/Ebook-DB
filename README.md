# Book Universe

## Start Here

- Product and technical master spec: `docs/master-spec.md`
- Recommended implementation order: `docs/build-order.md`
- Product priorities: `docs/product-priorities.md`
- Design direction: `docs/design-direction.md`
- UI spec: `docs/ui-spec.md`

## Recommended Order

1. Review `docs/master-spec.md`
2. Validate or adjust scope in `docs/build-order.md`
3. Review `docs/design-direction.md`
4. Review `docs/ui-spec.md`
5. Start implementation from the repo skeleton

## Current Product Direction

Ownership-first book platform centered on:

- clean library management
- wireless device delivery
- translation workflows
- AI author and book intelligence
- AI recommendations

## Workspace Structure

- `docs/` product, build, and design specifications
- `prompts/` legacy prompt artifacts kept for reference
- `frontend/` Next.js application shell
- `backend/` Go API skeleton
- `ai-worker/` Python metadata and AI worker

## Local Development

The repository is being scaffolded as a three-service setup:

- `frontend` for the product UI
- `backend` for API, config, and repository abstractions
- `ai-worker` for EPUB parsing, metadata enrichment, and later AI tasks

Use:

```bash
docker compose up --build
```

This repository is intentionally starting with structure first, then implementation of the library, delivery, translation, intelligence, and recommendation flow.
