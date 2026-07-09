package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const devJWTSecret = "dev-insecure-secret-change-me"

type Config struct {
	App       AppConfig
	Server    ServerConfig
	Database  DatabaseConfig
	Redis     RedisConfig
	Auth      AuthConfig
	CORS      CORSConfig
	Realtime  RealtimeConfig
	Storage   StorageConfig
	LiveKit   LiveKitConfig
	WebRTC    WebRTCConfig
	Worker    WorkerConfig
	Outbox    OutboxConfig
	Retention RetentionConfig
}

type AppConfig struct {
	Env            string
	Name           string
	Version        string
	Mode           string
	AccessLogs     bool
	TrustedProxies []string
}

type ServerConfig struct {
	Host string
	Port string
}

type DatabaseConfig struct {
	URL      string
	Host     string
	Port     string
	User     string
	Name     string
	Password string
}

type RedisConfig struct {
	Enabled        bool
	Required       bool
	URL            string
	Host           string
	Port           string
	Password       string
	DB             int
	KeyPrefix      string
	DefaultTTL     time.Duration
	ConnectTimeout time.Duration
	ReadTimeout    time.Duration
	WriteTimeout   time.Duration
	MaxRetries     int
}

type AuthConfig struct {
	Enabled                bool
	LocalEnabled           bool
	Mode                   string
	JWTSecret              string
	JWTIssuer              string
	JWTAccessTTL           time.Duration
	JWTRefreshTTL          time.Duration
	RefreshCookieName      string
	CookieSecure           bool
	CookieSameSite         string
	CookieDomain           string
	PasswordMinLength      int
	Argon2Memory           uint32
	Argon2Iterations       uint32
	Argon2Parallelism      uint8
	SessionCleanupInterval time.Duration
	EmailVerificationTTL   time.Duration
	PasswordResetTTL       time.Duration
	RateLimitEnabled       bool
}

type CORSConfig struct {
	AllowedOrigins []string
}

type RealtimeConfig struct {
	Enabled           bool
	HeartbeatInterval time.Duration
	ClientTimeout     time.Duration
}

type StorageConfig struct {
	Driver    string
	LocalPath string
}

type LiveKitConfig struct {
	Enabled     bool
	URL         string
	PublicURL   string
	InternalURL string
	APIKey      string
	APISecret   string
}

type TURNConfig struct {
	Enabled  bool
	URL      string
	Username string
	Password string
}

type WebRTCConfig struct {
	Provider            string
	PublicURL           string
	Region              string
	NodeID              string
	TokenTTL            time.Duration
	RoomEmptyTimeout    time.Duration
	ParticipantTTL      time.Duration
	NodeCapacity        int
	HealthcheckInterval time.Duration
	Draining            bool
	TURN                TURNConfig
}

type WorkerConfig struct {
	Enabled           bool
	ID                string
	Concurrency       int
	MaxAttempts       int
	RetryBaseDelay    time.Duration
	BlockTimeout      time.Duration
	ClaimIdleTimeout  time.Duration
	ShutdownTimeout   time.Duration
	SchedulerEnabled  bool
	HeartbeatInterval time.Duration
	HeartbeatTTL      time.Duration
}

type OutboxConfig struct {
	Enabled      bool
	BatchSize    int
	PollInterval time.Duration
	MaxAttempts  int
}

type RetentionConfig struct {
	NotificationDays int
	AuditDays        int
	SessionDays      int
	UploadHours      int
}

