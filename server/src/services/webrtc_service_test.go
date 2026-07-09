package services

import (
	"context"
	"errors"
	"testing"
	"time"

	livekit "github.com/livekit/protocol/livekit"
	lkwebhook "github.com/livekit/protocol/webhook"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"gorm.io/gorm"
)

type dbStub struct{}

func (dbStub) Gorm() *gorm.DB                                               { return nil }
func (dbStub) Ping(context.Context) error                                   { return nil }
func (dbStub) Close() error                                                 { return nil }
func (dbStub) Transaction(_ context.Context, fn func(*gorm.DB) error) error { return fn(nil) }

type providerStub struct {
	healthyErr error
}

func (p providerStub) CreateRoom(context.Context, interfaces.CreateRoomInput) (*interfaces.ProviderRoom, error) {
	return nil, errors.New("not implemented")
}
func (p providerStub) GetRoom(context.Context, string) (*interfaces.ProviderRoom, error) {
	return nil, errors.New("not implemented")
}
func (p providerStub) ListRooms(context.Context) ([]interfaces.ProviderRoom, error) { return nil, nil }
func (p providerStub) DeleteRoom(context.Context, string) error                     { return nil }
func (p providerStub) CreateJoinToken(context.Context, interfaces.JoinTokenInput) (*interfaces.JoinToken, error) {
	return nil, errors.New("not implemented")
}
func (p providerStub) RemoveParticipant(context.Context, string, string) error { return nil }
func (p providerStub) MuteParticipantTrack(context.Context, interfaces.MuteTrackInput) error {
	return nil
}
func (p providerStub) ListParticipants(context.Context, string) ([]interfaces.ProviderParticipant, error) {
	return nil, nil
}
func (p providerStub) Healthy(context.Context) error { return p.healthyErr }
func (p providerStub) PublicURL() string             { return "wss://webrtc.example.com" }
func (p providerStub) InternalURL() string           { return "http://livekit:7880" }
func (p providerStub) ProviderName() string          { return "livekit" }

type fakeRepoBundle struct {
	meetings     *fakeMeetingRepo
	participants *fakeMeetingParticipantRepo
	sessions     *fakeMeetingSessionRepo
	sessionUsers *fakeMeetingSessionParticipantRepo
	nodes        *fakeNodeRepo
	webhooks     *fakeWebhookRepo
	outbox       *fakeOutboxRepo
}

func (r fakeRepoBundle) Meetings() interfaces.MeetingRepository { return r.meetings }
func (r fakeRepoBundle) MeetingParticipants() interfaces.MeetingParticipantRepository {
	return r.participants
}
func (r fakeRepoBundle) MeetingSessions() interfaces.MeetingSessionRepository { return r.sessions }
func (r fakeRepoBundle) MeetingSessionParticipants() interfaces.MeetingSessionParticipantRepository {
	return r.sessionUsers
}
func (r fakeRepoBundle) WebRTCNodes() interfaces.WebRTCNodeRepository { return r.nodes }
func (r fakeRepoBundle) WebRTCWebhookEvents() interfaces.WebRTCWebhookEventRepository {
	return r.webhooks
}
func (r fakeRepoBundle) OutboxEvents() interfaces.OutboxRepository { return r.outbox }
func (r fakeRepoBundle) WithDB(*gorm.DB) webrtcRepositorySet       { return r }

type fakeMeetingRepo struct {
	items map[string]*models.Meeting
}

