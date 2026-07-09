package services

import (
	"bytes"
	"context"
	"net/http"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	lkauth "github.com/livekit/protocol/auth"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

func TestLiveKitProviderCreateJoinToken(t *testing.T) {
	t.Parallel()

	provider := &LiveKitProvider{
		cfg: config.Config{
			LiveKit: config.LiveKitConfig{
				Enabled:     true,
				URL:         "wss://meet.example.com",
				InternalURL: "http://livekit:7880",
				APIKey:      "test-key",
				APISecret:   "test-secret",
			},
			WebRTC: config.WebRTCConfig{
				PublicURL: "wss://meet.example.com",
				TokenTTL:  10 * time.Minute,
			},
		},
	}

	token, err := provider.CreateJoinToken(context.Background(), interfaces.JoinTokenInput{
		MeetingID:           "meeting-1",
		WorkspaceID:         "workspace-1",
		SessionID:           "session-1",
		RoomName:            "room-1",
		ParticipantIdentity: "user-1",
		ParticipantName:     "User 1",
		TTL:                 10 * time.Minute,
		Permissions: interfaces.JoinTokenPermissions{
			Role:             "host",
			CanJoin:          true,
			CanPublishAudio:  true,
			CanPublishVideo:  true,
			CanPublishScreen: true,
			CanSubscribe:     true,
			CanModerate:      true,
			PublishSources:   []string{"camera", "microphone", "screen_share"},
		},
		Attributes: map[string]string{
			"meeting_id": "meeting-1",
		},
	})
	if err != nil {
		t.Fatalf("CreateJoinToken returned error: %v", err)
	}

	claims := jwt.MapClaims{}
	parsed, err := jwt.ParseWithClaims(token.Token, claims, func(token *jwt.Token) (any, error) {
		return []byte("test-secret"), nil
	})
	if err != nil || !parsed.Valid {
		t.Fatalf("token is invalid: %v", err)
	}

	if got := claims["sub"]; got != "user-1" {
		t.Fatalf("expected subject user-1, got %v", got)
	}
	video, ok := claims["video"].(map[string]any)
	if !ok {
		t.Fatalf("expected video grant in claims")
	}
	if got := video["room"]; got != "room-1" {
		t.Fatalf("expected room room-1, got %v", got)
	}
	if got := video["roomAdmin"]; got != true {
		t.Fatalf("expected roomAdmin true, got %v", got)
	}
	if token.SignalingURL != "wss://meet.example.com" {
		t.Fatalf("expected public signaling URL, got %q", token.SignalingURL)
	}
	if remaining := time.Until(token.ExpiresAt); remaining <= 0 || remaining > 10*time.Minute+5*time.Second {
		t.Fatalf("unexpected token expiry window: %s", remaining)
	}
}

func TestHandleLiveKitWebhookRejectsInvalidSignature(t *testing.T) {
	t.Parallel()

	service := &WebRTCService{
		provider: &LiveKitProvider{
			cfg: config.Config{
				LiveKit: config.LiveKitConfig{
					Enabled:     true,
					URL:         "wss://meet.example.com",
					InternalURL: "http://livekit:7880",
					APIKey:      "key",
					APISecret:   "secret",
				},
			},
			keyAuth: lkauth.NewSimpleKeyProvider("key", "secret"),
		},
		metrics: &WebRTCMetrics{},
	}

	req := httptestRequest(t, []byte(`{"event":"room_started","id":"evt-1"}`), "Bearer invalid")
	err := service.HandleLiveKitWebhook(context.Background(), req)
	if err == nil || err != utils.ErrWebRTCHookUnauthorized {
		t.Fatalf("expected unauthorized webhook error, got %v", err)
	}
}

func httptestRequest(t *testing.T, body []byte, authHeader string) *http.Request {
	t.Helper()
	req, err := http.NewRequest("POST", "http://localhost/webhook", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/webhook+json")
	return req
}
