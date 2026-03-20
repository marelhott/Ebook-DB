# Backend

Minimal Go backend scaffold for the Book Universe product.

## What is here

- `cmd/server`: application entrypoint
- `internal/config`: environment-based config loading
- `internal/handler`: HTTP handlers and routing
- `internal/repository`: storage abstractions and placeholder implementation
- `internal/service`: application services
- `migrations`: placeholder for future SQL migrations

## Endpoints

- `GET /healthz`
- `GET /readyz`
- `GET /api/books`
- `GET /api/books/{slug}`
- `GET /api/authors/{id}`
- `GET /api/import/review`
- `POST /api/import/review`
- `GET /api/books`
- `GET /api/books/{slug}`
- `GET /api/authors/{id}`
- `GET /api/import/review`

## Mock Data

The current API is backed by an in-memory repository seeded with a small book dataset so the frontend can iterate against realistic payloads before SQLite or PostgreSQL is introduced.

## Configuration

Environment variables:

- `APP_HOST` default empty / binds on all interfaces
- `APP_PORT` default `8080`
- `ADDR` default `:8080`
- `APP_NAME` default `Book Universe API`
- `APP_ENV` default `development`
- `DB_DRIVER` default `sqlite`
- `DB_DSN` default `file:/data/book-universe.db`
- `STORAGE_ROOT` default `/data/storage`
- `READ_TIMEOUT` default `5s`
- `WRITE_TIMEOUT` default `10s`
- `IDLE_TIMEOUT` default `60s`
- `SHUTDOWN_TIMEOUT` default `10s`

## Notes

- This scaffold uses only the Go standard library for now.
- The repository layer is intentionally small and ready to be swapped for SQLite or PostgreSQL implementations later.
- Import upload is currently a mock in-memory flow intended to support frontend iteration before real file ingest lands.
