package services

import (
	"context"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type AuditService struct {
	audits     interfaces.AuditLogRepository
	workspaces *WorkspaceService
}

func NewAuditService(audits interfaces.AuditLogRepository, workspaces *WorkspaceService) *AuditService {
	return &AuditService{audits: audits, workspaces: workspaces}
}

func (s *AuditService) List(ctx context.Context, principal interfaces.Principal, workspaceID string, limit int) ([]models.AuditLog, error) {
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) {
		return nil, utils.ErrForbidden
	}
	return s.audits.ListByWorkspace(ctx, workspaceID, limit)
}
