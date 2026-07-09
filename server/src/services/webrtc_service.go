package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	livekit "github.com/livekit/protocol/livekit"
	lkprotojson "github.com/livekit/protocol/utils/protojson"
	lkwebhook "github.com/livekit/protocol/webhook"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"gorm.io/gorm"
)

type MeetingStartResponse struct {
	Meeting *models.Meeting        `json:"meeting"`
	Session *models.MeetingSession `json:"session"`
}

type WebRTCService struct {
	logger     *slog.Logger
	cfg        config.Config
	db         interfaces.Database
	repos      webrtcRepositorySet
	workspaces *WorkspaceService
	provider   interfaces.WebRTCProvider
	selector   interfaces.NodeSelector
	outbox     *OutboxService
	producer   interfaces.JobProducer
	bus        interfaces.EventBus
	metrics    *WebRTCMetrics
}

type webrtcRepositorySet interface {
	Meetings() interfaces.MeetingRepository
	MeetingParticipants() interfaces.MeetingParticipantRepository
	MeetingSessions() interfaces.MeetingSessionRepository
	MeetingSessionParticipants() interfaces.MeetingSessionParticipantRepository
	WebRTCNodes() interfaces.WebRTCNodeRepository
	WebRTCWebhookEvents() interfaces.WebRTCWebhookEventRepository
	OutboxEvents() interfaces.OutboxRepository
	WithDB(*gorm.DB) webrtcRepositorySet
}

type repositoryAdapter struct {
	*Repositories
}

func (r repositoryAdapter) WithDB(db *gorm.DB) webrtcRepositorySet {
	return repositoryAdapter{Repositories: r.Repositories.WithDB(db)}
}

func NewWebRTCService(logger *slog.Logger, cfg config.Config, db interfaces.Database, repos *Repositories, workspaces *WorkspaceService, provider interfaces.WebRTCProvider, selector interfaces.NodeSelector, outbox *OutboxService, producer interfaces.JobProducer, bus interfaces.EventBus, metrics *WebRTCMetrics) *WebRTCService {
	return &WebRTCService{
		logger:     logger,
		cfg:        cfg,
		db:         db,
		repos:      repositoryAdapter{Repositories: repos},
		workspaces: workspaces,
		provider:   provider,
		selector:   selector,
		outbox:     outbox,
		producer:   producer,
		bus:        bus,
		metrics:    metrics,
	}
}

func (s *WebRTCService) Ready(ctx context.Context) error {
	if s.provider == nil || s.provider.ProviderName() == "disabled" {
		return utils.ErrMeetingProviderUnavailable
	}
	if s.cfg.LiveKit.InternalURL == "" || s.cfg.WebRTC.PublicURL == "" || s.cfg.LiveKit.APIKey == "" || s.cfg.LiveKit.APISecret == "" {
		return utils.ErrDependencyUnavailable
	}
	if err := s.provider.Healthy(ctx); err != nil {
		if s.metrics != nil {
			s.metrics.IncProviderErrors()
		}
		return err
	}
	node, err := s.repos.WebRTCNodes().GetByID(ctx, s.cfg.WebRTC.NodeID)
	if err != nil {
		return err
	}
	if node.Draining || node.Status != "healthy" {
		return utils.ErrDependencyUnavailable
	}
	staleAfter := maxDuration(2*s.cfg.WebRTC.HealthcheckInterval, time.Minute)
	if node.LastHeartbeatAt == nil || time.Since(node.LastHeartbeatAt.UTC()) > staleAfter {
		return utils.ErrDependencyUnavailable
	}
	return nil
}