func (r *fakeMeetingRepo) Create(context.Context, *models.Meeting) error { return nil }
func (r *fakeMeetingRepo) GetByID(_ context.Context, id string) (*models.Meeting, error) {
	item, ok := r.items[id]
	if !ok {
		return nil, utils.NewError(404, "MEETING_NOT_FOUND", "missing", nil)
	}
	return item, nil
}
func (r *fakeMeetingRepo) ListByWorkspace(context.Context, string) ([]models.Meeting, error) {
	return nil, nil
}
func (r *fakeMeetingRepo) ListActive(context.Context, int) ([]models.Meeting, error) { return nil, nil }
func (r *fakeMeetingRepo) ListStartingBetween(context.Context, time.Time, time.Time, int) ([]models.Meeting, error) {
	return nil, nil
}
func (r *fakeMeetingRepo) ListExpiredScheduled(context.Context, time.Time, int) ([]models.Meeting, error) {
	return nil, nil
}
func (r *fakeMeetingRepo) ListAbandonedActive(context.Context, time.Time, int) ([]models.Meeting, error) {
	return nil, nil
}
func (r *fakeMeetingRepo) Update(_ context.Context, meeting *models.Meeting) error {
	r.items[meeting.ID] = meeting
	return nil
}

type fakeMeetingParticipantRepo struct{}

func (fakeMeetingParticipantRepo) Create(context.Context, *models.MeetingParticipant) error {
	return nil
}
func (fakeMeetingParticipantRepo) Get(context.Context, string, string) (*models.MeetingParticipant, error) {
	return nil, utils.NewError(404, "MEETING_PARTICIPANT_NOT_FOUND", "missing", nil)
}
func (fakeMeetingParticipantRepo) ListByMeeting(context.Context, string) ([]models.MeetingParticipant, error) {
	return nil, nil
}
func (fakeMeetingParticipantRepo) Upsert(context.Context, *models.MeetingParticipant) error {
	return nil
}
func (fakeMeetingParticipantRepo) Update(context.Context, *models.MeetingParticipant) error {
	return nil
}

type fakeMeetingSessionRepo struct {
	byID   map[string]*models.MeetingSession
	byRoom map[string]*models.MeetingSession
	active []models.MeetingSession
}

func (r *fakeMeetingSessionRepo) Create(context.Context, *models.MeetingSession) error { return nil }
func (r *fakeMeetingSessionRepo) GetByID(_ context.Context, id string) (*models.MeetingSession, error) {
	item, ok := r.byID[id]
	if !ok {
		return nil, utils.NewError(404, "MEETING_SESSION_NOT_FOUND", "missing", nil)
	}
	return item, nil
}
func (r *fakeMeetingSessionRepo) GetActiveByMeeting(context.Context, string) (*models.MeetingSession, error) {
	return nil, utils.NewError(404, "MEETING_SESSION_NOT_FOUND", "missing", nil)
}
func (r *fakeMeetingSessionRepo) GetByProviderRoomName(_ context.Context, room string) (*models.MeetingSession, error) {
	item, ok := r.byRoom[room]
	if !ok {
		return nil, utils.NewError(404, "MEETING_SESSION_NOT_FOUND", "missing", nil)
	}
	return item, nil
}
func (r *fakeMeetingSessionRepo) ListActive(context.Context, int) ([]models.MeetingSession, error) {
	return r.active, nil
}
func (r *fakeMeetingSessionRepo) Update(_ context.Context, session *models.MeetingSession) error {
	r.byID[session.ID] = session
	r.byRoom[session.ProviderRoomName] = session
	return nil
}

type fakeMeetingSessionParticipantRepo struct {
	bySession map[string][]models.MeetingSessionParticipant
}

func (r *fakeMeetingSessionParticipantRepo) Create(context.Context, *models.MeetingSessionParticipant) error {
	return nil
}
func (r *fakeMeetingSessionParticipantRepo) GetByIdentity(context.Context, string, string) (*models.MeetingSessionParticipant, error) {
	return nil, utils.NewError(404, "SESSION_PARTICIPANT_NOT_FOUND", "missing", nil)
}
func (r *fakeMeetingSessionParticipantRepo) ListBySession(_ context.Context, sessionID string) ([]models.MeetingSessionParticipant, error) {
	return r.bySession[sessionID], nil
}
func (r *fakeMeetingSessionParticipantRepo) Upsert(_ context.Context, participant *models.MeetingSessionParticipant) error {
	r.bySession[participant.SessionID] = append(r.bySession[participant.SessionID], *participant)
	return nil
}
func (r *fakeMeetingSessionParticipantRepo) Update(_ context.Context, participant *models.MeetingSessionParticipant) error {
	items := r.bySession[participant.SessionID]
	for i := range items {
		if items[i].ProviderIdentity == participant.ProviderIdentity {
			items[i] = *participant
			r.bySession[participant.SessionID] = items
			return nil
		}
	}
	r.bySession[participant.SessionID] = append(r.bySession[participant.SessionID], *participant)
	return nil
}

