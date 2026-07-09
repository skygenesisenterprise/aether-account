package config

import "testing"

func TestValidateLiveKitRequiresCompleteConfig(t *testing.T) {
	t.Parallel()

	cfg := Config{
		Server: ServerConfig{Port: "8080"},
		Auth:   AuthConfig{Mode: "jwt", JWTSecret: "secret"},
		Worker: WorkerConfig{
			Concurrency:       1,
			MaxAttempts:       1,
			BlockTimeout:      1,
			ClaimIdleTimeout:  1,
			ShutdownTimeout:   1,
			HeartbeatInterval: 1,
			HeartbeatTTL:      1,
		},
		Outbox:    OutboxConfig{BatchSize: 1, MaxAttempts: 1, PollInterval: 1},
		Retention: RetentionConfig{},
		WebRTC: WebRTCConfig{
			Provider:            "livekit",
			PublicURL:           "wss://meet.example.com",
			NodeID:              "node-1",
			Region:              "eu-west",
			TokenTTL:            1,
			RoomEmptyTimeout:    1,
			ParticipantTTL:      1,
			NodeCapacity:        1,
			HealthcheckInterval: 1,
		},
	}

	if err := cfg.Validate(); err == nil {
		t.Fatal("expected validation error")
	}
}

func TestValidateLiveKitRejectsInternalPublicURL(t *testing.T) {
	t.Parallel()

	cfg := Config{
		Server: ServerConfig{Port: "8080"},
		Auth:   AuthConfig{Mode: "jwt", JWTSecret: "secret"},
		Worker: WorkerConfig{
			Concurrency:       1,
			MaxAttempts:       1,
			BlockTimeout:      1,
			ClaimIdleTimeout:  1,
			ShutdownTimeout:   1,
			HeartbeatInterval: 1,
			HeartbeatTTL:      1,
		},
		Outbox:    OutboxConfig{BatchSize: 1, MaxAttempts: 1, PollInterval: 1},
		Retention: RetentionConfig{},
		LiveKit: LiveKitConfig{
			PublicURL:   "http://livekit:7880",
			InternalURL: "http://livekit:7880",
			APIKey:      "key",
			APISecret:   "secret",
		},
		WebRTC: WebRTCConfig{
			Provider:            "livekit",
			PublicURL:           "http://livekit:7880",
			NodeID:              "node-1",
			Region:              "eu-west",
			TokenTTL:            1,
			RoomEmptyTimeout:    1,
			ParticipantTTL:      1,
			NodeCapacity:        1,
			HealthcheckInterval: 1,
		},
	}

	if err := cfg.Validate(); err == nil {
		t.Fatal("expected validation error for non-public URL")
	}
}