func (s *WebRTCService) StartMeeting(ctx context.Context, principal interfaces.Principal, meetingID string) (*MeetingStartResponse, error) {
	meeting, member, err := s.authorizeMeeting(ctx, principal, meetingID)
	if err != nil {
		return nil, err
	}
	if !canModerateMeeting(*meeting, *member) {
		return nil, utils.ErrForbidden
	}
	if meeting.Status == "ended" || meeting.Status == "expired" || meeting.Status == "cancelled" {
		return nil, utils.ErrMeetingStateConflict
	}

	if session, err := s.repos.MeetingSessions().GetActiveByMeeting(ctx, meeting.ID); err == nil {
		return &MeetingStartResponse{Meeting: meeting, Session: session}, nil
	}

	node, err := s.selector.SelectNode(ctx, meeting.WorkspaceID, s.cfg.WebRTC.Region)
	if err != nil {
		return nil, err
	}

	roomName := providerRoomName(meeting)
	start := time.Now()
	room, err := s.provider.CreateRoom(ctx, interfaces.CreateRoomInput{
		MeetingID:    meeting.ID,
		WorkspaceID:  meeting.WorkspaceID,
		RoomName:     roomName,
		EmptyTimeout: uint32(s.cfg.WebRTC.RoomEmptyTimeout / time.Second),
		Metadata: map[string]string{
			"meetingId":   meeting.ID,
			"workspaceId": meeting.WorkspaceID,
			"nodeId":      node.ID,
		},
	})
	if err != nil {
		room, err = s.provider.GetRoom(ctx, roomName)
		if err != nil {
			if s.metrics != nil {
				s.metrics.IncProviderErrors()
			}
			return nil, err
		}
	}
	if s.metrics != nil {
		s.metrics.ObserveRoomCreateDuration(time.Since(start))
	}

	session := &models.MeetingSession{}
	err = s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		currentMeeting, err := txRepos.Meetings().GetByID(ctx, meeting.ID)
		if err != nil {
			return err
		}
		if active, err := txRepos.MeetingSessions().GetActiveByMeeting(ctx, meeting.ID); err == nil {
			session = active
			meeting = currentMeeting
			return nil
		}

		now := time.Now().UTC()
		session = &models.MeetingSession{
			Common:           models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			MeetingID:        meeting.ID,
			WorkspaceID:      meeting.WorkspaceID,
			Provider:         s.provider.ProviderName(),
			ProviderRoomName: room.Name,
			ProviderRoomID:   room.ID,
			NodeID:           node.ID,
			Status:           "active",
			PublicURL:        s.cfg.WebRTC.PublicURL,
			SignalingURL:     s.provider.PublicURL(),
			StartedAt:        &now,
		}
		if err := txRepos.MeetingSessions().Create(ctx, session); err != nil {
			return err
		}

		currentMeeting.Status = "active"
		currentMeeting.Provider = s.provider.ProviderName()
		currentMeeting.ProviderRoomID = room.ID
		currentMeeting.StartedAt = &now
		currentMeeting.UpdatedAt = now
		if err := txRepos.Meetings().Update(ctx, currentMeeting); err != nil {
			return err
		}
		meeting = currentMeeting

		if err := s.outbox.Add(ctx, txRepos.OutboxEvents(), "meeting.started", "meeting", meeting.ID, meeting.WorkspaceID, map[string]any{
			"meetingId":   meeting.ID,
			"workspaceId": meeting.WorkspaceID,
			"sessionId":   session.ID,
		}); err != nil {
			return err
		}
		if err := s.outbox.Add(ctx, txRepos.OutboxEvents(), "meeting.session.created", "meeting_session", session.ID, meeting.WorkspaceID, map[string]any{
			"meetingId":   meeting.ID,
			"workspaceId": meeting.WorkspaceID,
			"sessionId":   session.ID,
			"roomName":    session.ProviderRoomName,
		}); err != nil {
			return err
		}
		return s.outbox.Add(ctx, txRepos.OutboxEvents(), "meeting.session.started", "meeting_session", session.ID, meeting.WorkspaceID, map[string]any{
			"meetingId":   meeting.ID,
			"workspaceId": meeting.WorkspaceID,
			"sessionId":   session.ID,
			"roomName":    session.ProviderRoomName,
		})
	})
	if err != nil {
		return nil, err
	}

	s.publishRealtimeEvent(ctx, "meeting.session.started", meeting.WorkspaceID, principal.UserID, meeting.ID, map[string]any{
		"meetingId": meeting.ID,
		"sessionId": session.ID,
		"roomName":  session.ProviderRoomName,
	})
	return &MeetingStartResponse{Meeting: meeting, Session: session}, nil
}

