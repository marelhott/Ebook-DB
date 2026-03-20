package service

import (
	"context"
	"time"

	"ebook-jinak/backend/internal/repository"
)

type HealthService struct {
	appName     string
	environment string
	repo        repository.Pinger
}

type HealthStatus struct {
	Status      string    `json:"status"`
	AppName     string    `json:"app_name"`
	Environment string    `json:"environment"`
	Timestamp   time.Time `json:"timestamp"`
}

func NewHealthService(appName, environment string, repo repository.Pinger) *HealthService {
	return &HealthService{
		appName:     appName,
		environment: environment,
		repo:        repo,
	}
}

func (s *HealthService) Check(ctx context.Context) (HealthStatus, error) {
	if err := s.repo.Ping(ctx); err != nil {
		return HealthStatus{
			Status:      "degraded",
			AppName:     s.appName,
			Environment: s.environment,
			Timestamp:   time.Now().UTC(),
		}, err
	}

	return HealthStatus{
		Status:      "ok",
		AppName:     s.appName,
		Environment: s.environment,
		Timestamp:   time.Now().UTC(),
	}, nil
}