type fakeNodeRepo struct {
	node *models.WebRTCNode
}

func (r *fakeNodeRepo) Upsert(_ context.Context, node *models.WebRTCNode) error {
	r.node = node
	return nil
}
func (r *fakeNodeRepo) GetByID(context.Context, string) (*models.WebRTCNode, error) {
	if r.node == nil {
		return nil, utils.NewError(404, "WEBRTC_NODE_NOT_FOUND", "missing", nil)
	}
	return r.node, nil
}
func (r *fakeNodeRepo) ListHealthy(context.Context, string) ([]models.WebRTCNode, error) {
	if r.node == nil {
		return nil, nil
	}
	return []models.WebRTCNode{*r.node}, nil
}
func (r *fakeNodeRepo) Update(_ context.Context, node *models.WebRTCNode) error {
	r.node = node
	return nil
}

type fakeWebhookRepo struct {
	items map[string]*models.WebRTCWebhookEvent
}

func (r *fakeWebhookRepo) Create(_ context.Context, event *models.WebRTCWebhookEvent) error {
	r.items[event.EventID] = event
	return nil
}
func (r *fakeWebhookRepo) GetByEventID(_ context.Context, provider, eventID string) (*models.WebRTCWebhookEvent, error) {
	item, ok := r.items[eventID]
	if !ok || item.Provider != provider {
		return nil, utils.NewError(404, "WEBHOOK_EVENT_NOT_FOUND", "missing", nil)
	}
	return item, nil
}

type fakeOutboxRepo struct {
	items []models.OutboxEvent
}

func (r *fakeOutboxRepo) Create(_ context.Context, event *models.OutboxEvent) error {
	r.items = append(r.items, *event)
	return nil
}
func (r *fakeOutboxRepo) ClaimUnpublished(context.Context, string, int, int) ([]models.OutboxEvent, error) {
	return nil, nil
}
func (r *fakeOutboxRepo) MarkPublished(context.Context, string, time.Time) error { return nil }
func (r *fakeOutboxRepo) MarkFailed(context.Context, string, int, string) error  { return nil }

func TestWebRTCReadyRequiresFreshHealthyNode(t *testing.T) {
	t.Parallel()

	cfg := config.Config{
		LiveKit: config.LiveKitConfig{
			InternalURL: "http://livekit:7880",
			APIKey:      "key",
			APISecret:   "secret",
		},
		WebRTC: config.WebRTCConfig{
			PublicURL:           "wss://webrtc.example.com",
			NodeID:              "node-1",
			HealthcheckInterval: 30 * time.Second,
		},
	}

	node := &models.WebRTCNode{
		Common:          models.Common{ID: "node-1"},
		Status:          "healthy",
		LastHeartbeatAt: timePtr(time.Now().UTC().Add(-3 * time.Minute)),
	}
	repos := fakeRepoBundle{nodes: &fakeNodeRepo{node: node}}
	service := &WebRTCService{cfg: cfg, provider: providerStub{}, repos: repos}

	if err := service.Ready(context.Background()); err == nil {
		t.Fatal("expected stale heartbeat to fail readiness")
	}

	node.LastHeartbeatAt = timePtr(time.Now().UTC())
	if err := service.Ready(context.Background()); err != nil {
		t.Fatalf("expected healthy node to be ready, got %v", err)
	}
}

