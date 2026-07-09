package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
)

type ProjectDTO struct {
	ID          string  `json:"id"`
	WorkspaceID string  `json:"workspaceId"`
	Name        string  `json:"name"`
	Summary     string  `json:"summary,omitempty"`
	Status      string  `json:"status"`
	Progress    int     `json:"progress"`
	Cadence     string  `json:"cadence,omitempty"`
	OwnerUserID *string `json:"ownerUserId,omitempty"`
	OwnerName   string  `json:"ownerName,omitempty"`
	CreatedBy   string  `json:"createdBy"`
}

type ProjectService struct {
	projects   interfaces.ProjectRepository
	users      interfaces.UserRepository
	workspaces *WorkspaceService
}

func NewProjectService(projects interfaces.ProjectRepository, users interfaces.UserRepository, workspaces *WorkspaceService) *ProjectService {
	return &ProjectService{projects: projects, users: users, workspaces: workspaces}
}

func (s *ProjectService) List(ctx context.Context, principal interfaces.Principal, workspaceID string) ([]ProjectDTO, error) {
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	items, err := s.projects.ListByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	result := make([]ProjectDTO, 0, len(items))
	for _, item := range items {
		result = append(result, s.toProjectDTO(ctx, item))
	}
	return result, nil
}

func (s *ProjectService) toProjectDTO(ctx context.Context, item models.Project) ProjectDTO {
	ownerName := ""
	if item.OwnerUserID != nil && *item.OwnerUserID != "" {
		user, err := s.users.GetByID(ctx, *item.OwnerUserID)
		if err == nil {
			ownerName = user.DisplayName
		}
	}
	return ProjectDTO{
		ID:          item.ID,
		WorkspaceID: item.WorkspaceID,
		Name:        item.Name,
		Summary:     item.Summary,
		Status:      item.Status,
		Progress:    item.Progress,
		Cadence:     item.Cadence,
		OwnerUserID: item.OwnerUserID,
		OwnerName:   ownerName,
		CreatedBy:   item.CreatedBy,
	}
}

