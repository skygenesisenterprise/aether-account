package services

import (
	"context"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type TeamService struct {
	teams      interfaces.TeamRepository
	workspaces *WorkspaceService
}

func NewTeamService(teams interfaces.TeamRepository, workspaces *WorkspaceService) *TeamService {
	return &TeamService{teams: teams, workspaces: workspaces}
}

func (s *TeamService) List(ctx context.Context, principal interfaces.Principal, workspaceID string) ([]models.Team, error) {
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	return s.teams.ListByWorkspace(ctx, workspaceID)
}

func (s *TeamService) Create(ctx context.Context, principal interfaces.Principal, workspaceID, name, description string) (*models.Team, error) {
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) {
		return nil, utils.ErrForbidden
	}
	now := time.Now().UTC()
	item := &models.Team{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: workspaceID, Name: strings.TrimSpace(name), Description: strings.TrimSpace(description), CreatedBy: principal.UserID,
	}
	return item, s.teams.Create(ctx, item)
}

func (s *TeamService) Get(ctx context.Context, principal interfaces.Principal, teamID string) (*models.Team, error) {
	team, err := s.teams.GetByID(ctx, teamID)
	if err != nil {
		return nil, err
	}
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, team.WorkspaceID); err != nil {
		return nil, err
	}
	return team, nil
}

func (s *TeamService) Update(ctx context.Context, principal interfaces.Principal, teamID, name, description string) (*models.Team, error) {
	team, err := s.Get(ctx, principal, teamID)
	if err != nil {
		return nil, err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, team.WorkspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) {
		return nil, utils.ErrForbidden
	}
	team.Name = strings.TrimSpace(name)
	team.Description = strings.TrimSpace(description)
	team.UpdatedAt = time.Now().UTC()
	return team, s.teams.Update(ctx, team)
}

func (s *TeamService) Delete(ctx context.Context, principal interfaces.Principal, teamID string) error {
	team, err := s.Get(ctx, principal, teamID)
	if err != nil {
		return err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, team.WorkspaceID)
	if err != nil {
		return err
	}
	if !isAdminRole(member.Role) {
		return utils.ErrForbidden
	}
	return s.teams.Archive(ctx, teamID, time.Now().UTC())
}
