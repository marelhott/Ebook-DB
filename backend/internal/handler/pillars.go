package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"ebook-jinak/backend/internal/domain"
	"ebook-jinak/backend/internal/service"
)

func (h *Handler) deliveryDevices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	devices, err := h.bookRepo.ListDeliveryDevices(r.Context())
	if err != nil {
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load delivery devices"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": devices})
}

func (h *Handler) deliverySMTPConnectorStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	status, err := h.jobOrchestrator.GetSMTPConnectorStatus(r.Context())
	if err != nil {
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load connector status"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": status})
}

func (h *Handler) deliveryPreflight(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	deviceID := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/api/delivery/devices/"), "/preflight")
	devices, err := h.bookRepo.ListDeliveryDevices(r.Context())
	if err != nil {
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load delivery devices"})
		return
	}

	var target *domain.DeliveryDevice
	for index := range devices {
		if devices[index].ID == deviceID {
			target = &devices[index]
			break
		}
	}
	if target == nil {
		http.NotFound(w, r)
		return
	}

	connector, err := h.jobOrchestrator.GetSMTPConnectorStatus(r.Context())
	if err != nil {
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load connector status"})
		return
	}

	checklist := []string{
		"Device has a valid send-to-device address.",
		"SMTP sender is configured.",
		"Sender address is approved in Amazon Send to Kindle settings.",
	}
	preflight := domain.DeliveryPreflight{
		DeviceID:       target.ID,
		DeviceName:     target.Name,
		DeviceProvider: target.Provider,
		DeliveryMethod: target.DeliveryMethod,
		CanSend:        true,
		Checklist:      checklist,
	}

	if target.Email == "" {
		preflight.CanSend = false
		preflight.BlockingReason = "Selected device has no send-to-device address configured."
		preflight.RecommendedNextStep = "Add the Kindle email address first, then retry delivery."
	} else if !connector.Configured {
		preflight.CanSend = false
		preflight.BlockingReason = "SMTP connector is not configured."
		preflight.RecommendedNextStep = "Configure SMTP host and sender, then retry delivery."
	} else if target.DeliveryMethod != "send-to-kindle" {
		preflight.CanSend = false
		preflight.BlockingReason = "Only Kindle send-to-email is fully supported right now."
		preflight.RecommendedNextStep = "Use a Kindle-compatible device path first."
	} else {
		preflight.RecommendedNextStep = "Approve the sender in Amazon settings if this is the first send, then queue delivery."
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": preflight})
}

func (h *Handler) deliveryJobs(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		jobs, err := h.jobOrchestrator.ListDeliveryJobs(r.Context())
		if err != nil {
			h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load delivery jobs"})
			return
		}

		h.writeJSON(w, http.StatusOK, map[string]any{"data": jobs})
	case http.MethodPost:
		var payload domain.DeliveryJobRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid JSON payload"})
			return
		}

		devices, err := h.bookRepo.ListDeliveryDevices(r.Context())
		if err != nil {
			h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load delivery devices"})
			return
		}
		for _, device := range devices {
			if device.ID != payload.DeviceID {
				continue
			}
			payload.DeviceName = device.Name
			payload.DeviceEmail = device.Email
			payload.DeliveryMethod = device.DeliveryMethod
			payload.DeviceProvider = device.Provider
			break
		}

		job, err := h.jobOrchestrator.CreateDeliveryJob(r.Context(), payload)
		if err != nil {
			h.writeJSON(w, http.StatusBadGateway, map[string]any{"error": "failed to create delivery job"})
			return
		}

		h.writeJSON(w, http.StatusCreated, map[string]any{"data": job})
	default:
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func (h *Handler) deliveryJobByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/delivery/jobs/")
	job, err := h.jobOrchestrator.GetDeliveryJobByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrRemoteNotFound) {
			http.NotFound(w, r)
			return
		}
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load delivery job"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": job})
}