func (s *WebRTCService) EndMeeting(ctx context.Context, principal interfaces.Principal, meetingID string) (*MeetingStartResponse, error) {
	meeting, member, err := s.authorizeMeeting(ctx, principal, meetingID)
	if err != nil {
		return nil, err
	}
	if !canModerateMeeting(*meeting, *member) {
		return nil, utils.ErrForbidden
	}

	session, sessionErr := s.repos.MeetingSessions().GetActiveByMeeting(ctx, meeting.ID)
	if sessionErr == nil {
		if err := s.provider.DeleteRoom(ctx, session.ProviderRoomName); err != nil && !isProviderNotFound(err) {
			if s.metrics != nil {
				s.metrics.IncProviderErrors()
			}
			return nil, err
		}
	}

	err = s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		currentMeeting, err := txRepos.Meetings().GetByID(ctx, meeting.ID)
		if err != nil {
			return err
		}
		now := time.Now().UTC()
		if currentMeeting.Status != "ended" {
			currentMeeting.Status = "ended"
			currentMeeting.EndedAt = &now
			currentMeeting.UpdatedAt = now
			if err := txRepos.Meetings().Update(ctx, currentMeeting); err != nil {
				return err
			}
		}
		meeting = currentMeeting

		if sessionErr == nil {
			currentSession, err := txRepos.MeetingSessions().GetByID(ctx, session.ID)
			if err == nil && currentSession.EndedAt == nil {
				currentSession.Status = "ended"
				currentSession.EndedAt = &now
				currentSession.UpdatedAt = now
				if err := txRepos.MeetingSessions().Update(ctx, currentSession); err != nil {
					return err
				}
				session = currentSession
			}
		}

		if err := s.outbox.Add(ctx, txRepos.OutboxEvents(), "meeting.ended", "meeting", meeting.ID, meeting.WorkspaceID, map[string]any{
			"meetingId":   meeting.ID,
			"workspaceId": meeting.WorkspaceID,
		}); err != nil {
			return err
		}
		if sessionErr == nil {
			return s.outbox.Add(ctx, txRepos.OutboxEvents(), "meeting.session.ended", "meeting_session", session.ID, meeting.WorkspaceID, map[string]any{
				"meetingId":   meeting.ID,
				"workspaceId": meeting.WorkspaceID,
				"sessionId":   session.ID,
				"roomName":    session.ProviderRoomName,
			})
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	if s.producer != nil && sessionErr == nil {
		_, _ = s.producer.EnqueueJob(ctx, "webrtc", "webrtc.participant.cleanup", map[string]any{
			"sessionId":   session.ID,
			"meetingId":   meeting.ID,
			"workspaceId": meeting.WorkspaceID,
		}, interfaces.JobOptions{WorkspaceID: meeting.WorkspaceID})
	}
	s.publishRealtimeEvent(ctx, "meeting.session.ended", meeting.WorkspaceID, principal.UserID, meeting.ID, map[string]any{
		"meetingId": meeting.ID,
		"sessionId": session.ID,
	})
	return &MeetingStartResponse{Meeting: meeting, Session: session}, nil
}

func (s *WebRTCService) JoinToken(ctx context.Context, principal interfaces.Principal, meetingID string) (*interfaces.JoinToken, error) {
	meeting, member, err := s.authorizeMeeting(ctx, principal, meetingID)
	if err != nil {
		if s.metrics != nil {
			s.metrics.IncJoinTokenFailures()
		}
		return nil, err
	}
	perms, err := s.resolvePermissions(ctx, *meeting, principal, *member)
	if err != nil {
		if s.metrics != nil {
			s.metrics.IncJoinTokenFailures()
		}
		return nil, err
	}
	if !perms.CanJoin {
		if s.metrics != nil {
			s.metrics.IncJoinTokenFailures()
		}
		return nil, utils.ErrForbidden
	}

	session, err := s.repos.MeetingSessions().GetActiveByMeeting(ctx, meeting.ID)
	if err != nil {
		if canModerateMeeting(*meeting, *member) && meeting.Status == "scheduled" {
			started, startErr := s.StartMeeting(ctx, principal, meeting.ID)
			if startErr != nil {
				if s.metrics != nil {
					s.metrics.IncJoinTokenFailures()
				}
				return nil, startErr
			}
			session = started.Session
			meeting = started.Meeting
		} else {
			if s.metrics != nil {
				s.metrics.IncJoinTokenFailures()
			}
			return nil, utils.ErrMeetingSessionUnavailable
		}
	}

	token, err := s.provider.CreateJoinToken(ctx, interfaces.JoinTokenInput{
		MeetingID:           meeting.ID,
		WorkspaceID:         meeting.WorkspaceID,
		SessionID:           session.ID,
		RoomName:            session.ProviderRoomName,
		ParticipantIdentity: principal.UserID,
		ParticipantName:     principal.UserID,
		TTL:                 s.cfg.WebRTC.TokenTTL,
		Permissions:         perms,
		Metadata: mustJSON(map[string]any{
			"meetingId":   meeting.ID,
			"workspaceId": meeting.WorkspaceID,
			"sessionId":   session.ID,
			"role":        perms.Role,
		}),
		Attributes: map[string]string{
			"meeting_id":   meeting.ID,
			"workspace_id": meeting.WorkspaceID,
			"session_id":   session.ID,
			"role":         perms.Role,
		},
	})
	if err != nil {
		if s.metrics != nil {
			s.metrics.IncJoinTokenFailures()
			s.metrics.IncProviderErrors()
		}
		return nil, err
	}
	if s.metrics != nil {
		s.metrics.IncJoinTokensIssued()
	}

	now := time.Now().UTC()
	participant := &models.MeetingSessionParticipant{
		Common:           models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		SessionID:        session.ID,
		WorkspaceID:      meeting.WorkspaceID,
		UserID:           principal.UserID,
		ProviderIdentity: principal.UserID,
		Role:             perms.Role,
		Status:           "token_issued",
		LastSeenAt:       &now,
	}
	_ = s.repos.MeetingSessionParticipants().Upsert(ctx, participant)
	return token, nil
}

func (s *WebRTCService) ListParticipants(ctx context.Context, principal interfaces.Principal, meetingID string) ([]models.MeetingSessionParticipant, error) {
	meeting, _, err := s.authorizeMeeting(ctx, principal, meetingID)
	if err != nil {
		return nil, err
	}
	session, err := s.repos.MeetingSessions().GetActiveByMeeting(ctx, meeting.ID)
	if err != nil {
		return nil, err
	}
	return s.repos.MeetingSessionParticipants().ListBySession(ctx, session.ID)
}

func (s *WebRTCService) HandleLiveKitWebhook(ctx context.Context, request *http.Request) error {
	provider, ok := s.provider.(*LiveKitProvider)
	if !ok {
		return utils.ErrMeetingProviderUnavailable
	}
	limitedRequest, body, err := cloneRequestBodyWithLimit(request, 1<<20)
	if err != nil {
		if s.metrics != nil {
			s.metrics.IncWebhookFailures()
		}
		return utils.ErrValidationFailed
	}
	if replayErr := validateWebhookReplayWindow(body, 10*time.Minute); replayErr != nil {
		if s.metrics != nil {
			s.metrics.IncWebhookFailures()
		}
		return replayErr
	}
	event, err := lkwebhook.ReceiveWebhookEvent(limitedRequest, provider.keyAuth)
	if err != nil {
		if s.metrics != nil {
			s.metrics.IncWebhookFailures()
		}
		return utils.ErrWebRTCHookUnauthorized
	}
	return s.consumeWebhookEvent(ctx, event)
}

func (s *WebRTCService) consumeWebhookEvent(ctx context.Context, event *livekit.WebhookEvent) error {
	if event == nil {
		return utils.ErrValidationFailed
	}
	if s.metrics != nil {
		s.metrics.IncWebhookEvents()
	}
	if _, err := s.repos.WebRTCWebhookEvents().GetByEventID(ctx, s.provider.ProviderName(), event.GetId()); err == nil {
		return nil
	}

	session, err := s.repos.MeetingSessions().GetByProviderRoomName(ctx, event.GetRoom().GetName())
	if err != nil {
		if event.GetEvent() == lkwebhook.EventRoomFinished {
			return nil
		}
		return err
	}

	payload, _ := lkprotojson.Marshal(event)
	var publishType string
	publishPayload := map[string]any{
		"meetingId":   session.MeetingID,
		"workspaceId": session.WorkspaceID,
		"sessionId":   session.ID,
		"roomName":    session.ProviderRoomName,
	}

	err = s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		if _, err := txRepos.WebRTCWebhookEvents().GetByEventID(ctx, s.provider.ProviderName(), event.GetId()); err == nil {
			return nil
		}
		now := time.Now().UTC()
		if err := txRepos.WebRTCWebhookEvents().Create(ctx, &models.WebRTCWebhookEvent{
			Common:       models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			Provider:     s.provider.ProviderName(),
			EventID:      event.GetId(),
			EventType:    event.GetEvent(),
			WorkspaceID:  session.WorkspaceID,
			MeetingID:    session.MeetingID,
			SessionID:    session.ID,
			ProviderRoom: session.ProviderRoomName,
			ReceivedAt:   now,
			Payload:      payload,
		}); err != nil {
			return err
		}

		switch event.GetEvent() {
		case lkwebhook.EventRoomStarted:
			publishType = "meeting.session.started"
			currentSession, err := txRepos.MeetingSessions().GetByID(ctx, session.ID)
			if err == nil {
				currentSession.Status = "active"
				if currentSession.StartedAt == nil {
					currentSession.StartedAt = &now
				}
				currentSession.UpdatedAt = now
				if err := txRepos.MeetingSessions().Update(ctx, currentSession); err != nil {
					return err
				}
			}
		case lkwebhook.EventRoomFinished:
			publishType = "meeting.session.ended"
			currentSession, err := txRepos.MeetingSessions().GetByID(ctx, session.ID)
			if err == nil {
				currentSession.Status = "ended"
				currentSession.EndedAt = &now
				currentSession.UpdatedAt = now
				if err := txRepos.MeetingSessions().Update(ctx, currentSession); err != nil {
					return err
				}
			}
		case lkwebhook.EventParticipantJoined:
			publishType = "meeting.participant.joined"
			publishPayload["participantIdentity"] = event.GetParticipant().GetIdentity()
			publishPayload["participantName"] = event.GetParticipant().GetName()
			if err := s.upsertWebhookParticipant(ctx, txRepos, session, event, "joined", now); err != nil {
				return err
			}
		case lkwebhook.EventParticipantLeft, lkwebhook.EventParticipantConnectionAborted:
			publishType = "meeting.participant.left"
			publishPayload["participantIdentity"] = event.GetParticipant().GetIdentity()
			if err := s.upsertWebhookParticipant(ctx, txRepos, session, event, "left", now); err != nil {
				return err
			}
		case lkwebhook.EventTrackPublished:
			publishType = "meeting.track.published"
			publishPayload["participantIdentity"] = event.GetParticipant().GetIdentity()
			publishPayload["trackSid"] = event.GetTrack().GetSid()
			publishPayload["trackSource"] = event.GetTrack().GetSource().String()
		case lkwebhook.EventTrackUnpublished:
			publishType = "meeting.track.unpublished"
			publishPayload["participantIdentity"] = event.GetParticipant().GetIdentity()
			publishPayload["trackSid"] = event.GetTrack().GetSid()
			publishPayload["trackSource"] = event.GetTrack().GetSource().String()
		default:
			return nil
		}
		return s.outbox.Add(ctx, txRepos.OutboxEvents(), publishType, "meeting_session", session.ID, session.WorkspaceID, publishPayload)
	})
	if err != nil {
		if s.metrics != nil {
			s.metrics.IncWebhookFailures()
		}
		return err
	}
	if publishType != "" {
		s.publishRealtimeEvent(ctx, publishType, session.WorkspaceID, "", session.MeetingID, publishPayload)
	}
	return nil
}

