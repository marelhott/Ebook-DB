package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"ebook-jinak/backend/internal/domain"
)

var ErrRemoteNotFound = errors.New("remote not found")

type JobOrchestrator struct {
	baseURL string
	client  *http.Client
}

func NewJobOrchestrator(baseURL string) *JobOrchestrator {
	return &JobOrchestrator{
		baseURL: strings.TrimRight(baseURL, "/"),
		client: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

type envelope[T any] struct {
	Data T `json:"data"`
}

func (s *JobOrchestrator) QueueDelivery(ctx context.Context, request domain.DeliveryJobRequest) error {
	payload := map[string]any{
		"work_slug":       request.WorkSlug,
		"edition_id":      request.EditionID,
		"device_id":       request.DeviceID,
		"format":          request.Format,
		"device_name":     request.DeviceName,
		"device_email":    request.DeviceEmail,
		"delivery_method": request.DeliveryMethod,
		"device_provider": request.DeviceProvider,
		"attempt":         request.Attempt,
		"retried_from":    request.RetriedFrom,
	}
	return s.postJSON(ctx, "/jobs/delivery", payload)
}

func (s *JobOrchestrator) CreateDeliveryJob(ctx context.Context, request domain.DeliveryJobRequest) (domain.DeliveryJob, error) {
	payload := map[string]any{
		"work_slug":       request.WorkSlug,
		"edition_id":      request.EditionID,
		"device_id":       request.DeviceID,
		"format":          request.Format,
		"device_name":     request.DeviceName,
		"device_email":    request.DeviceEmail,
		"delivery_method": request.DeliveryMethod,
		"device_provider": request.DeviceProvider,
		"attempt":         request.Attempt,
		"retried_from":    request.RetriedFrom,
	}

	type deliveryJobPayload struct {
		ID            string `json:"id"`
		WorkSlug      string `json:"work_slug"`
		EditionID     string `json:"edition_id"`
		DeviceID      string `json:"device_id"`
		DeviceName    string `json:"device_name"`
		DeviceEmail   string `json:"device_email"`
		Format        string `json:"format"`
		Status        string `json:"status"`
		FailureReason string `json:"failure_reason"`
		Attempt       int    `json:"attempt"`
		RetriedFrom   string `json:"retried_from"`
		QueuedAt      string `json:"queued_at"`
		CompletedAt   string `json:"completed_at"`
	}

	response, err := postJSONAndDecode[deliveryJobPayload](ctx, s.client, s.baseURL, "/jobs/delivery", payload)
	if err != nil {
		return domain.DeliveryJob{}, err
	}

	return domain.DeliveryJob{
		ID:            response.ID,
		WorkSlug:      response.WorkSlug,
		EditionID:     response.EditionID,
		DeviceID:      response.DeviceID,
		Format:        response.Format,
		Status:        response.Status,
		FailureReason: response.FailureReason,
		Attempt:       response.Attempt,
		RetriedFrom:   response.RetriedFrom,
		QueuedAt:      response.QueuedAt,
		CompletedAt:   response.CompletedAt,
	}, nil
}

func (s *JobOrchestrator) QueueTranslation(ctx context.Context, request domain.TranslationJobRequest) error {
	payload := map[string]any{
		"work_slug":        request.WorkSlug,
		"target_language":  request.TargetLanguage,
		"mode":             request.Mode,
		"provider":         request.Provider,
		"output_format":    request.OutputFormat,
		"glossary_terms":   request.GlossaryTerms,
		"file_asset_id":    request.FileAssetID,
	}
	return s.postJSON(ctx, "/jobs/translation", payload)
}

func (s *JobOrchestrator) CreateTranslationJob(ctx context.Context, request domain.TranslationJobRequest) (domain.TranslationJob, error) {
	payload := map[string]any{
		"work_slug":       request.WorkSlug,
		"target_language": request.TargetLanguage,
		"mode":            request.Mode,
		"provider":        request.Provider,
		"output_format":   request.OutputFormat,
		"glossary_terms":  request.GlossaryTerms,
		"file_asset_id":   request.FileAssetID,
	}

	type translationJobPayload struct {
		ID             string   `json:"id"`
		WorkSlug       string   `json:"work_slug"`
		FileAssetID    string   `json:"file_asset_id"`
		SourceLanguage string   `json:"source_language"`
		TargetLanguage string   `json:"target_language"`
		Mode           string   `json:"mode"`
		Provider       string   `json:"provider"`
		GlossaryTerms  []string `json:"glossary_terms"`
		Status         string   `json:"status"`
		OutputFormat   string   `json:"output_format"`
		OutputFilePath string   `json:"output_file_path"`
		OutputFileURL  string   `json:"output_file_url"`
		OutputJSONURL  string   `json:"output_json_url"`
		ChapterCount   int      `json:"chapter_count"`
		FailureReason  string   `json:"failure_reason"`
		QueuedAt       string   `json:"queued_at"`
		CompletedAt    string   `json:"completed_at"`
	}

	response, err := postJSONAndDecode[translationJobPayload](ctx, s.client, s.baseURL, "/jobs/translation", payload)
	if err != nil {
		return domain.TranslationJob{}, err
	}

	return domain.TranslationJob{
		ID:             response.ID,
		WorkSlug:       response.WorkSlug,
		FileAssetID:    response.FileAssetID,
		SourceLanguage: response.SourceLanguage,
		TargetLanguage: response.TargetLanguage,
		Mode:           response.Mode,
		Provider:       response.Provider,
		GlossaryTerms:  response.GlossaryTerms,
		Status:         response.Status,
		OutputFormat:   response.OutputFormat,
		OutputFilePath: response.OutputFilePath,
		OutputFileURL:  response.OutputFileURL,
		OutputJSONURL:  response.OutputJSONURL,
		ChapterCount:   response.ChapterCount,
		FailureReason:  response.FailureReason,
		QueuedAt:       response.QueuedAt,
		CompletedAt:    response.CompletedAt,
	}, nil
}

func (s *JobOrchestrator) ListDeliveryJobs(ctx context.Context) ([]domain.DeliveryJob, error) {
	type deliveryJobPayload struct {
		ID            string `json:"id"`
		WorkSlug      string `json:"work_slug"`
		EditionID     string `json:"edition_id"`
		DeviceID      string `json:"device_id"`
		DeviceName    string `json:"device_name"`
		DeviceEmail   string `json:"device_email"`
		Format        string `json:"format"`
		Status        string `json:"status"`
		FailureReason string `json:"failure_reason"`
		Attempt       int    `json:"attempt"`
		RetriedFrom   string `json:"retried_from"`
		QueuedAt      string `json:"queued_at"`
		CompletedAt   string `json:"completed_at"`
	}

	items, err := getJSON[[]deliveryJobPayload](ctx, s.client, s.baseURL, "/jobs/delivery")
	if err != nil {
		return nil, err
	}

	jobs := make([]domain.DeliveryJob, 0, len(items))
	for _, item := range items {
		jobs = append(jobs, domain.DeliveryJob{
			ID:            item.ID,
			WorkSlug:      item.WorkSlug,
			EditionID:     item.EditionID,
			DeviceID:      item.DeviceID,
			Format:        item.Format,
			Status:        item.Status,
			FailureReason: item.FailureReason,
			Attempt:       item.Attempt,
			RetriedFrom:   item.RetriedFrom,
			QueuedAt:      item.QueuedAt,
			CompletedAt:   item.CompletedAt,
		})
	}
	return jobs, nil
}

func (s *JobOrchestrator) GetDeliveryJobByID(ctx context.Context, id string) (domain.DeliveryJob, error) {
	type deliveryJobPayload struct {
		ID            string `json:"id"`
		WorkSlug      string `json:"work_slug"`
		EditionID     string `json:"edition_id"`
		DeviceID      string `json:"device_id"`
		DeviceName    string `json:"device_name"`
		DeviceEmail   string `json:"device_email"`
		Format        string `json:"format"`
		Status        string `json:"status"`
		FailureReason string `json:"failure_reason"`
		Attempt       int    `json:"attempt"`
		RetriedFrom   string `json:"retried_from"`
		QueuedAt      string `json:"queued_at"`
		CompletedAt   string `json:"completed_at"`
	}

	item, err := getJSON[deliveryJobPayload](ctx, s.client, s.baseURL, "/jobs/delivery/"+id)
	if err != nil {
		return domain.DeliveryJob{}, err
	}

	return domain.DeliveryJob{
		ID:            item.ID,
		WorkSlug:      item.WorkSlug,
		EditionID:     item.EditionID,
		DeviceID:      item.DeviceID,
		Format:        item.Format,
		Status:        item.Status,
		FailureReason: item.FailureReason,
		Attempt:       item.Attempt,
		RetriedFrom:   item.RetriedFrom,
		QueuedAt:      item.QueuedAt,
		CompletedAt:   item.CompletedAt,
	}, nil
}

func (s *JobOrchestrator) ListTranslationJobs(ctx context.Context) ([]domain.TranslationJob, error) {
	type translationJobPayload struct {
		ID             string   `json:"id"`
		WorkSlug       string   `json:"work_slug"`
		FileAssetID    string   `json:"file_asset_id"`
		SourceLanguage string   `json:"source_language"`
		TargetLanguage string   `json:"target_language"`
		Mode           string   `json:"mode"`
		Provider       string   `json:"provider"`
		GlossaryTerms  []string `json:"glossary_terms"`
		Status         string   `json:"status"`
		OutputFormat   string   `json:"output_format"`
		OutputFilePath string   `json:"output_file_path"`
		OutputFileURL  string   `json:"output_file_url"`
		OutputJSONURL  string   `json:"output_json_url"`
		ChapterCount   int      `json:"chapter_count"`
		FailureReason  string   `json:"failure_reason"`
		QueuedAt       string   `json:"queued_at"`
		CompletedAt    string   `json:"completed_at"`
	}

	items, err := getJSON[[]translationJobPayload](ctx, s.client, s.baseURL, "/jobs/translation")
	if err != nil {
		return nil, err
	}

	jobs := make([]domain.TranslationJob, 0, len(items))
	for _, item := range items {
		jobs = append(jobs, domain.TranslationJob{
			ID:             item.ID,
			WorkSlug:       item.WorkSlug,
			FileAssetID:    item.FileAssetID,
			SourceLanguage: item.SourceLanguage,
			TargetLanguage: item.TargetLanguage,
			Mode:           item.Mode,
			Provider:       item.Provider,
			GlossaryTerms:  item.GlossaryTerms,
			Status:         item.Status,
			OutputFormat:   item.OutputFormat,
			OutputFilePath: item.OutputFilePath,
			OutputFileURL:  item.OutputFileURL,
			OutputJSONURL:  item.OutputJSONURL,
			ChapterCount:   item.ChapterCount,
			FailureReason:  item.FailureReason,
			QueuedAt:       item.QueuedAt,
			CompletedAt:    item.CompletedAt,
		})
	}
	return jobs, nil
}

func (s *JobOrchestrator) GetTranslationJobByID(ctx context.Context, id string) (domain.TranslationJob, error) {
	type translationJobPayload struct {
		ID             string   `json:"id"`
		WorkSlug       string   `json:"work_slug"`
		FileAssetID    string   `json:"file_asset_id"`
		SourceLanguage string   `json:"source_language"`
		TargetLanguage string   `json:"target_language"`
		Mode           string   `json:"mode"`
		Provider       string   `json:"provider"`
		GlossaryTerms  []string `json:"glossary_terms"`
		Status         string   `json:"status"`
		OutputFormat   string   `json:"output_format"`
		OutputFilePath string   `json:"output_file_path"`
		OutputFileURL  string   `json:"output_file_url"`
		OutputJSONURL  string   `json:"output_json_url"`
		ChapterCount   int      `json:"chapter_count"`
		FailureReason  string   `json:"failure_reason"`
		QueuedAt       string   `json:"queued_at"`
		CompletedAt    string   `json:"completed_at"`
	}

	item, err := getJSON[translationJobPayload](ctx, s.client, s.baseURL, "/jobs/translation/"+id)
	if err != nil {
		return domain.TranslationJob{}, err
	}

	return domain.TranslationJob{
		ID:             item.ID,
		WorkSlug:       item.WorkSlug,
		FileAssetID:    item.FileAssetID,
		SourceLanguage: item.SourceLanguage,
		TargetLanguage: item.TargetLanguage,
		Mode:           item.Mode,
		Provider:       item.Provider,
		GlossaryTerms:  item.GlossaryTerms,
		Status:         item.Status,
		OutputFormat:   item.OutputFormat,
		OutputFilePath: item.OutputFilePath,
		OutputFileURL:  item.OutputFileURL,
		OutputJSONURL:  item.OutputJSONURL,
		ChapterCount:   item.ChapterCount,
		FailureReason:  item.FailureReason,
		QueuedAt:       item.QueuedAt,
		CompletedAt:    item.CompletedAt,
	}, nil
}

func (s *JobOrchestrator) GetSMTPConnectorStatus(ctx context.Context) (domain.SMTPConnectorStatus, error) {
	type smtpConnectorStatusPayload struct {
		Configured             bool     `json:"configured"`
		Host                   string   `json:"host"`
		Port                   int      `json:"port"`
		Sender                 string   `json:"sender"`
		UsesTLS                bool     `json:"uses_tls"`
		RequiresApprovedSender bool     `json:"requires_approved_sender"`
		MissingFields          []string `json:"missing_fields"`
		Provider               string   `json:"provider"`
	}

	item, err := getJSON[smtpConnectorStatusPayload](ctx, s.client, s.baseURL, "/connectors/smtp/status")
	if err != nil {
		return domain.SMTPConnectorStatus{}, err
	}

	return domain.SMTPConnectorStatus{
		Configured:             item.Configured,
		Host:                   item.Host,
		Port:                   item.Port,
		Sender:                 item.Sender,
		UsesTLS:                item.UsesTLS,
		RequiresApprovedSender: item.RequiresApprovedSender,
		MissingFields:          item.MissingFields,
		Provider:               item.Provider,
	}, nil
}

func (s *JobOrchestrator) GetBookIntelligence(ctx context.Context, workSlug string) (domain.BookIntelligence, error) {
	return getJSON[domain.BookIntelligence](ctx, s.client, s.baseURL, "/intelligence/books/"+workSlug)
}

func (s *JobOrchestrator) GetAuthorIntelligence(ctx context.Context, authorID string) (domain.AuthorIntelligence, error) {
	return getJSON[domain.AuthorIntelligence](ctx, s.client, s.baseURL, "/intelligence/authors/"+authorID)
}

func (s *JobOrchestrator) GetBookRecommendations(ctx context.Context, workSlug string) (domain.RecommendationRail, error) {
	return getJSON[domain.RecommendationRail](ctx, s.client, s.baseURL, "/recommendations/books/"+workSlug)
}

func (s *JobOrchestrator) GetAuthorRecommendations(ctx context.Context, authorID string) (domain.RecommendationRail, error) {
	return getJSON[domain.RecommendationRail](ctx, s.client, s.baseURL, "/recommendations/authors/"+authorID)
}

func (s *JobOrchestrator) GetTranslationDocumentByID(ctx context.Context, id string) (domain.TranslationDocument, error) {
	return getJSON[domain.TranslationDocument](ctx, s.client, s.baseURL, "/jobs/translation/"+id+"/document")
}

func (s *JobOrchestrator) postJSON(ctx context.Context, path string, payload map[string]any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("worker returned status %d", resp.StatusCode)
	}

	return nil
}

func postJSONAndDecode[T any](ctx context.Context, client *http.Client, baseURL, path string, payload map[string]any) (T, error) {
	var zero T

	body, err := json.Marshal(payload)
	if err != nil {
		return zero, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+path, bytes.NewReader(body))
	if err != nil {
		return zero, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return zero, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return zero, ErrRemoteNotFound
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return zero, fmt.Errorf("worker returned status %d", resp.StatusCode)
	}

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return zero, err
	}

	var wrapped envelope[T]
	if err := json.Unmarshal(raw, &wrapped); err != nil {
		return zero, err
	}

	return wrapped.Data, nil
}

func getJSON[T any](ctx context.Context, client *http.Client, baseURL, path string) (T, error) {
	var zero T

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+path, nil)
	if err != nil {
		return zero, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return zero, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return zero, ErrRemoteNotFound
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return zero, fmt.Errorf("worker returned status %d", resp.StatusCode)
	}

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return zero, err
	}

	var wrapped envelope[T]
	if err := json.Unmarshal(raw, &wrapped); err != nil {
		return zero, err
	}

	return wrapped.Data, nil
}
