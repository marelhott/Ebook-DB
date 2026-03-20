package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"ebook-jinak/backend/internal/domain"
	"ebook-jinak/backend/internal/repository"
)

func (h *Handler) books(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	books, err := h.bookRepo.ListBooks(r.Context())
	if err != nil {
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{
			"error": "failed to list books",
		})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{
		"data": books,
	})
}

func (h *Handler) bookBySlug(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	slug := strings.TrimPrefix(r.URL.Path, "/api/books/")
	if slug == "" || slug == r.URL.Path {
		http.NotFound(w, r)
		return
	}

	book, err := h.bookRepo.GetBookBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			http.NotFound(w, r)
			return
		}

		h.writeJSON(w, http.StatusInternalServerError, map[string]any{
			"error": "failed to load book",
		})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{
		"data": book,
	})
}

func (h *Handler) authorByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/authors/")
	if id == "" || id == r.URL.Path {
		http.NotFound(w, r)
		return
	}

	author, err := h.bookRepo.GetAuthorByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			http.NotFound(w, r)
			return
		}

		h.writeJSON(w, http.StatusInternalServerError, map[string]any{
			"error": "failed to load author",
		})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{
		"data": author,
	})
}

func (h *Handler) importReview(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		review, err := h.bookRepo.GetImportReview(r.Context())
		if err != nil {
			h.writeJSON(w, http.StatusInternalServerError, map[string]any{
				"error": "failed to load import review",
			})
			return
		}

		h.writeJSON(w, http.StatusOK, map[string]any{
			"data": review,
		})
	case http.MethodPost:
		var payload struct {
			FileNames []string `json:"file_names"`
		}

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.writeJSON(w, http.StatusBadRequest, map[string]any{
				"error": "invalid JSON payload",
			})
			return
		}

		review, err := h.bookRepo.MockUpload(r.Context(), payload.FileNames)
		if err != nil {
			h.writeJSON(w, http.StatusInternalServerError, map[string]any{
				"error": "failed to process mock upload",
			})
			return
		}

		h.writeJSON(w, http.StatusOK, map[string]any{
			"data": review,
		})
	default:
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func (h *Handler) readerState(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/reader/state/")
	if path == "" || path == r.URL.Path {
		http.NotFound(w, r)
		return
	}

	parts := strings.Split(path, "/")
	workSlug := parts[0]

	if len(parts) == 1 {
		switch r.Method {
		case http.MethodGet:
			state, err := h.bookRepo.GetReaderState(r.Context(), workSlug)
			if err != nil {
				h.writeJSON(w, http.StatusInternalServerError, map[string]any{
					"error": "failed to load reader state",
				})
				return
			}

			h.writeJSON(w, http.StatusOK, map[string]any{"data": state})
		case http.MethodPut:
			var payload domain.ReaderState
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				h.writeJSON(w, http.StatusBadRequest, map[string]any{
					"error": "invalid JSON payload",
				})
				return
			}

			payload.WorkSlug = workSlug
			state, err := h.bookRepo.SaveReaderState(r.Context(), payload)
			if err != nil {
				h.writeJSON(w, http.StatusInternalServerError, map[string]any{
					"error": "failed to save reader state",
				})
				return
			}

			h.writeJSON(w, http.StatusOK, map[string]any{"data": state})
		default:
			http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		}
		return
	}

	if len(parts) >= 2 && parts[1] == "bookmarks" {
		switch r.Method {
		case http.MethodPost:
			var payload domain.ReaderBookmark
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				h.writeJSON(w, http.StatusBadRequest, map[string]any{
					"error": "invalid JSON payload",
				})
				return
			}

			bookmark, err := h.bookRepo.AddReaderBookmark(r.Context(), workSlug, payload)
			if err != nil {
				h.writeJSON(w, http.StatusInternalServerError, map[string]any{
					"error": "failed to save bookmark",
				})
				return
			}

			h.writeJSON(w, http.StatusOK, map[string]any{"data": bookmark})
		case http.MethodDelete:
			if len(parts) < 3 {
				http.NotFound(w, r)
				return
			}

			if err := h.bookRepo.DeleteReaderBookmark(r.Context(), workSlug, parts[2]); err != nil {
				h.writeJSON(w, http.StatusInternalServerError, map[string]any{
					"error": "failed to delete bookmark",
				})
				return
			}

			h.writeJSON(w, http.StatusOK, map[string]any{"status": "ok"})
		default:
			http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		}
		return
	}

	http.NotFound(w, r)
}