func (s *WebRTCService) Run(ctx context.Context) error {
	if s.provider == nil {
		<-ctx.Done()
		return nil
	}
	if err := s.registerNode(ctx); err != nil {
		return err
	}
	if err := s.refreshNodeHeartbeat(ctx); err != nil {
		return err
	}
	if err := s.ReconcileRooms(ctx); err != nil {
		return err
	}
	if err := s.ExpireAbandonedSessions(ctx); err != nil {
		return err
	}
	if err := s.CleanupStaleParticipants(ctx); err != nil {
		return err
	}
	heartbeat := time.NewTicker(s.cfg.WebRTC.HealthcheckInterval)
	defer heartbeat.Stop()
	defer s.markNodeDraining()
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-heartbeat.C:
			if err := s.refreshNodeHeartbeat(ctx); err != nil {
				s.logger.Warn("webrtc node heartbeat failed", "error", err)
			}
			if err := s.ReconcileRooms(ctx); err != nil {
				s.logger.Warn("webrtc reconcile failed", "error", err)
			}
			if err := s.ExpireAbandonedSessions(ctx); err != nil {
				s.logger.Warn("webrtc session expiration failed", "error", err)
			}
			if err := s.CleanupStaleParticipants(ctx); err != nil {
				s.logger.Warn("webrtc participant cleanup failed", "error", err)
			}
		}
	}
}