func Load() (Config, error) {
	cfg := Config{
		App: AppConfig{
			Env:            getEnv("APP_ENV", "development"),
			Name:           getEnv("APP_NAME", "Aether Meet"),
			Version:        getEnv("APP_VERSION", "dev"),
			Mode:           getEnv("GIN_MODE", "debug"),
			AccessLogs:     getEnvBool("API_ACCESS_LOGS", true),
			TrustedProxies: getEnvSlice("TRUSTED_PROXY_CIDRS", nil),
		},
		Server: ServerConfig{
			Host: getEnv("HOST", "0.0.0.0"),
			Port: getEnv("API_PORT", "8080"),
		},
		Database: DatabaseConfig{
			URL:      strings.TrimSpace(getEnv("DATABASE_URL", "")),
			Host:     getEnv("POSTGRESQL__HOST", "localhost"),
			Port:     getEnv("POSTGRESQL__PORT", "5432"),
			User:     getEnv("POSTGRESQL__USER", "postgres"),
			Name:     getEnv("POSTGRESQL__NAME", "aether_meet"),
			Password: getEnv("POSTGRESQL__PASSWORD", "postgres"),
		},
		Redis: RedisConfig{
			Enabled:        getEnvBool("REDIS_ENABLED", false),
			Required:       getEnvBool("REDIS_REQUIRED", false),
			URL:            getEnv("REDIS_URL", ""),
			Host:           getEnv("REDIS_HOST", "localhost"),
			Port:           getEnv("REDIS_PORT", "6379"),
			Password:       getEnv("REDIS_PASSWORD", ""),
			DB:             getEnvInt("REDIS_DB", 0),
			KeyPrefix:      getEnv("REDIS_KEY_PREFIX", "aether-meet:v1"),
			DefaultTTL:     getEnvDuration("REDIS_DEFAULT_TTL", 5*time.Minute),
			ConnectTimeout: getEnvDuration("REDIS_CONNECT_TIMEOUT", 5*time.Second),
			ReadTimeout:    getEnvDuration("REDIS_READ_TIMEOUT", 3*time.Second),
			WriteTimeout:   getEnvDuration("REDIS_WRITE_TIMEOUT", 3*time.Second),
			MaxRetries:     getEnvInt("REDIS_MAX_RETRIES", 3),
		},
		Auth: AuthConfig{
			Enabled:                getEnvBool("AUTH_ENABLED", true),
			LocalEnabled:           getEnvBool("AUTH_LOCAL_ENABLED", true),
			Mode:                   strings.ToLower(getEnv("AUTH_MODE", "jwt")),
			JWTSecret:              getEnv("AUTH_JWT_SECRET", getEnv("JWT_SECRET", "")),
			JWTIssuer:              getEnv("AUTH_JWT_ISSUER", getEnv("JWT_ISSUER", "aether-meet")),
			JWTAccessTTL:           getEnvDuration("AUTH_ACCESS_TOKEN_TTL", getEnvDuration("JWT_ACCESS_TTL", 15*time.Minute)),
			JWTRefreshTTL:          getEnvDuration("AUTH_REFRESH_TOKEN_TTL", getEnvDuration("JWT_REFRESH_TTL", 30*24*time.Hour)),
			RefreshCookieName:      getEnv("AUTH_REFRESH_COOKIE_NAME", "aether_meet_refresh"),
			CookieSecure:           getEnvBool("AUTH_COOKIE_SECURE", strings.EqualFold(getEnv("APP_ENV", "development"), "production")),
			CookieSameSite:         strings.ToLower(getEnv("AUTH_COOKIE_SAME_SITE", "lax")),
			CookieDomain:           strings.TrimSpace(getEnv("AUTH_COOKIE_DOMAIN", "")),
			PasswordMinLength:      getEnvInt("AUTH_PASSWORD_MIN_LENGTH", 12),
			Argon2Memory:           uint32(getEnvInt("AUTH_ARGON2_MEMORY", 64*1024)),
			Argon2Iterations:       uint32(getEnvInt("AUTH_ARGON2_ITERATIONS", 3)),
			Argon2Parallelism:      uint8(getEnvInt("AUTH_ARGON2_PARALLELISM", 2)),
			SessionCleanupInterval: getEnvDuration("AUTH_SESSION_CLEANUP_INTERVAL", time.Hour),
			EmailVerificationTTL:   getEnvDuration("AUTH_EMAIL_VERIFICATION_TTL", 24*time.Hour),
			PasswordResetTTL:       getEnvDuration("AUTH_PASSWORD_RESET_TTL", time.Hour),
			RateLimitEnabled:       getEnvBool("AUTH_RATE_LIMIT_ENABLED", true),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnvSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
		},
		Realtime: RealtimeConfig{
			Enabled:           getEnvBool("REALTIME_ENABLED", true),
			HeartbeatInterval: getEnvDuration("REALTIME_HEARTBEAT_INTERVAL", 30*time.Second),
			ClientTimeout:     getEnvDuration("REALTIME_CLIENT_TIMEOUT", 75*time.Second),
		},
		Storage: StorageConfig{
			Driver:    strings.ToLower(getEnv("STORAGE_DRIVER", "local")),
			LocalPath: getEnv("STORAGE_LOCAL_PATH", "/media"),
		},
		LiveKit: LiveKitConfig{
			Enabled:     getEnvBool("LIVEKIT_ENABLED", false),
			URL:         getEnv("LIVEKIT_URL", ""),
			PublicURL:   getEnv("LIVEKIT_PUBLIC_URL", getEnv("LIVEKIT_URL", "")),
			InternalURL: getEnv("LIVEKIT_INTERNAL_URL", ""),
			APIKey:      getEnv("LIVEKIT_API_KEY", ""),
			APISecret:   getEnv("LIVEKIT_API_SECRET", ""),
		},
		WebRTC: WebRTCConfig{
			Provider:            strings.ToLower(getEnv("WEBRTC_PROVIDER", "")),
			PublicURL:           getEnv("WEBRTC_PUBLIC_URL", getEnv("LIVEKIT_PUBLIC_URL", getEnv("LIVEKIT_URL", ""))),
			Region:              getEnv("WEBRTC_REGION", "global"),
			NodeID:              getEnv("WEBRTC_NODE_ID", ""),
			TokenTTL:            getEnvDuration("WEBRTC_TOKEN_TTL", 10*time.Minute),
			RoomEmptyTimeout:    getEnvDuration("WEBRTC_ROOM_EMPTY_TIMEOUT", 5*time.Minute),
			ParticipantTTL:      getEnvDuration("WEBRTC_PARTICIPANT_TTL", 2*time.Minute),
			NodeCapacity:        getEnvInt("WEBRTC_NODE_CAPACITY", 500),
			HealthcheckInterval: getEnvDuration("WEBRTC_HEALTHCHECK_INTERVAL", 30*time.Second),
			Draining:            getEnvBool("WEBRTC_DRAINING", false),
			TURN: TURNConfig{
				Enabled:  getEnvBool("TURN_ENABLED", false),
				URL:      getEnv("TURN_URL", ""),
				Username: getEnv("TURN_USERNAME", ""),
				Password: getEnv("TURN_PASSWORD", ""),
			},
		},
		Worker: WorkerConfig{
			Enabled:           getEnvBool("WORKER_ENABLED", false),
			ID:                getEnv("WORKER_ID", ""),
			Concurrency:       getEnvInt("WORKER_CONCURRENCY", 2),
			MaxAttempts:       getEnvInt("WORKER_MAX_ATTEMPTS", 5),
			RetryBaseDelay:    getEnvDuration("WORKER_RETRY_BASE_DELAY", 5*time.Second),
			BlockTimeout:      getEnvDuration("WORKER_BLOCK_TIMEOUT", 5*time.Second),
			ClaimIdleTimeout:  getEnvDuration("WORKER_CLAIM_IDLE_TIMEOUT", 30*time.Second),
			ShutdownTimeout:   getEnvDuration("WORKER_SHUTDOWN_TIMEOUT", 15*time.Second),
			SchedulerEnabled:  getEnvBool("WORKER_SCHEDULER_ENABLED", true),
			HeartbeatInterval: getEnvDuration("WORKER_HEARTBEAT_INTERVAL", 15*time.Second),
			HeartbeatTTL:      getEnvDuration("WORKER_HEARTBEAT_TTL", 45*time.Second),
		},
		Outbox: OutboxConfig{
			Enabled:      getEnvBool("OUTBOX_ENABLED", true),
			BatchSize:    getEnvInt("OUTBOX_BATCH_SIZE", 50),
			PollInterval: getEnvDuration("OUTBOX_POLL_INTERVAL", 5*time.Second),
			MaxAttempts:  getEnvInt("OUTBOX_MAX_ATTEMPTS", 10),
		},
		Retention: RetentionConfig{
			NotificationDays: getEnvInt("NOTIFICATION_RETENTION_DAYS", 30),
			AuditDays:        getEnvInt("AUDIT_RETENTION_DAYS", 90),
			SessionDays:      getEnvInt("SESSION_RETENTION_DAYS", 30),
			UploadHours:      getEnvInt("UPLOAD_RETENTION_HOURS", 24),
		},
	}

	if cfg.Worker.ID == "" {
		cfg.Worker.ID = "worker-" + strings.ReplaceAll(strconv.FormatInt(time.Now().UTC().UnixNano(), 36), "-", "")
	}
	if cfg.WebRTC.Provider == "" && cfg.LiveKit.Enabled {
		cfg.WebRTC.Provider = "livekit"
	}
	if cfg.WebRTC.NodeID == "" {
		cfg.WebRTC.NodeID = "aether-meet-" + cfg.WebRTC.Region + "-1"
	}
	if cfg.LiveKit.InternalURL == "" {
		cfg.LiveKit.InternalURL = cfg.LiveKit.URL
	}
	if cfg.LiveKit.PublicURL == "" {
		cfg.LiveKit.PublicURL = cfg.LiveKit.URL
	}
	if cfg.WebRTC.PublicURL == "" {
		cfg.WebRTC.PublicURL = cfg.LiveKit.PublicURL
	}

	if cfg.Auth.JWTSecret == "" && cfg.App.Env != "production" {
		cfg.Auth.JWTSecret = devJWTSecret
	}

	if cfg.Database.URL == "" {
		cfg.Database.URL = fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
			cfg.Database.Host,
			cfg.Database.User,
			cfg.Database.Password,
			cfg.Database.Name,
			cfg.Database.Port,
		)
	}

	return cfg, cfg.Validate()
}

