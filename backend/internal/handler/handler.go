package handler

import (
	"encoding/json"
	"net/http"

	"ebook-jinak/backend/internal/service"
	"ebook-jinak/backend/internal/repository"
)

type Handler struct {
	healthService *service.HealthService
	bookRepo      repository.BookRepository
	jobOrchestrator *service.JobOrchestrator
}

func New(healthService *service.HealthService, bookRepo repository.BookRepository, jobOrchestrator *service.JobOrchestrator) *Handler {
	return &Handler{
		healthService: healthService,
		bookRepo:      bookRepo,
		jobOrchestrator: jobOrchestrator,
	}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", h.healthz)
	mux.HandleFunc("/readyz", h.readyz)
	mux.HandleFunc("/api/books", h.books)
	mux.HandleFunc("/api/books/", h.bookBySlug)
	mux.HandleFunc("/api/authors/", h.authorByID)
	mux.HandleFunc("/api/import/review", h.importReview)
	mux.HandleFunc("/api/delivery/devices", h.deliveryDevices)
	mux.HandleFunc("/api/delivery/connectors/smtp", h.deliverySMTPConnectorStatus)
	mux.HandleFunc("/api/delivery/devices/", h.deliveryDeviceRoutes)
	mux.HandleFunc("/api/delivery/jobs", h.deliveryJobs)
	mux.HandleFunc("/api/delivery/jobs/", h.deliveryJobRoutes)
	mux.HandleFunc("/api/translations/jobs", h.translationJobs)
	mux.HandleFunc("/api/translations/jobs/", h.translationJobRoutes)
	mux.HandleFunc("/api/intelligence/books/", h.bookIntelligence)
	mux.HandleFunc("/api/intelligence/authors/", h.authorIntelligence)
	mux.HandleFunc("/api/recommendations/books/", h.bookRecommendations)
	mux.HandleFunc("/api/recommendations/authors/", h.authorRecommendations)
	mux.HandleFunc("/api/reader/state/", h.readerState)
	return mux
}

func (h *Handler) healthz(w http.ResponseWriter, r *http.Request) {
	h.writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

func (h *Handler) readyz(w http.ResponseWriter, r *http.Request) {
	status, err := h.healthService.Check(r.Context())
	if err != nil {
		h.writeJSON(w, http.StatusServiceUnavailable, status)
		return
	}

	h.writeJSON(w, http.StatusOK, status)
}

func (h *Handler) writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	encoder := json.NewEncoder(w)
	encoder.SetEscapeHTML(false)
	_ = encoder.Encode(payload)
}