func TestRefreshNodeHeartbeatMarksNodeUnhealthy(t *testing.T) {
	t.Parallel()

	node := &models.WebRTCNode{Common: models.Common{ID: "node-1"}, Status: "healthy"}
	repos := fakeRepoBundle{
		nodes:  &fakeNodeRepo{node: node},
		outbox: &fakeOutboxRepo{},
	}
	service := &WebRTCService{
		cfg:      config.Config{WebRTC: config.WebRTCConfig{NodeID: "node-1"}},
		repos:    repos,
		provider: providerStub{healthyErr: errors.New("livekit down")},
		outbox:   &OutboxService{repo: repos.outbox},
		metrics:  &WebRTCMetrics{},
	}

	if err := service.refreshNodeHeartbeat(context.Background()); err != nil {
		t.Fatalf("refreshNodeHeartbeat returned error: %v", err)
	}
	if repos.nodes.node.Status != "unhealthy" {
		t.Fatalf("expected node status unhealthy, got %q", repos.nodes.node.Status)
	}
	if len(repos.outbox.items) != 1 || repos.outbox.items[0].EventType != "webrtc.node.unhealthy" {
		t.Fatalf("expected webrtc.node.unhealthy outbox event, got %#v", repos.outbox.items)
	}
}

func TestConsumeWebhookEventDeduplicatesByEventID(t *testing.T) {
	t.Parallel()

	session := &models.MeetingSession{
		Common:           models.Common{ID: "session-1"},
		MeetingID:        "meeting-1",
		WorkspaceID:      "workspace-1",
		ProviderRoomName: "room-1",
	}
	repos := fakeRepoBundle{
		meetings:     &fakeMeetingRepo{items: map[string]*models.Meeting{}},
		participants: &fakeMeetingParticipantRepo{},
		sessions: &fakeMeetingSessionRepo{
			byID:   map[string]*models.MeetingSession{"session-1": session},
			byRoom: map[string]*models.MeetingSession{"room-1": session},
		},
		sessionUsers: &fakeMeetingSessionParticipantRepo{bySession: map[string][]models.MeetingSessionParticipant{}},
		nodes:        &fakeNodeRepo{},
		webhooks:     &fakeWebhookRepo{items: map[string]*models.WebRTCWebhookEvent{}},
		outbox:       &fakeOutboxRepo{},
	}
	service := &WebRTCService{
		cfg:      config.Config{},
		db:       dbStub{},
		repos:    repos,
		provider: providerStub{},
		outbox:   &OutboxService{repo: repos.outbox},
		metrics:  &WebRTCMetrics{},
	}
	event := &livekit.WebhookEvent{
		Id:    "evt-1",
		Event: lkwebhook.EventParticipantJoined,
		Room:  &livekit.Room{Name: "room-1"},
		Participant: &livekit.ParticipantInfo{
			Identity: "user-1",
			Name:     "User 1",
		},
	}

	if err := service.consumeWebhookEvent(context.Background(), event); err != nil {
		t.Fatalf("first consumeWebhookEvent returned error: %v", err)
	}
	if err := service.consumeWebhookEvent(context.Background(), event); err != nil {
		t.Fatalf("second consumeWebhookEvent returned error: %v", err)
	}

	if len(repos.webhooks.items) != 1 {
		t.Fatalf("expected exactly one webhook event persisted, got %d", len(repos.webhooks.items))
	}
	if len(repos.outbox.items) != 1 {
		t.Fatalf("expected exactly one outbox event, got %d", len(repos.outbox.items))
	}
}

func TestValidateWebhookReplayWindowRejectsStaleEvents(t *testing.T) {
	t.Parallel()

	body := []byte(`{"createdAt":1}`)
	if err := validateWebhookReplayWindow(body, time.Minute); err != utils.ErrWebRTCHookUnauthorized {
		t.Fatalf("expected replay protection error, got %v", err)
	}
}

func timePtr(v time.Time) *time.Time {
	return &v
}
