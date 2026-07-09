package services

import (
	"context"
	"encoding/json"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type MeetingService struct {
	db           interfaces.Database
	meetings     interfaces.MeetingRepository
	participants interfaces.MeetingParticipantRepository
	workspaces   *WorkspaceService
	webrtc       *WebRTCService
	outbox       *OutboxService
	producer     interfaces.JobProducer
}

func NewMeetingService(db interfaces.Database, meetings interfaces.MeetingRepository, participants interfaces.MeetingParticipantRepository, workspaces *WorkspaceService, webrtc *WebRTCService, outbox *OutboxService, producer interfaces.JobProducer) *MeetingService {
	return &MeetingService{db: db, meetings: meetings, participants: participants, workspaces: workspaces, webrtc: webrtc, outbox: outbox, producer: producer}
}

func (s *MeetingService) List(ctx context.Context, principal interfaces.Principal, workspaceID string) ([]models.Meeting, error) {
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	return s.meetings.ListByWorkspace(ctx, workspaceID)
}

func (s *MeetingService) Create(ctx context.Context, principal interfaces.Principal, workspaceID, title string, conversationID *string) (*models.Meeting, error) {
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	meeting := &models.Meeting{
		Common:         models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID:    workspaceID,
		ConversationID: conversationID,
		Provider:       s.webrtc.provider.ProviderName(),
		Title:          title,
		Status:         "scheduled",
		CreatedBy:      principal.UserID,
	}
	if err := s.meetings.Create(ctx, meeting); err != nil {
		return nil, err
	}
	_ = s.participants.Upsert(ctx, &models.MeetingParticipant{
		Common:    models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		MeetingID: meeting.ID,
		UserID:    principal.UserID,
		Role:      creatorMeetingRole(member.Role),
		Status:    "accepted",
	})
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, nil, "meeting.created", "meeting", meeting.ID, workspaceID, map[string]any{
			"meetingId":      meeting.ID,
			"workspaceId":    workspaceID,
			"userId":         principal.UserID,
			"title":          title,
			"idempotencyKey": "meeting:" + meeting.ID + ":creator:" + principal.UserID,
		})
	}
	return meeting, nil
}

func (s *MeetingService) Get(ctx context.Context, principal interfaces.Principal, meetingID string) (*models.Meeting, error) {
	meeting, err := s.meetings.GetByID(ctx, meetingID)
	if err != nil {
		return nil, err
	}
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, meeting.WorkspaceID); err != nil {
		return nil, err
	}
	return meeting, nil
}

func (s *MeetingService) Start(ctx context.Context, principal interfaces.Principal, meetingID string) (*MeetingStartResponse, error) {
	return s.webrtc.StartMeeting(ctx, principal, meetingID)
}

func (s *MeetingService) End(ctx context.Context, principal interfaces.Principal, meetingID string) (*MeetingStartResponse, error) {
	return s.webrtc.EndMeeting(ctx, principal, meetingID)
}

func (s *MeetingService) Cancel(ctx context.Context, principal interfaces.Principal, meetingID string) (*models.Meeting, error) {
	meeting, err := s.Get(ctx, principal, meetingID)
	if err != nil {
		return nil, err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, meeting.WorkspaceID)
	if err != nil {
		return nil, err
	}
	if meeting.CreatedBy != principal.UserID && member.Role != "owner" && member.Role != "admin" {
		return nil, utils.ErrForbidden
	}
	if meeting.Status == "cancelled" {
		return meeting, nil
	}
	if meeting.Status == "active" {
		if _, err := s.webrtc.EndMeeting(ctx, principal, meetingID); err != nil && err != utils.ErrMeetingSessionUnavailable {
			return nil, err
		}
	}

	now := time.Now().UTC()
	meeting.Status = "cancelled"
	meeting.EndedAt = &now
	meeting.UpdatedAt = now
	if err := s.meetings.Update(ctx, meeting); err != nil {
		return nil, err
	}
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, nil, "meeting.cancelled", "meeting", meeting.ID, meeting.WorkspaceID, map[string]any{
			"meetingId":   meeting.ID,
			"workspaceId": meeting.WorkspaceID,
		})
	}
	return meeting, nil
}

func (s *MeetingService) JoinToken(ctx context.Context, principal interfaces.Principal, meetingID string) (*interfaces.JoinToken, error) {
	return s.webrtc.JoinToken(ctx, principal, meetingID)
}

func (s *MeetingService) ListParticipants(ctx context.Context, principal interfaces.Principal, meetingID string) ([]models.MeetingSessionParticipant, error) {
	return s.webrtc.ListParticipants(ctx, principal, meetingID)
}

func (s *MeetingService) AddParticipant(ctx context.Context, principal interfaces.Principal, meetingID, userID, role string) (*models.MeetingParticipant, error) {
	meeting, err := s.meetings.GetByID(ctx, meetingID)
	if err != nil {
		return nil, err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, meeting.WorkspaceID)
	if err != nil {
		return nil, err
	}
	if meeting.CreatedBy != principal.UserID && member.Role != "owner" && member.Role != "admin" {
		return nil, utils.ErrForbidden
	}
	if role == "" {
		role = "attendee"
	}

	now := time.Now().UTC()
	item := &models.MeetingParticipant{
		Common:    models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		MeetingID: meetingID,
		UserID:    userID,
		Role:      role,
		Status:    "invited",
	}
	if err := s.participants.Upsert(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *MeetingService) EnqueueDueReminders(ctx context.Context) error {
	if s.producer == nil {
		return nil
	}
	items, err := s.meetings.ListStartingBetween(ctx, time.Now().UTC(), time.Now().UTC().Add(15*time.Minute), 100)
	if err != nil {
		return err
	}
	for _, meeting := range items {
		payload, _ := json.Marshal(map[string]any{
			"meetingId":      meeting.ID,
			"workspaceId":    meeting.WorkspaceID,
			"userId":         meeting.CreatedBy,
			"title":          meeting.Title,
			"idempotencyKey": "meeting-reminder:" + meeting.ID + ":" + meeting.CreatedBy,
		})
		if _, err := s.producer.EnqueueJob(ctx, "notifications", "notification.meeting.reminder", nil, interfaces.JobOptions{
			WorkspaceID: meeting.WorkspaceID,
			Payload:     payload,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (s *MeetingService) ExpireStale(ctx context.Context) error {
	items, err := s.meetings.ListExpiredScheduled(ctx, time.Now().UTC().Add(-24*time.Hour), 100)
	if err != nil {
		return err
	}
	for _, meeting := range items {
		meeting.Status = "expired"
		meeting.UpdatedAt = time.Now().UTC()
		if err := s.meetings.Update(ctx, &meeting); err != nil {
			return err
		}
	}
	return nil
}

func (s *MeetingService) AutoEndAbandoned(ctx context.Context) error {
	items, err := s.meetings.ListAbandonedActive(ctx, time.Now().UTC().Add(-30*time.Minute), 100)
	if err != nil {
		return err
	}
	for _, meeting := range items {
		if _, err := s.webrtc.EndMeeting(ctx, interfaces.Principal{UserID: meeting.CreatedBy}, meeting.ID); err != nil && err != utils.ErrMeetingSessionUnavailable {
			return err
		}
	}
	return nil
}

func creatorMeetingRole(workspaceRole string) string {
	if workspaceRole == "owner" || workspaceRole == "admin" {
		return "host"
	}
	return "attendee"
}