func (h *Handler) retryDeliveryJob(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/api/delivery/jobs/"), "/retry")
	original, err := h.jobOrchestrator.GetDeliveryJobByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrRemoteNotFound) {
			http.NotFound(w, r)
			return
		}
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load original delivery job"})
		return
	}

	devices, err := h.bookRepo.ListDeliveryDevices(r.Context())
	if err != nil {
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load delivery devices"})
		return
	}

	request := domain.DeliveryJobRequest{
		WorkSlug:    original.WorkSlug,
		EditionID:   original.EditionID,
		DeviceID:    original.DeviceID,
		Format:      original.Format,
		Attempt:     original.Attempt + 1,
		RetriedFrom: original.ID,
	}
	for _, device := range devices {
		if device.ID != request.DeviceID {
			continue
		}
		request.DeviceName = device.Name
		request.DeviceEmail = device.Email
		request.DeliveryMethod = device.DeliveryMethod
		request.DeviceProvider = device.Provider
		break
	}

	job, err := h.jobOrchestrator.CreateDeliveryJob(r.Context(), request)
	if err != nil {
		h.writeJSON(w, http.StatusBadGateway, map[string]any{"error": "failed to retry delivery job"})
		return
	}

	h.writeJSON(w, http.StatusCreated, map[string]any{"data": job})
}

func (h *Handler) deliveryJobRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/retry") {
		h.retryDeliveryJob(w, r)
		return
	}
	h.deliveryJobByID(w, r)
}

func (h *Handler) deliveryDeviceRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/preflight") {
		h.deliveryPreflight(w, r)
		return
	}
	http.NotFound(w, r)
}

func (h *Handler) translationJobs(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		jobs, err := h.jobOrchestrator.ListTranslationJobs(r.Context())
		if err != nil {
			h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load translation jobs"})
			return
		}

		h.writeJSON(w, http.StatusOK, map[string]any{"data": jobs})
	case http.MethodPost:
		var payload domain.TranslationJobRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid JSON payload"})
			return
		}

		job, err := h.jobOrchestrator.CreateTranslationJob(r.Context(), payload)
		if err != nil {
			h.writeJSON(w, http.StatusBadGateway, map[string]any{"error": "failed to create translation job"})
			return
		}

		h.writeJSON(w, http.StatusCreated, map[string]any{"data": job})
	default:
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func (h *Handler) translationJobByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/translations/jobs/")
	job, err := h.jobOrchestrator.GetTranslationJobByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrRemoteNotFound) {
			http.NotFound(w, r)
			return
		}
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load translation job"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": job})
}

func (h *Handler) translationJobDocumentByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/api/translations/jobs/"), "/document")
	document, err := h.jobOrchestrator.GetTranslationDocumentByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrRemoteNotFound) {
			http.NotFound(w, r)
			return
		}
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load translation document"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": document})
}

func (h *Handler) translationJobRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/document") {
		h.translationJobDocumentByID(w, r)
		return
	}
	h.translationJobByID(w, r)
}

func (h *Handler) bookIntelligence(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	workSlug := strings.TrimPrefix(r.URL.Path, "/api/intelligence/books/")
	payload, err := h.jobOrchestrator.GetBookIntelligence(r.Context(), workSlug)
	if err != nil {
		if errors.Is(err, service.ErrRemoteNotFound) {
			http.NotFound(w, r)
			return
		}
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load book intelligence"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": payload})
}

func (h *Handler) authorIntelligence(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	authorID := strings.TrimPrefix(r.URL.Path, "/api/intelligence/authors/")
	payload, err := h.jobOrchestrator.GetAuthorIntelligence(r.Context(), authorID)
	if err != nil {
		if errors.Is(err, service.ErrRemoteNotFound) {
			http.NotFound(w, r)
			return
		}
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load author intelligence"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": payload})
}

func (h *Handler) bookRecommendations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	workSlug := strings.TrimPrefix(r.URL.Path, "/api/recommendations/books/")
	payload, err := h.jobOrchestrator.GetBookRecommendations(r.Context(), workSlug)
	if err != nil {
		if errors.Is(err, service.ErrRemoteNotFound) {
			http.NotFound(w, r)
			return
		}
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load book recommendations"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": payload})
}

func (h *Handler) authorRecommendations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	authorID := strings.TrimPrefix(r.URL.Path, "/api/recommendations/authors/")
	payload, err := h.jobOrchestrator.GetAuthorRecommendations(r.Context(), authorID)
	if err != nil {
		if errors.Is(err, service.ErrRemoteNotFound) {
			http.NotFound(w, r)
			return
		}
		h.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to load author recommendations"})
		return
	}

	h.writeJSON(w, http.StatusOK, map[string]any{"data": payload})
}