func (s *WebRTCService) ReconcileRooms(ctx context.Context) error {
	sessions, err := s.repos.MeetingSessions().ListActive(ctx, 200)
	if err != nil {
		return err
	}
	if s.metrics != nil {
		s.metrics.SetActiveRooms(int64(len(sessions)))
	}
	count := 0
	for _, session := range sessions {
		participants, err := s.provider.ListParticipants(ctx, session.ProviderRoomName)
		if err != nil {
			if isProviderNotFound(err) {
				if closeErr := s.CloseRoom(ctx, session.ID, session.ProviderRoomName); closeErr != nil {
					return closeErr
				}
				continue
			}
			if s.metrics != nil {
				s.metrics.IncProviderErrors()
			}
			continue
		}
		count += len(participants)
	}
	if s.metrics != nil {
		s.metrics.SetActiveParticipants(int64(count))
	}
	if node, err := s.repos.WebRTCNodes().GetByID(ctx, s.cfg.WebRTC.NodeID); err == nil {
		node.ActiveRooms = len(sessions)
		node.ActiveParticipants = count
		node.UpdatedAt = time.Now().UTC()
		_ = s.repos.WebRTCNodes().Update(ctx, node)
	}
	return nil
}

func (s *WebRTCService) CleanupParticipants(ctx context.Context, sessionID string) error {
	participants, err := s.repos.MeetingSessionParticipants().ListBySession(ctx, sessionID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	for _, participant := range participants {
		if participant.LeftAt != nil {
			continue
		}
		participant.LeftAt = &now
		participant.Status = "left"
		participant.UpdatedAt = now
		if err := s.repos.MeetingSessionParticipants().Update(ctx, &participant); err != nil {
			return err
		}
	}
	return nil
}

func (s *WebRTCService) CleanupStaleParticipants(ctx context.Context) error {
	sessions, err := s.repos.MeetingSessions().ListActive(ctx, 200)
	if err != nil {
		return err
	}
	cutoff := time.Now().UTC().Add(-s.cfg.WebRTC.ParticipantTTL)
	for _, session := range sessions {
		participants, err := s.repos.MeetingSessionParticipants().ListBySession(ctx, session.ID)
		if err != nil {
			return err
		}
		for _, participant := range participants {
			if participant.LeftAt != nil {
				continue
			}
			if participant.LastSeenAt != nil && participant.LastSeenAt.After(cutoff) {
				continue
			}
			participant.Status = "stale"
			now := time.Now().UTC()
			participant.LeftAt = &now
			participant.UpdatedAt = now
			if err := s.repos.MeetingSessionParticipants().Update(ctx, &participant); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *WebRTCService) ExpireAbandonedSessions(ctx context.Context) error {
	sessions, err := s.repos.MeetingSessions().ListActive(ctx, 200)
	if err != nil {
		return err
	}
	cutoff := time.Now().UTC().Add(-maxDuration(2*s.cfg.WebRTC.ParticipantTTL, time.Minute))
	for _, session := range sessions {
		if session.UpdatedAt.After(cutoff) {
			continue
		}
		if err := s.CloseRoom(ctx, session.ID, session.ProviderRoomName); err != nil {
			return err
		}
	}
	return nil
}

func (s *WebRTCService) CloseRoom(ctx context.Context, sessionID string, roomName string) error {
	var session *models.MeetingSession
	var err error
	switch {
	case sessionID != "":
		session, err = s.repos.MeetingSessions().GetByID(ctx, sessionID)
	case roomName != "":
		session, err = s.repos.MeetingSessions().GetByProviderRoomName(ctx, roomName)
	default:
		return utils.ErrValidationFailed
	}
	if err != nil {
		return nil
	}

	if err := s.provider.DeleteRoom(ctx, session.ProviderRoomName); err != nil && !isProviderNotFound(err) {
		if s.metrics != nil {
			s.metrics.IncProviderErrors()
		}
		return err
	}

	now := time.Now().UTC()
	err = s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		currentSession, err := txRepos.MeetingSessions().GetByID(ctx, session.ID)
		if err != nil {
			return nil
		}
		if currentSession.EndedAt == nil {
			currentSession.Status = "ended"
			currentSession.EndedAt = &now
			currentSession.UpdatedAt = now
			if err := txRepos.MeetingSessions().Update(ctx, currentSession); err != nil {
				return err
			}
		}

		meeting, err := txRepos.Meetings().GetByID(ctx, currentSession.MeetingID)
		if err == nil && meeting.EndedAt == nil && meeting.Status == "active" {
			meeting.Status = "ended"
			meeting.EndedAt = &now
			meeting.UpdatedAt = now
			if err := txRepos.Meetings().Update(ctx, meeting); err != nil {
				return err
			}
		}

		return s.outbox.Add(ctx, txRepos.OutboxEvents(), "meeting.session.ended", "meeting_session", currentSession.ID, currentSession.WorkspaceID, map[string]any{
			"meetingId":   currentSession.MeetingID,
			"workspaceId": currentSession.WorkspaceID,
			"sessionId":   currentSession.ID,
			"roomName":    currentSession.ProviderRoomName,
		})
	})
	if err != nil {
		return err
	}

	_ = s.CleanupParticipants(ctx, session.ID)
	s.publishRealtimeEvent(ctx, "meeting.session.ended", session.WorkspaceID, "", session.MeetingID, map[string]any{
		"meetingId": session.MeetingID,
		"sessionId": session.ID,
		"roomName":  session.ProviderRoomName,
	})
	return nil
}

func (s *WebRTCService) registerNode(ctx context.Context) error {
	now := time.Now().UTC()
	node := &models.WebRTCNode{
		Common:             models.Common{ID: s.cfg.WebRTC.NodeID, CreatedAt: now, UpdatedAt: now},
		Provider:           s.provider.ProviderName(),
		Region:             s.cfg.WebRTC.Region,
		InternalURL:        s.provider.InternalURL(),
		PublicURL:          s.provider.PublicURL(),
		Status:             "healthy",
		Capacity:           s.cfg.WebRTC.NodeCapacity,
		ActiveRooms:        0,
		ActiveParticipants: 0,
		LastHeartbeatAt:    &now,
		Draining:           s.cfg.WebRTC.Draining,
	}
	if err := s.repos.WebRTCNodes().Upsert(ctx, node); err != nil {
		return err
	}
	if s.metrics != nil {
		s.metrics.SetNodes(1)
	}
	return nil
}

func (s *WebRTCService) refreshNodeHeartbeat(ctx context.Context) error {
	node, err := s.repos.WebRTCNodes().GetByID(ctx, s.cfg.WebRTC.NodeID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	if err := s.provider.Healthy(ctx); err != nil {
		node.Status = "unhealthy"
		if s.metrics != nil {
			s.metrics.IncProviderErrors()
		}
		_ = s.outbox.Add(ctx, nil, "webrtc.node.unhealthy", "webrtc_node", node.ID, "", map[string]any{
			"nodeId":   node.ID,
			"provider": node.Provider,
			"region":   node.Region,
		})
	} else {
		node.Status = "healthy"
	}
	node.LastHeartbeatAt = &now
	node.UpdatedAt = now
	return s.repos.WebRTCNodes().Update(ctx, node)
}

func (s *WebRTCService) markNodeDraining() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	node, err := s.repos.WebRTCNodes().GetByID(ctx, s.cfg.WebRTC.NodeID)
	if err != nil {
		return
	}
	now := time.Now().UTC()
	node.Draining = true
	node.Status = "draining"
	node.LastHeartbeatAt = &now
	node.UpdatedAt = now
	_ = s.repos.WebRTCNodes().Update(ctx, node)
}

func (s *WebRTCService) authorizeMeeting(ctx context.Context, principal interfaces.Principal, meetingID string) (*models.Meeting, *models.WorkspaceMember, error) {
	meeting, err := s.repos.Meetings().GetByID(ctx, meetingID)
	if err != nil {
		return nil, nil, err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, meeting.WorkspaceID)
	if err != nil {
		return nil, nil, err
	}
	return meeting, member, nil
}

func (s *WebRTCService) resolvePermissions(ctx context.Context, meeting models.Meeting, principal interfaces.Principal, member models.WorkspaceMember) (interfaces.JoinTokenPermissions, error) {
	role := "attendee"
	if meeting.CreatedBy == principal.UserID || member.Role == "owner" {
		role = "host"
	} else if member.Role == "admin" {
		role = "moderator"
	}

	if invited, err := s.repos.MeetingParticipants().Get(ctx, meeting.ID, principal.UserID); err == nil {
		if invited.Role != "" {
			role = invited.Role
		}
		if invited.Status == "declined" {
			return interfaces.JoinTokenPermissions{}, utils.ErrForbidden
		}
	}

	perms := interfaces.JoinTokenPermissions{
		Role:                  role,
		CanJoin:               true,
		CanPublishAudio:       role != "viewer",
		CanPublishVideo:       role != "viewer",
		CanPublishScreen:      role == "speaker" || role == "attendee" || role == "moderator" || role == "host",
		CanSubscribe:          true,
		CanModerate:           role == "host" || role == "moderator",
		CanRecord:             role == "host" || role == "moderator",
		CanRemoveParticipants: role == "host" || role == "moderator",
		PublishSources:        []string{"camera", "microphone"},
	}
	if perms.CanPublishScreen {
		perms.PublishSources = append(perms.PublishSources, "screen_share")
	}
	if meeting.Status == "ended" || meeting.Status == "expired" {
		return interfaces.JoinTokenPermissions{}, utils.ErrMeetingStateConflict
	}
	return perms, nil
}

func (s *WebRTCService) upsertWebhookParticipant(ctx context.Context, repos webrtcRepositorySet, session *models.MeetingSession, event *livekit.WebhookEvent, status string, now time.Time) error {
	role := "attendee"
	if item, err := s.repos.MeetingParticipants().Get(ctx, session.MeetingID, event.GetParticipant().GetIdentity()); err == nil && item.Role != "" {
		role = item.Role
	}
	participant := &models.MeetingSessionParticipant{
		Common:           models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		SessionID:        session.ID,
		WorkspaceID:      session.WorkspaceID,
		UserID:           event.GetParticipant().GetIdentity(),
		ProviderIdentity: event.GetParticipant().GetIdentity(),
		Role:             role,
		Status:           status,
		LastSeenAt:       &now,
	}
	if status == "joined" {
		participant.JoinedAt = &now
	} else {
		participant.LeftAt = &now
	}
	return repos.MeetingSessionParticipants().Upsert(ctx, participant)
}

func (s *WebRTCService) publishRealtimeEvent(ctx context.Context, eventType, workspaceID, actorID, meetingID string, payload map[string]any) {
	if s.bus == nil {
		return
	}
	_ = s.bus.Publish(ctx, interfaces.Event{
		ID:          utils.NewID(),
		Topic:       "meeting." + meetingID,
		Type:        eventType,
		WorkspaceID: workspaceID,
		ActorID:     actorID,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Payload:     payload,
	})
}

func providerRoomName(meeting *models.Meeting) string {
	return fmt.Sprintf("workspace-%s-meeting-%s", meeting.WorkspaceID, meeting.ID)
}

func canModerateMeeting(meeting models.Meeting, member models.WorkspaceMember) bool {
	return meeting.CreatedBy == member.UserID || member.Role == "owner" || member.Role == "admin"
}

func isProviderNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "not found") || strings.Contains(msg, "does not exist")
}