func (c Config) Validate() error {
	if c.Server.Port == "" {
		return errors.New("API_PORT is required")
	}
	if c.App.Env == "production" {
		if c.Auth.Enabled && c.Auth.Mode == "jwt" && (c.Auth.JWTSecret == "" || c.Auth.JWTSecret == devJWTSecret || len(c.Auth.JWTSecret) < 32) {
			return errors.New("AUTH_JWT_SECRET or JWT_SECRET must be configured with a strong value for production")
		}
		if len(c.CORS.AllowedOrigins) == 0 {
			return errors.New("CORS_ALLOWED_ORIGINS must be configured for production")
		}
	}
	if c.Auth.Enabled && c.Auth.LocalEnabled {
		if c.Auth.JWTIssuer == "" {
			return errors.New("AUTH_JWT_ISSUER or JWT_ISSUER is required when local auth is enabled")
		}
		if c.Auth.JWTAccessTTL <= 0 || c.Auth.JWTRefreshTTL <= 0 || c.Auth.EmailVerificationTTL <= 0 || c.Auth.PasswordResetTTL <= 0 || c.Auth.SessionCleanupInterval <= 0 {
			return errors.New("auth durations must be greater than zero")
		}
		if c.Auth.PasswordMinLength < 8 {
			return errors.New("AUTH_PASSWORD_MIN_LENGTH must be at least 8")
		}
		if c.Auth.Argon2Memory == 0 || c.Auth.Argon2Iterations == 0 || c.Auth.Argon2Parallelism == 0 {
			return errors.New("argon2 parameters must be greater than zero")
		}
		switch c.Auth.CookieSameSite {
		case "lax", "strict", "none":
		default:
			return errors.New("AUTH_COOKIE_SAME_SITE must be one of lax, strict, none")
		}
		if c.Database.URL == "" {
			return errors.New("database must be configured when local auth is enabled")
		}
	}
	if c.LiveKit.Enabled || c.WebRTC.Provider == "livekit" {
		if c.LiveKit.PublicURL == "" || c.LiveKit.InternalURL == "" || c.LiveKit.APIKey == "" || c.LiveKit.APISecret == "" {
			return errors.New("LIVEKIT_PUBLIC_URL, LIVEKIT_INTERNAL_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET are required when LiveKit is enabled")
		}
		if err := validateURL(c.LiveKit.PublicURL, "LIVEKIT_PUBLIC_URL"); err != nil {
			return err
		}
		if err := validateURL(c.LiveKit.InternalURL, "LIVEKIT_INTERNAL_URL"); err != nil {
			return err
		}
		if err := validatePublicWebRTCURL(c.LiveKit.PublicURL, "LIVEKIT_PUBLIC_URL"); err != nil {
			return err
		}
		if c.WebRTC.PublicURL == "" {
			return errors.New("WEBRTC_PUBLIC_URL is required when LiveKit is enabled")
		}
		if err := validateURL(c.WebRTC.PublicURL, "WEBRTC_PUBLIC_URL"); err != nil {
			return err
		}
		if err := validatePublicWebRTCURL(c.WebRTC.PublicURL, "WEBRTC_PUBLIC_URL"); err != nil {
			return err
		}
		if c.WebRTC.TokenTTL <= 0 || c.WebRTC.RoomEmptyTimeout <= 0 || c.WebRTC.ParticipantTTL <= 0 || c.WebRTC.HealthcheckInterval <= 0 {
			return errors.New("webrtc durations must be greater than zero")
		}
		if c.WebRTC.NodeCapacity <= 0 {
			return errors.New("WEBRTC_NODE_CAPACITY must be greater than zero")
		}
		if c.WebRTC.NodeID == "" || c.WebRTC.Region == "" {
			return errors.New("WEBRTC_NODE_ID and WEBRTC_REGION are required when LiveKit is enabled")
		}
		if c.WebRTC.TURN.Enabled {
			if c.WebRTC.TURN.URL == "" {
				return errors.New("TURN_URL is required when TURN_ENABLED=true")
			}
			if err := validateURLOrScheme(c.WebRTC.TURN.URL, "TURN_URL"); err != nil {
				return err
			}
		}
	}
	if c.Worker.Concurrency <= 0 {
		return errors.New("WORKER_CONCURRENCY must be greater than zero")
	}
	if c.Worker.MaxAttempts <= 0 {
		return errors.New("WORKER_MAX_ATTEMPTS must be greater than zero")
	}
	if c.Worker.BlockTimeout <= 0 || c.Worker.ClaimIdleTimeout <= 0 || c.Worker.ShutdownTimeout <= 0 || c.Worker.HeartbeatInterval <= 0 || c.Worker.HeartbeatTTL <= 0 {
		return errors.New("worker durations must be greater than zero")
	}
	if c.Outbox.BatchSize <= 0 || c.Outbox.MaxAttempts <= 0 {
		return errors.New("outbox batch and max attempts must be greater than zero")
	}
	if c.Outbox.PollInterval <= 0 {
		return errors.New("OUTBOX_POLL_INTERVAL must be greater than zero")
	}
	if c.Retention.NotificationDays < 0 || c.Retention.AuditDays < 0 || c.Retention.SessionDays < 0 || c.Retention.UploadHours < 0 {
		return errors.New("retention values cannot be negative")
	}
	return nil
}

