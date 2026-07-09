package services

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"gorm.io/gorm"
)

type MessageService struct {
	db            interfaces.Database
	repos         *Repositories
	conversations *ConversationService
	workspaces    *WorkspaceService
	bus           interfaces.EventBus
	outbox        *OutboxService
}

func NewMessageService(db interfaces.Database, repos *Repositories, conversations *ConversationService, workspaces *WorkspaceService, bus interfaces.EventBus, outbox *OutboxService) *MessageService {
	return &MessageService{db: db, repos: repos, conversations: conversations, workspaces: workspaces, bus: bus, outbox: outbox}
}

func (s *MessageService) List(ctx context.Context, principal interfaces.Principal, conversationID, cursor string, limit int) ([]models.Message, string, bool, error) {
	if _, err := s.conversations.Get(ctx, principal, conversationID); err != nil {
		return nil, "", false, err
	}
	return s.repos.Messages().ListByConversation(ctx, conversationID, cursor, limit)
}

func (s *MessageService) Create(ctx context.Context, principal interfaces.Principal, conversationID, messageType, content, idempotencyKey string, metadata map[string]any) (*models.Message, error) {
	conversation, err := s.conversations.Get(ctx, principal, conversationID)
	if err != nil {
		return nil, err
	}
	if !utils.ValidMessageType(messageType) || len(content) > 4000 {
		return nil, utils.ErrValidationFailed
	}
	now := time.Now().UTC()
	payload, _ := json.Marshal(metadata)
	message := &models.Message{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: conversation.WorkspaceID, ConversationID: conversation.ID, AuthorID: principal.UserID,
		Type: messageType, Content: strings.TrimSpace(content), Metadata: payload,
	}

	if idempotencyKey != "" {
		existing, _, _, err := s.repos.Messages().ListByConversation(ctx, conversationID, "", 50)
		if err == nil {
			for _, candidate := range existing {
				var meta map[string]any
				_ = json.Unmarshal(candidate.Metadata, &meta)
				if meta["idempotencyKey"] == idempotencyKey && candidate.AuthorID == principal.UserID {
					return &candidate, nil
				}
			}
		}
	}

	if err := s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		if err := txRepos.Messages().Create(ctx, message); err != nil {
			return err
		}
		auditPayload, _ := json.Marshal(map[string]any{"messageType": messageType})
		audit := &models.AuditLog{
			Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			WorkspaceID: conversation.WorkspaceID, ActorID: principal.UserID, Action: "message.create",
			ResourceType: "message", ResourceID: message.ID, Metadata: auditPayload,
		}
		if err := txRepos.AuditLogs().Create(ctx, audit); err != nil {
			return err
		}
		if s.outbox != nil {
			return s.outbox.Add(ctx, txRepos.OutboxEvents(), "message.created", "message", message.ID, conversation.WorkspaceID, map[string]any{
				"messageId":      message.ID,
				"conversationId": conversation.ID,
				"workspaceId":    conversation.WorkspaceID,
				"authorId":       principal.UserID,
			})
		}
		return nil
	}); err != nil {
		return nil, err
	}

	_ = s.bus.Publish(ctx, interfaces.Event{
		ID:             utils.NewID(),
		Topic:          "workspace." + conversation.WorkspaceID,
		Type:           "message.created",
		WorkspaceID:    conversation.WorkspaceID,
		ConversationID: conversation.ID,
		ActorID:        principal.UserID,
		Timestamp:      now.Format(time.RFC3339),
		Payload: map[string]any{
			"messageId": message.ID,
		},
	})
	return message, nil
}

func (s *MessageService) Get(ctx context.Context, principal interfaces.Principal, messageID string) (*models.Message, error) {
	message, err := s.repos.Messages().GetByID(ctx, messageID)
	if err != nil {
		return nil, err
	}
	if _, err := s.conversations.Get(ctx, principal, message.ConversationID); err != nil {
		return nil, err
	}
	return message, nil
}