func cloneRequestBodyWithLimit(request *http.Request, limit int64) (*http.Request, []byte, error) {
	if request == nil || request.Body == nil {
		return nil, nil, utils.ErrValidationFailed
	}

	body, err := io.ReadAll(io.LimitReader(request.Body, limit+1))
	if err != nil {
		return nil, nil, err
	}
	if int64(len(body)) > limit {
		return nil, nil, utils.ErrValidationFailed
	}
	_ = request.Body.Close()

	cloned := request.Clone(request.Context())
	cloned.Body = io.NopCloser(strings.NewReader(string(body)))
	cloned.ContentLength = int64(len(body))
	return cloned, body, nil
}

func validateWebhookReplayWindow(body []byte, maxAge time.Duration) error {
	var envelope struct {
		CreatedAt int64 `json:"createdAt"`
	}
	if err := json.Unmarshal(body, &envelope); err != nil {
		return utils.ErrValidationFailed
	}
	if envelope.CreatedAt == 0 {
		return nil
	}

	createdAt := time.Unix(envelope.CreatedAt, 0).UTC()
	now := time.Now().UTC()
	if createdAt.After(now.Add(time.Minute)) || now.Sub(createdAt) > maxAge {
		return utils.ErrWebRTCHookUnauthorized
	}
	return nil
}

func maxDuration(left, right time.Duration) time.Duration {
	if left > right {
		return left
	}
	return right
}