func validateURL(value, key string) error {
	parsed, err := url.Parse(value)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return fmt.Errorf("%s must be a valid URL", key)
	}
	return nil
}

func validateURLOrScheme(value, key string) error {
	if strings.HasPrefix(value, "turn:") || strings.HasPrefix(value, "stun:") {
		return nil
	}
	return validateURL(value, key)
}

func validatePublicWebRTCURL(value, key string) error {
	parsed, err := url.Parse(value)
	if err != nil {
		return fmt.Errorf("%s must be a valid URL", key)
	}

	host := strings.ToLower(parsed.Hostname())
	switch host {
	case "", "localhost", "127.0.0.1", "::1", "livekit", "webrtc":
		return fmt.Errorf("%s must use a public hostname or IP", key)
	}

	if strings.HasSuffix(host, ".internal") || strings.HasSuffix(host, ".local") {
		return fmt.Errorf("%s must use a public hostname or IP", key)
	}
	return nil
}

func getEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnvBool(key string, fallback bool) bool {
	value := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if value == "" {
		return fallback
	}
	return value == "true" || value == "1" || value == "yes"
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	if seconds, err := strconv.Atoi(value); err == nil {
		return time.Duration(seconds) * time.Second
	}
	if duration, err := time.ParseDuration(value); err == nil {
		return duration
	}
	return fallback
}

func getEnvSlice(key string, fallback []string) []string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}
