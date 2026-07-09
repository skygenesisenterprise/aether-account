package services

import (
	"context"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type ConversationService struct {
	conversations interfaces.ConversationRepository
	members       interfaces.ConversationMemberRepository
	workspaces    *WorkspaceService
	bus           interfaces.EventBus
}

type ConversationDTO struct {
	models.Conversation
	MemberIDs    []string                     `json:"memberIds,omitempty"`
	Participants []ConversationParticipantDTO `json:"participants,omitempty"`
}

type ConversationParticipantDTO struct {
	UserID         string `json:"userId"`
	DisplayName    string `json:"displayName"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	Status         string `json:"status"`
	PresenceStatus string `json:"presenceStatus"`
}

func NewConversationService(conversations interfaces.ConversationRepository, members interfaces.ConversationMemberRepository, workspaces *WorkspaceService, bus interfaces.EventBus) *ConversationService {
	return &ConversationService{conversations: conversations, members: members, workspaces: workspaces, bus: bus}
}

func (s *ConversationService) List(ctx context.Context, principal interfaces.Principal, workspaceID string) ([]models.Conversation, error) {
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	return s.conversations.ListByWorkspace(ctx, workspaceID)
}

func (s *ConversationService) ListWithMembers(ctx context.Context, principal interfaces.Principal, workspaceID string) ([]ConversationDTO, error) {
	items, err := s.List(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}

	dtos := make([]ConversationDTO, 0, len(items))
	for _, item := range items {
		if !s.canAccessConversation(ctx, principal, item) {
			continue
		}

		dto, err := s.toDTO(ctx, item)
		if err != nil {
			return nil, err
		}
		dtos = append(dtos, dto)
	}

	return dtos, nil
}

func (s *ConversationService) Create(ctx context.Context, principal interfaces.Principal, workspaceID, conversationType, name string, memberIDs []string) (*models.Conversation, error) {
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	if conversationType == "dm" {
		hasOtherMember := false
		for _, userID := range memberIDs {
			if strings.TrimSpace(userID) != "" && userID != principal.UserID {
				hasOtherMember = true
				break
			}
		}
		if !hasOtherMember {
			return nil, utils.ErrValidationFailed
		}
	}
	now := time.Now().UTC()
	item := &models.Conversation{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: workspaceID, Type: conversationType, Name: strings.TrimSpace(name), CreatedBy: principal.UserID,
	}
	if err := s.conversations.Create(ctx, item); err != nil {
		return nil, err
	}
	allMembers := append([]string{principal.UserID}, memberIDs...)
	seen := map[string]struct{}{}
	for _, userID := range allMembers {
		if _, ok := seen[userID]; ok || userID == "" {
			continue
		}
		if userID != principal.UserID {
			if _, err := s.workspaces.repos.WorkspaceMembers().Get(ctx, workspaceID, userID); err != nil {
				return nil, utils.ErrMembershipRequired
			}
		}
		seen[userID] = struct{}{}
		member := &models.ConversationMember{
			Common:         models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			ConversationID: item.ID, UserID: userID, Role: "member", JoinedAt: now,
		}
		if err := s.members.Create(ctx, member); err != nil {
			return nil, err
		}
	}
	return item, nil
}

func (s *ConversationService) CreateWithMembers(ctx context.Context, principal interfaces.Principal, workspaceID, conversationType, name string, memberIDs []string) (*ConversationDTO, error) {
	item, err := s.Create(ctx, principal, workspaceID, conversationType, name, memberIDs)
	if err != nil {
		return nil, err
	}

	dto, err := s.toDTO(ctx, *item)
	if err != nil {
		return nil, err
	}

	if s.bus != nil {
		_ = s.bus.Publish(ctx, interfaces.Event{
			ID:             utils.NewID(),
			Topic:          "workspace." + item.WorkspaceID,
			Type:           "conversation.created",
			WorkspaceID:    item.WorkspaceID,
			ConversationID: item.ID,
			ActorID:        principal.UserID,
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
			Payload: map[string]any{
				"conversationId": item.ID,
				"memberIds":      dto.MemberIDs,
			},
		})
	}

	return &dto, nil
}

func (s *ConversationService) Get(ctx context.Context, principal interfaces.Principal, conversationID string) (*models.Conversation, error) {
	item, err := s.conversations.GetByID(ctx, conversationID)
	if err != nil {
		return nil, err
	}
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, item.WorkspaceID); err != nil {
		return nil, err
	}
	if !s.canAccessConversation(ctx, principal, *item) {
		return nil, utils.ErrMembershipRequired
	}
	return item, nil
}

func (s *ConversationService) GetWithMembers(ctx context.Context, principal interfaces.Principal, conversationID string) (*ConversationDTO, error) {
	item, err := s.Get(ctx, principal, conversationID)
	if err != nil {
		return nil, err
	}

	dto, err := s.toDTO(ctx, *item)
	if err != nil {
		return nil, err
	}

	return &dto, nil
}

func (s *ConversationService) Update(ctx context.Context, principal interfaces.Principal, conversationID, name string) (*models.Conversation, error) {
	item, err := s.Get(ctx, principal, conversationID)
	if err != nil {
		return nil, err
	}
	item.Name = strings.TrimSpace(name)
	item.UpdatedAt = time.Now().UTC()
	return item, s.conversations.Update(ctx, item)
}

func (s *ConversationService) UpdateWithMembers(ctx context.Context, principal interfaces.Principal, conversationID, name string) (*ConversationDTO, error) {
	item, err := s.Update(ctx, principal, conversationID, name)
	if err != nil {
		return nil, err
	}

	dto, err := s.toDTO(ctx, *item)
	if err != nil {
		return nil, err
	}

	if s.bus != nil {
		_ = s.bus.Publish(ctx, interfaces.Event{
			ID:             utils.NewID(),
			Topic:          "workspace." + item.WorkspaceID,
			Type:           "conversation.updated",
			WorkspaceID:    item.WorkspaceID,
			ConversationID: item.ID,
			ActorID:        principal.UserID,
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
			Payload:        map[string]any{"conversationId": item.ID},
		})
	}

	return &dto, nil
}

func (s *ConversationService) Delete(ctx context.Context, principal interfaces.Principal, conversationID string) error {
	item, err := s.Get(ctx, principal, conversationID)
	if err != nil {
		return err
	}
	if err := s.members.Delete(ctx, item.ID, principal.UserID); err != nil {
		return err
	}
	members, err := s.members.ListByConversation(ctx, item.ID)
	if err != nil {
		return err
	}
	eventType := "conversation.left"
	if len(members) == 0 {
		if err := s.conversations.Archive(ctx, item.ID, time.Now().UTC()); err != nil {
			return err
		}
		eventType = "conversation.deleted"
	}
	if s.bus != nil {
		_ = s.bus.Publish(ctx, interfaces.Event{
			ID:             utils.NewID(),
			Topic:          "workspace." + item.WorkspaceID,
			Type:           eventType,
			WorkspaceID:    item.WorkspaceID,
			ConversationID: item.ID,
			ActorID:        principal.UserID,
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
			Payload:        map[string]any{"conversationId": item.ID},
		})
	}
	return nil
}

func (s *ConversationService) toDTO(ctx context.Context, item models.Conversation) (ConversationDTO, error) {
	dto := ConversationDTO{Conversation: item}

	members, err := s.members.ListByConversation(ctx, item.ID)
	if err != nil {
		return ConversationDTO{}, err
	}

	dto.MemberIDs = make([]string, 0, len(members))
	dto.Participants = make([]ConversationParticipantDTO, 0, len(members))
	for _, member := range members {
		dto.MemberIDs = append(dto.MemberIDs, member.UserID)
		user, err := s.workspaces.users.GetByID(ctx, member.UserID)
		if err != nil {
			dto.Participants = append(dto.Participants, ConversationParticipantDTO{
				UserID: member.UserID,
				Role:   member.Role,
			})
			continue
		}
		dto.Participants = append(dto.Participants, ConversationParticipantDTO{
			UserID:         member.UserID,
			DisplayName:    user.DisplayName,
			Email:          user.Email,
			Role:           member.Role,
			Status:         user.Status,
			PresenceStatus: user.PresenceStatus,
		})
	}

	return dto, nil
}

func (s *ConversationService) canAccessConversation(ctx context.Context, principal interfaces.Principal, item models.Conversation) bool {
	if item.CreatedBy == principal.UserID {
		return true
	}

	_, err := s.members.Get(ctx, item.ID, principal.UserID)
	return err == nil
}
