package config

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	Host            string
	Port            string
	Addr            string
	AppName         string
	Environment     string
	DBDriver        string
	DBDSN           string
	StorageRoot     string
	WorkerBaseURL   string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
}

func Load() (Config, error) {
	host := getenv("APP_HOST", "")
	port := getenv("APP_PORT", "8080")

	cfg := Config{
		Host:            host,
		Port:            port,
		Addr:            getenv("ADDR", buildAddr(host, port)),
		AppName:         getenv("APP_NAME", "Book Universe API"),
		Environment:     getenv("APP_ENV", getenv("ENVIRONMENT", "development")),
		DBDriver:        getenv("DB_DRIVER", "sqlite"),
		DBDSN:           getenv("DB_DSN", "file:/data/book-universe.db"),
		StorageRoot:     getenv("STORAGE_ROOT", "/data/storage"),
		WorkerBaseURL:   getenv("AI_WORKER_URL", "http://localhost:8000"),
		ReadTimeout:     5 * time.Second,
		WriteTimeout:    10 * time.Second,
		IdleTimeout:     60 * time.Second,
		ShutdownTimeout: 10 * time.Second,
	}

	var err error
	if cfg.ReadTimeout, err = parseDurationEnv("READ_TIMEOUT", cfg.ReadTimeout); err != nil {
		return Config{}, err
	}
	if cfg.WriteTimeout, err = parseDurationEnv("WRITE_TIMEOUT", cfg.WriteTimeout); err != nil {
		return Config{}, err
	}
	if cfg.IdleTimeout, err = parseDurationEnv("IDLE_TIMEOUT", cfg.IdleTimeout); err != nil {
		return Config{}, err
	}
	if cfg.ShutdownTimeout, err = parseDurationEnv("SHUTDOWN_TIMEOUT", cfg.ShutdownTimeout); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func parseDurationEnv(key string, fallback time.Duration) (time.Duration, error) {
	value := os.Getenv(key)
	if value == "" {
		return fallback, nil
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("invalid duration for %s: %w", key, err)
	}

	return duration, nil
}

func buildAddr(host, port string) string {
	if host == "" || host == "0.0.0.0" {
		return ":" + port
	}

	return fmt.Sprintf("%s:%s", host, port)
}