func (s *MessageService) Update(ctx context.Context, principal interfaces.Principal, messageID, content string) (*models.Message, error) {
	message, err := s.Get(ctx, principal, messageID)
	if err != nil {
		return nil, err
	}
	if message.AuthorID != principal.UserID {
		return nil, utils.ErrMessageEditForbidden
	}
	now := time.Now().UTC()
	message.Content = strings.TrimSpace(content)
	message.EditedAt = &now
	message.UpdatedAt = now
	if err := s.repos.Messages().Update(ctx, message); err != nil {
		return nil, err
	}
	_ = s.bus.Publish(ctx, interfaces.Event{
		ID:             utils.NewID(),
		Topic:          "workspace." + message.WorkspaceID,
		Type:           "message.updated",
		WorkspaceID:    message.WorkspaceID,
		ConversationID: message.ConversationID,
		ActorID:        principal.UserID,
		Timestamp:      now.Format(time.RFC3339),
		Payload:        map[string]any{"messageId": message.ID},
	})
	return message, nil
}

func (s *MessageService) Delete(ctx context.Context, principal interfaces.Principal, messageID string) error {
	message, err := s.Get(ctx, principal, messageID)
	if err != nil {
		return err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, message.WorkspaceID)
	if err != nil {
		return err
	}
	if message.AuthorID != principal.UserID && !isAdminRole(member.Role) {
		return utils.ErrMessageDeleteForbidden
	}
	now := time.Now().UTC()
	if err := s.repos.Messages().SoftDelete(ctx, messageID, now); err != nil {
		return err
	}
	_ = s.bus.Publish(ctx, interfaces.Event{
		ID:             utils.NewID(),
		Topic:          "workspace." + message.WorkspaceID,
		Type:           "message.deleted",
		WorkspaceID:    message.WorkspaceID,
		ConversationID: message.ConversationID,
		ActorID:        principal.UserID,
		Timestamp:      now.Format(time.RFC3339),
		Payload:        map[string]any{"messageId": message.ID},
	})
	return nil
}

func (s *MessageService) AddReaction(ctx context.Context, principal interfaces.Principal, messageID, emoji string) (*models.Reaction, error) {
	message, err := s.Get(ctx, principal, messageID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	reaction := &models.Reaction{
		Common:    models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		MessageID: message.ID, UserID: principal.UserID, Emoji: emoji,
	}
	if err := s.repos.Reactions().Create(ctx, reaction); err != nil {
		return nil, err
	}
	_ = s.bus.Publish(ctx, interfaces.Event{
		ID:             utils.NewID(),
		Topic:          "workspace." + message.WorkspaceID,
		Type:           "reaction.added",
		WorkspaceID:    message.WorkspaceID,
		ConversationID: message.ConversationID,
		ActorID:        principal.UserID,
		Timestamp:      now.Format(time.RFC3339),
		Payload:        map[string]any{"messageId": message.ID, "emoji": emoji},
	})
	return reaction, nil
}

func (s *MessageService) RemoveReaction(ctx context.Context, principal interfaces.Principal, messageID, emoji string) error {
	message, err := s.Get(ctx, principal, messageID)
	if err != nil {
		return err
	}
	if err := s.repos.Reactions().Delete(ctx, messageID, principal.UserID, emoji); err != nil {
		return err
	}
	_ = s.bus.Publish(ctx, interfaces.Event{
		ID:             utils.NewID(),
		Topic:          "workspace." + message.WorkspaceID,
		Type:           "reaction.removed",
		WorkspaceID:    message.WorkspaceID,
		ConversationID: message.ConversationID,
		ActorID:        principal.UserID,
		Timestamp:      time.Now().UTC().Format(time.RFC3339),
		Payload:        map[string]any{"messageId": message.ID, "emoji": emoji},
	})
	return nil
}

func (s *MessageService) MarkRead(ctx context.Context, principal interfaces.Principal, conversationID, messageID string) error {
	conversation, err := s.conversations.Get(ctx, principal, conversationID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	receipt := &models.ReadReceipt{
		Common:         models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		ConversationID: conversation.ID, MessageID: messageID, UserID: principal.UserID, ReadAt: now,
	}
	if err := s.repos.ReadReceipts().Upsert(ctx, receipt); err != nil {
		return err
	}
	_ = s.bus.Publish(ctx, interfaces.Event{
		ID:             utils.NewID(),
		Topic:          "workspace." + conversation.WorkspaceID,
		Type:           "read.updated",
		WorkspaceID:    conversation.WorkspaceID,
		ConversationID: conversation.ID,
		ActorID:        principal.UserID,
		Timestamp:      now.Format(time.RFC3339),
		Payload:        map[string]any{"messageId": messageID},
	})
	return nil
}
