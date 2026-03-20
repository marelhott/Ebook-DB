package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"ebook-jinak/backend/internal/config"
	"ebook-jinak/backend/internal/handler"
	"ebook-jinak/backend/internal/repository"
	"ebook-jinak/backend/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	repo := repository.NewMemoryRepository()
	healthService := service.NewHealthService(cfg.AppName, cfg.Environment, repo)
	jobOrchestrator := service.NewJobOrchestrator(cfg.WorkerBaseURL)
	httpHandler := handler.New(healthService, repo, jobOrchestrator).Routes()

	server := &http.Server{
		Addr:         cfg.Addr,
		Handler:      httpHandler,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		slog.Info("starting server", "addr", cfg.Addr, "app", cfg.AppName, "environment", cfg.Environment)
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
		defer cancel()

		slog.Info("shutting down server")
		if shutdownErr := server.Shutdown(shutdownCtx); shutdownErr != nil {
			slog.Error("graceful shutdown failed", "error", shutdownErr)
			os.Exit(1)
		}
	case err = <-errCh:
		if !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server exited unexpectedly", "error", err)
			os.Exit(1)
		}
	}

	slog.Info("server stopped cleanly")
}
