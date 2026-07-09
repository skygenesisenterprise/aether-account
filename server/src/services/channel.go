package services

import (
	"context"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"gorm.io/gorm"
)

type ChannelService struct {
	db            interfaces.Database
	repos         *Repositories
	workspaces    *WorkspaceService
	conversations interfaces.ConversationRepository
}

func NewChannelService(db interfaces.Database, repos *Repositories, workspaces *WorkspaceService, conversations interfaces.ConversationRepository) *ChannelService {
	return &ChannelService{db: db, repos: repos, workspaces: workspaces, conversations: conversations}
}

func (s *ChannelService) List(ctx context.Context, principal interfaces.Principal, workspaceID string) ([]models.Channel, error) {
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	return s.repos.Channels().ListByWorkspace(ctx, workspaceID)
}

func (s *ChannelService) Create(ctx context.Context, principal interfaces.Principal, workspaceID string, teamID *string, name, slug, description, channelType, visibility string) (*models.Channel, error) {
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) {
		return nil, utils.ErrForbidden
	}
	if !utils.ValidChannelName(name) || !utils.ValidWorkspaceSlug(slug) {
		return nil, utils.ErrValidationFailed
	}
	now := time.Now().UTC()
	channel := &models.Channel{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: workspaceID, TeamID: teamID, Name: strings.TrimSpace(name), Slug: strings.TrimSpace(slug),
		Description: strings.TrimSpace(description), Type: channelType, Visibility: visibility, CreatedBy: principal.UserID,
	}
	conversation := &models.Conversation{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: workspaceID, ChannelID: &channel.ID, Type: "channel", Name: channel.Name, CreatedBy: principal.UserID,
	}
	if err := s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		if err := txRepos.Channels().Create(ctx, channel); err != nil {
			return err
		}
		return txRepos.Conversations().Create(ctx, conversation)
	}); err != nil {
		return nil, err
	}
	return channel, nil
}

func (s *ChannelService) Get(ctx context.Context, principal interfaces.Principal, channelID string) (*models.Channel, error) {
	channel, err := s.repos.Channels().GetByID(ctx, channelID)
	if err != nil {
		return nil, err
	}
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, channel.WorkspaceID); err != nil {
		return nil, err
	}
	return channel, nil
}

func (s *ChannelService) Update(ctx context.Context, principal interfaces.Principal, channelID, name, description, visibility string) (*models.Channel, error) {
	channel, err := s.Get(ctx, principal, channelID)
	if err != nil {
		return nil, err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, channel.WorkspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) {
		return nil, utils.ErrForbidden
	}
	channel.Name = strings.TrimSpace(name)
	channel.Description = strings.TrimSpace(description)
	channel.Visibility = visibility
	channel.UpdatedAt = time.Now().UTC()
	return channel, s.repos.Channels().Update(ctx, channel)
}

func (s *ChannelService) Delete(ctx context.Context, principal interfaces.Principal, channelID string) error {
	channel, err := s.Get(ctx, principal, channelID)
	if err != nil {
		return err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, channel.WorkspaceID)
	if err != nil {
		return err
	}
	if !isAdminRole(member.Role) {
		return utils.ErrForbidden
	}
	return s.repos.Channels().Archive(ctx, channelID, time.Now().UTC())
}
