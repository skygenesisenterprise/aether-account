package services

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type NotificationService struct {
	repo interfaces.NotificationRepository
	bus  interfaces.EventBus
}

type NotificationDTO struct {
	ID             string         `json:"id"`
	WorkspaceID    string         `json:"workspaceId"`
	UserID         string         `json:"userId"`
	Type           string         `json:"type"`
	Title          string         `json:"title"`
	Body           string         `json:"body"`
	ResourceType   string         `json:"resourceType,omitempty"`
	ResourceID     string         `json:"resourceId,omitempty"`
	Metadata       map[string]any `json:"metadata,omitempty"`
	ReadAt         *time.Time     `json:"readAt,omitempty"`
	IdempotencyKey string         `json:"idempotencyKey,omitempty"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
}

func NewNotificationService(repo interfaces.NotificationRepository, bus interfaces.EventBus) *NotificationService {
	return &NotificationService{repo: repo, bus: bus}
}

func (s *NotificationService) Create(ctx context.Context, notification *models.Notification) error {
	if notification.IdempotencyKey != "" {
		existing, err := s.repo.GetByIdempotencyKey(ctx, notification.IdempotencyKey)
		if err == nil && existing != nil && existing.ID != "" {
			return nil
		}
	}
	if err := s.repo.Create(ctx, notification); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil
		}
		return err
	}
	return s.bus.Publish(ctx, interfaces.Event{
		ID:          utils.NewID(),
		Topic:       "workspace." + notification.WorkspaceID,
		Type:        "notification.created",
		WorkspaceID: notification.WorkspaceID,
		ActorID:     notification.UserID,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Payload: map[string]any{
			"notificationId": notification.ID,
			"type":           notification.Type,
			"resourceType":   notification.ResourceType,
			"resourceId":     notification.ResourceID,
		},
	})
}

func (s *NotificationService) List(ctx context.Context, principal interfaces.Principal, cursor string, limit int) ([]NotificationDTO, string, bool, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	var before *time.Time
	var beforeID string
	if strings.TrimSpace(cursor) != "" {
		createdAt, id, err := utils.DecodeCursor(cursor)
		if err != nil {
			return nil, "", false, utils.ErrValidationFailed
		}
		before = &createdAt
		beforeID = id
	}
	items, err := s.repo.ListByUser(ctx, principal.UserID, before, beforeID, limit+1)
	if err != nil {
		return nil, "", false, err
	}
	hasMore := len(items) > limit
	if hasMore {
		items = items[:limit]
	}
	result := make([]NotificationDTO, 0, len(items))
	for _, item := range items {
		result = append(result, toNotificationDTO(item))
	}
	nextCursor := ""
	if hasMore && len(items) > 0 {
		last := items[len(items)-1]
		nextCursor = utils.EncodeCursor(last.CreatedAt, last.ID)
	}
	return result, nextCursor, hasMore, nil
}

func (s *NotificationService) UnreadCount(ctx context.Context, principal interfaces.Principal) (int64, error) {
	return s.repo.CountUnreadByUser(ctx, principal.UserID)
}

func (s *NotificationService) MarkRead(ctx context.Context, principal interfaces.Principal, notificationID string) (bool, error) {
	return s.repo.MarkRead(ctx, principal.UserID, notificationID, time.Now().UTC())
}

func (s *NotificationService) MarkAllRead(ctx context.Context, principal interfaces.Principal) (bool, error) {
	return s.repo.MarkAllRead(ctx, principal.UserID, time.Now().UTC())
}

type messageNotificationPayload struct {
	MessageID      string `json:"messageId"`
	ConversationID string `json:"conversationId"`
	WorkspaceID    string `json:"workspaceId"`
	AuthorID       string `json:"authorId"`
}

func NewNotificationHandlers(logger interfaces.EventBus, messages interfaces.MessageRepository, conversations interfaces.ConversationMemberRepository, notifications *NotificationService, workspaceMembers interfaces.WorkspaceMemberRepository) map[string]interfaces.JobHandler {
	_ = logger
	return map[string]interfaces.JobHandler{
		"notification.message.created": func(ctx context.Context, job models.Job) error {
			var payload messageNotificationPayload
			if err := json.Unmarshal(job.Payload, &payload); err != nil {
				return Permanent(err)
			}
			message, err := messages.GetByID(ctx, payload.MessageID)
			if err != nil {
				return Permanent(err)
			}
			members, err := conversations.ListByConversation(ctx, message.ConversationID)
			if err != nil {
				return Retryable(err)
			}
			if len(members) == 0 {
				workspaceUsers, memberErr := workspaceMembers.ListByWorkspace(ctx, message.WorkspaceID)
				if memberErr != nil {
					return Retryable(memberErr)
				}
				for _, member := range workspaceUsers {
					if member.UserID == message.AuthorID {
						continue
					}
					if err := notifications.Create(ctx, buildMessageNotification(message, member.UserID)); err != nil {
						return Retryable(err)
					}
				}
				return nil
			}
			for _, member := range members {
				if member.UserID == message.AuthorID {
					continue
				}
				if member.MutedUntil != nil && member.MutedUntil.After(time.Now().UTC()) {
					continue
				}
				if err := notifications.Create(ctx, buildMessageNotification(message, member.UserID)); err != nil {
					return Retryable(err)
				}
			}
			return nil
		},
		"notification.meeting.reminder": func(ctx context.Context, job models.Job) error {
			var payload struct {
				MeetingID      string `json:"meetingId"`
				WorkspaceID    string `json:"workspaceId"`
				UserID         string `json:"userId"`
				Title          string `json:"title"`
				IdempotencyKey string `json:"idempotencyKey"`
			}
			if err := json.Unmarshal(job.Payload, &payload); err != nil {
				return Permanent(err)
			}
			now := time.Now().UTC()
			notification := &models.Notification{
				Common:         models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
				WorkspaceID:    payload.WorkspaceID,
				UserID:         payload.UserID,
				Type:           "meeting.reminder",
				Title:          payload.Title,
				Body:           "A meeting is starting soon.",
				ResourceType:   "meeting",
				ResourceID:     payload.MeetingID,
				IdempotencyKey: payload.IdempotencyKey,
			}
			return notifications.Create(ctx, notification)
		},
	}
}

func buildMessageNotification(message *models.Message, userID string) *models.Notification {
	now := time.Now().UTC()
	metadata, _ := json.Marshal(map[string]any{
		"conversationId": message.ConversationID,
		"messageId":      message.ID,
	})
	return &models.Notification{
		Common:         models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID:    message.WorkspaceID,
		UserID:         userID,
		Type:           "message.created",
		Title:          "New message",
		Body:           "A new message was posted in a conversation you can access.",
		ResourceType:   "message",
		ResourceID:     message.ID,
		Metadata:       metadata,
		IdempotencyKey: "message:" + message.ID + ":user:" + userID,
	}
}

func toNotificationDTO(item models.Notification) NotificationDTO {
	var metadata map[string]any
	if len(item.Metadata) > 0 {
		_ = json.Unmarshal(item.Metadata, &metadata)
	}
	return NotificationDTO{
		ID:             item.ID,
		WorkspaceID:    item.WorkspaceID,
		UserID:         item.UserID,
		Type:           item.Type,
		Title:          item.Title,
		Body:           item.Body,
		ResourceType:   item.ResourceType,
		ResourceID:     item.ResourceID,
		Metadata:       metadata,
		ReadAt:         item.ReadAt,
		IdempotencyKey: item.IdempotencyKey,
		CreatedAt:      item.CreatedAt,
		UpdatedAt:      item.UpdatedAt,
	}
}

func isNotFound(err error) bool {
	appErr := utils.AsAppError(err)
	return appErr.Status == 404 || errors.Is(err, utils.ErrMessageNotFound)
}
