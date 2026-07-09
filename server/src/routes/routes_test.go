package routes

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"gorm.io/gorm"
)

type databaseStub struct{}

func (databaseStub) Gorm() *gorm.DB                                             { return nil }
func (databaseStub) Ping(context.Context) error                                 { return nil }
func (databaseStub) Close() error                                               { return nil }
func (databaseStub) Transaction(context.Context, func(tx *gorm.DB) error) error { return nil }

type eventBusStub struct{}

func (eventBusStub) Publish(context.Context, interfaces.Event) error { return nil }
func (eventBusStub) Subscribe(context.Context, string, interfaces.EventHandler) error {
	return nil
}
func (eventBusStub) Close() error                  { return nil }
func (eventBusStub) Healthy(context.Context) error { return nil }

type identityProviderStub struct{}

func (identityProviderStub) Authenticate(context.Context, string) (*interfaces.Principal, error) {
	return &interfaces.Principal{UserID: "user-1"}, nil
}
func (identityProviderStub) IssueToken(context.Context, interfaces.Principal) (string, error) {
	return "", nil
}

func TestHealthRoutes(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	SetupRoutes(router, Dependencies{
		Config: config.Config{
			App:      config.AppConfig{Version: "test"},
			Realtime: config.RealtimeConfig{Enabled: false},
			Worker:   config.WorkerConfig{Enabled: false},
		},
		Database:    databaseStub{},
		EventBus:    eventBusStub{},
		RuntimeRole: "api",
	})

	for _, target := range []string{"/health/live", "/health/ready", "/api/v1/health", "/api/v1/ready"} {
		req := httptest.NewRequest(http.MethodGet, target, nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("%s returned %d", target, rec.Code)
		}
	}
}

func TestJoinTokenRouteRequiresAuthentication(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	SetupRoutes(router, Dependencies{
		Config: config.Config{
			App:      config.AppConfig{Version: "test"},
			Realtime: config.RealtimeConfig{Enabled: false},
			Worker:   config.WorkerConfig{Enabled: false},
		},
		Database:         databaseStub{},
		EventBus:         eventBusStub{},
		IdentityProvider: identityProviderStub{},
		RuntimeRole:      "api",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/meetings/meeting-1/join-token", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestRoadmapRoutesRegistered(t *testing.T) {
	t.Parallel()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	SetupRoutes(router, Dependencies{
		Config: config.Config{
			App:      config.AppConfig{Version: "test"},
			Realtime: config.RealtimeConfig{Enabled: false},
			Worker:   config.WorkerConfig{Enabled: false},
		},
		Database:    databaseStub{},
		EventBus:    eventBusStub{},
		RuntimeRole: "api",
	})

	required := []string{
		"GET /api/v1/notifications",
		"GET /api/v1/notifications/unread-count",
		"POST /api/v1/notifications/:notificationId/read",
		"GET /api/v1/me/notification-preferences",
		"PATCH /api/v1/me/preferences",
		"POST /api/v1/workspaces/:workspaceId/members/provision",
		"GET /api/v1/workspaces/:workspaceId/sso",
		"PATCH /api/v1/workspaces/:workspaceId/sso",
		"GET /api/v1/workspaces/:workspaceId/contacts",
		"GET /api/v1/workspaces/:workspaceId/tasks",
		"GET /api/v1/workspaces/:workspaceId/projects",
		"POST /api/v1/workspaces/:workspaceId/files/uploads",
		"GET /api/v1/workspaces/:workspaceId/documents",
		"GET /api/v1/workspaces/:workspaceId/resources",
		"GET /api/v1/workspaces/:workspaceId/calls/history",
		"POST /api/v1/meetings/:meetingId/cancel",
	}

	registered := make(map[string]struct{}, len(router.Routes()))
	for _, route := range router.Routes() {
		registered[route.Method+" "+route.Path] = struct{}{}
	}

	var missing []string
	for _, route := range required {
		if _, ok := registered[route]; !ok {
			missing = append(missing, route)
		}
	}

	if len(missing) > 0 {
		t.Fatalf("missing routes: %s", strings.Join(missing, ", "))
	}
}
