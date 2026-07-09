package services

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"gorm.io/gorm"
)

type WorkspaceService struct {
	db       interfaces.Database
	auth     config.AuthConfig
	users    interfaces.UserRepository
	repos    *Repositories
	audits   interfaces.AuditLogRepository
	outbox   *OutboxService
	presence *PresenceService
}

type WorkspaceMemberDTO struct {
	ID             string     `json:"id"`
	WorkspaceID    string     `json:"workspaceId"`
	UserID         string     `json:"userId"`
	Role           string     `json:"role"`
	JoinedAt       time.Time  `json:"joinedAt"`
	LastSeenAt     *time.Time `json:"lastSeenAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	DisplayName    string     `json:"displayName"`
	Email          string     `json:"email"`
	AvatarURL      *string    `json:"avatarUrl,omitempty"`
	Status         string     `json:"status"`
	PresenceStatus string     `json:"presenceStatus"`
}

type ProvisionWorkspaceUserInput struct {
	Email             string
	DisplayName       string
	Role              string
	TemporaryPassword string
}

type WorkspaceSSOConfigDTO struct {
	ID                     string            `json:"id"`
	WorkspaceID            string            `json:"workspaceId"`
	Provider               string            `json:"provider"`
	Enabled                bool              `json:"enabled"`
	EnforceSSO             bool              `json:"enforceSso"`
	AllowPasswordAuth      bool              `json:"allowPasswordAuth"`
	AllowAutoProvision     bool              `json:"allowAutoProvision"`
	AllowIDPInitiated      bool              `json:"allowIdpInitiated"`
	DomainHint             string            `json:"domainHint,omitempty"`
	IssuerURL              string            `json:"issuerUrl,omitempty"`
	SSOURL                 string            `json:"ssoUrl,omitempty"`
	EntityID               string            `json:"entityId,omitempty"`
	ClientID               string            `json:"clientId,omitempty"`
	ClientSecretConfigured bool              `json:"clientSecretConfigured"`
	Certificate            string            `json:"certificate,omitempty"`
	AllowedDomains         []string          `json:"allowedDomains"`
	DefaultRole            string            `json:"defaultRole"`
	AttributeMapping       map[string]string `json:"attributeMapping"`
	CreatedAt              time.Time         `json:"createdAt"`
	UpdatedAt              time.Time         `json:"updatedAt"`
}

type UpdateWorkspaceSSOInput struct {
	Provider           string
	Enabled            bool
	EnforceSSO         bool
	AllowPasswordAuth  bool
	AllowAutoProvision bool
	AllowIDPInitiated  bool
	DomainHint         string
	IssuerURL          string
	SSOURL             string
	EntityID           string
	ClientID           string
	ClientSecret       *string
	ClearClientSecret  bool
	Certificate        string
	AllowedDomains     []string
	DefaultRole        string
	AttributeMapping   map[string]string
}

func NewWorkspaceService(
	db interfaces.Database,
	auth config.AuthConfig,
	users interfaces.UserRepository,
	repos *Repositories,
	audits interfaces.AuditLogRepository,
	outbox *OutboxService,
	presence *PresenceService,
) *WorkspaceService {
	return &WorkspaceService{db: db, auth: auth, users: users, repos: repos, audits: audits, outbox: outbox, presence: presence}
}

func (s *WorkspaceService) List(ctx context.Context, principal interfaces.Principal) ([]models.Workspace, error) {
	return s.repos.Workspaces().ListByUser(ctx, principal.UserID)
}

func (s *WorkspaceService) Get(ctx context.Context, principal interfaces.Principal, workspaceID string) (*models.Workspace, error) {
	if _, err := s.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	return s.repos.Workspaces().GetByID(ctx, workspaceID)
}

func (s *WorkspaceService) Create(ctx context.Context, principal interfaces.Principal, name, slug, description string) (*models.Workspace, error) {
	if !utils.ValidWorkspaceSlug(slug) {
		return nil, utils.NewError(400, "VALIDATION_FAILED", "Workspace slug is invalid.", map[string]any{"field": "slug"})
	}
	now := time.Now().UTC()
	workspace := &models.Workspace{
		Common: models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		Name:   strings.TrimSpace(name), Slug: strings.TrimSpace(slug), Description: strings.TrimSpace(description),
		Visibility: "private", OwnerID: principal.UserID,
	}
	member := &models.WorkspaceMember{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: workspace.ID, UserID: principal.UserID, Role: "owner", JoinedAt: now,
	}
	if err := s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		if err := txRepos.Workspaces().Create(ctx, workspace); err != nil {
			return err
		}
		return txRepos.WorkspaceMembers().Create(ctx, member)
	}); err != nil {
		return nil, err
	}
	return workspace, nil
}

func (s *WorkspaceService) Update(ctx context.Context, principal interfaces.Principal, workspaceID, name, description string) (*models.Workspace, error) {
	member, err := s.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) {
		return nil, utils.ErrForbidden
	}
	workspace, err := s.repos.Workspaces().GetByID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	if name != "" {
		workspace.Name = strings.TrimSpace(name)
	}
	workspace.Description = strings.TrimSpace(description)
	workspace.UpdatedAt = time.Now().UTC()
	return workspace, s.repos.Workspaces().Update(ctx, workspace)
}

func (s *WorkspaceService) Archive(ctx context.Context, principal interfaces.Principal, workspaceID string) error {
	member, err := s.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return err
	}
	if member.Role != "owner" {
		return utils.ErrForbidden
	}
	return s.repos.Workspaces().Archive(ctx, workspaceID, time.Now().UTC())
}

func (s *WorkspaceService) GetSSOConfig(ctx context.Context, principal interfaces.Principal, workspaceID string) (*WorkspaceSSOConfigDTO, error) {
	member, err := s.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) {
		return nil, utils.ErrForbidden
	}
	config, err := s.repos.WorkspaceSSOConfigs().GetByWorkspaceID(ctx, workspaceID)
	if err != nil {
		if utils.AsAppError(err).Code == "WORKSPACE_SSO_NOT_FOUND" {
			return defaultWorkspaceSSOConfig(workspaceID), nil
		}
		return nil, err
	}
	return toWorkspaceSSOConfigDTO(config), nil
}

func (s *WorkspaceService) UpdateSSOConfig(ctx context.Context, principal interfaces.Principal, workspaceID string, input UpdateWorkspaceSSOInput, meta RequestMetadata) (*WorkspaceSSOConfigDTO, error) {
	member, err := s.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) {
		return nil, utils.ErrForbidden
	}
	if input.Provider != "oidc" && input.Provider != "saml" {
		return nil, utils.ErrValidationFailed
	}
	if !roleAllowed(input.DefaultRole) || input.DefaultRole == "owner" {
		return nil, utils.ErrValidationFailed
	}
	now := time.Now().UTC()
	current, err := s.repos.WorkspaceSSOConfigs().GetByWorkspaceID(ctx, workspaceID)
	if err != nil && utils.AsAppError(err).Code != "WORKSPACE_SSO_NOT_FOUND" {
		return nil, err
	}
	if current == nil || current.WorkspaceID == "" {
		current = &models.WorkspaceSSOConfig{
			Common:             models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			WorkspaceID:        workspaceID,
			AllowPasswordAuth:  true,
			AllowAutoProvision: true,
			Provider:           "oidc",
			DefaultRole:        "member",
		}
	}

	current.Provider = input.Provider
	current.Enabled = input.Enabled
	current.EnforceSSO = input.EnforceSSO
	current.AllowPasswordAuth = input.AllowPasswordAuth
	current.AllowAutoProvision = input.AllowAutoProvision
	current.AllowIDPInitiated = input.AllowIDPInitiated
	current.DomainHint = strings.TrimSpace(input.DomainHint)
	current.IssuerURL = strings.TrimSpace(input.IssuerURL)
	current.SSOURL = strings.TrimSpace(input.SSOURL)
	current.EntityID = strings.TrimSpace(input.EntityID)
	current.ClientID = strings.TrimSpace(input.ClientID)
	current.Certificate = strings.TrimSpace(input.Certificate)
	current.DefaultRole = input.DefaultRole
	current.UpdatedAt = now

	if input.ClearClientSecret {
		current.ClientSecret = ""
	} else if input.ClientSecret != nil {
		current.ClientSecret = strings.TrimSpace(*input.ClientSecret)
	}

	allowedDomainsJSON, err := json.Marshal(normalizeDomainList(input.AllowedDomains))
	if err != nil {
		return nil, utils.ErrValidationFailed
	}
	attributeMappingJSON, err := json.Marshal(normalizeAttributeMapping(input.AttributeMapping))
	if err != nil {
		return nil, utils.ErrValidationFailed
	}
	current.AllowedDomains = allowedDomainsJSON
	current.AttributeMapping = attributeMappingJSON

	if err := s.repos.WorkspaceSSOConfigs().Upsert(ctx, current); err != nil {
		return nil, err
	}

	metadata, _ := json.Marshal(map[string]any{
		"provider":           current.Provider,
		"enabled":            current.Enabled,
		"enforceSso":         current.EnforceSSO,
		"allowPasswordAuth":  current.AllowPasswordAuth,
		"allowAutoProvision": current.AllowAutoProvision,
		"defaultRole":        current.DefaultRole,
		"allowedDomains":     normalizeDomainList(input.AllowedDomains),
	})
	_ = s.audits.Create(ctx, &models.AuditLog{
		Common:       models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID:  workspaceID,
		ActorID:      principal.UserID,
		Action:       "workspace.sso.updated",
		ResourceType: "workspace_sso_config",
		ResourceID:   current.ID,
		Metadata:     metadata,
		IPAddress:    meta.IPAddress,
		UserAgent:    meta.UserAgent,
	})

	return toWorkspaceSSOConfigDTO(current), nil
}

func (s *WorkspaceService) ListMembers(ctx context.Context, principal interfaces.Principal, workspaceID string) ([]WorkspaceMemberDTO, error) {
	if _, err := s.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	items, err := s.repos.WorkspaceMembers().ListByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	workspace, err := s.repos.Workspaces().GetByID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	hasOwner := false
	for _, item := range items {
		if item.UserID == workspace.OwnerID {
			hasOwner = true
			break
		}
	}
	if !hasOwner {
		items = append(items, models.WorkspaceMember{
			Common:      models.Common{CreatedAt: workspace.CreatedAt, UpdatedAt: workspace.UpdatedAt},
			WorkspaceID: workspace.ID,
			UserID:      workspace.OwnerID,
			Role:        "owner",
			JoinedAt:    workspace.CreatedAt,
		})
	}
	return s.toWorkspaceMemberDTOs(ctx, items)
}

func (s *WorkspaceService) AddMember(ctx context.Context, principal interfaces.Principal, workspaceID, userID, email, role string) (*WorkspaceMemberDTO, error) {
	member, err := s.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if err := validateRoleAssignment(member.Role, role); err != nil {
		return nil, utils.ErrForbidden
	}
	resolvedUserID := strings.TrimSpace(userID)
	if resolvedUserID == "" {
		_, normalized := normalizeEmail(email)
		if normalized == "" {
			return nil, utils.ErrValidationFailed
		}
		user, getErr := s.users.GetByEmail(ctx, normalized)
		if getErr != nil {
			return nil, getErr
		}
		resolvedUserID = user.ID
	}
	if _, err := s.repos.WorkspaceMembers().Get(ctx, workspaceID, resolvedUserID); err == nil {
		return nil, utils.NewError(http.StatusConflict, "WORKSPACE_MEMBER_EXISTS", "This user is already a member of the workspace.", nil)
	}
	user, err := s.users.GetByID(ctx, resolvedUserID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	item := &models.WorkspaceMember{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: workspaceID, UserID: resolvedUserID, Role: role, JoinedAt: now,
	}
	if err := s.repos.WorkspaceMembers().Create(ctx, item); err != nil {
		return nil, err
	}
	return toWorkspaceMemberDTO(item, user), nil
}

func (s *WorkspaceService) UpdateMember(ctx context.Context, principal interfaces.Principal, workspaceID, userID, role string) (*WorkspaceMemberDTO, error) {
	member, err := s.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if err := validateRoleAssignment(member.Role, role); err != nil {
		return nil, utils.ErrForbidden
	}
	target, err := s.repos.WorkspaceMembers().Get(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if err := s.guardOwnerMutation(ctx, principal.UserID, member.Role, target, role, false); err != nil {
		return nil, err
	}
	target.Role = role
	target.UpdatedAt = time.Now().UTC()
	if err := s.repos.WorkspaceMembers().Update(ctx, target); err != nil {
		return nil, err
	}
	user, err := s.users.GetByID(ctx, target.UserID)
	if err != nil {
		return nil, err
	}
	return toWorkspaceMemberDTO(target, user), nil
}

func (s *WorkspaceService) RemoveMember(ctx context.Context, principal interfaces.Principal, workspaceID, userID string) error {
	member, err := s.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return err
	}
	if !isAdminRole(member.Role) {
		return utils.ErrForbidden
	}
	target, err := s.repos.WorkspaceMembers().Get(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if err := s.guardOwnerMutation(ctx, principal.UserID, member.Role, target, "", true); err != nil {
		return err
	}
	return s.repos.WorkspaceMembers().Delete(ctx, workspaceID, userID)
}

func (s *WorkspaceService) ProvisionWorkspaceUser(
	ctx context.Context,
	principal interfaces.Principal,
	workspaceID string,
	input ProvisionWorkspaceUserInput,
	meta RequestMetadata,
) (*WorkspaceMemberDTO, error) {
	member, err := s.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if err := validateRoleAssignment(member.Role, input.Role); err != nil {
		return nil, utils.ErrForbidden
	}

	email, normalized := normalizeEmail(input.Email)
	if normalized == "" || !roleAllowed(input.Role) {
		return nil, utils.ErrValidationFailed
	}

	existingUser, err := s.users.GetByEmail(ctx, normalized)
	if err != nil && utils.AsAppError(err).Code != "USER_NOT_FOUND" {
		return nil, err
	}

	var createdUser bool
	var createdMember *models.WorkspaceMember
	err = s.db.Transaction(ctx, func(tx *gorm.DB) error {
		txRepos := s.repos.WithDB(tx)
		targetUser := existingUser

		if targetUser == nil || targetUser.ID == "" {
			if strings.TrimSpace(input.DisplayName) == "" || len(strings.TrimSpace(input.TemporaryPassword)) < s.auth.PasswordMinLength {
				return utils.ErrValidationFailed
			}
			passwordHash, hashErr := NewPasswordHasher(s.auth).Hash(input.TemporaryPassword)
			if hashErr != nil {
				return utils.ErrValidationFailed
			}
			now := time.Now().UTC()
			targetUser = &models.User{
				Common:          models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
				Email:           email,
				EmailNormalized: normalized,
				DisplayName:     strings.TrimSpace(input.DisplayName),
				Status:          "active",
				PresenceStatus:  "offline",
			}
			if err := txRepos.Users().Create(ctx, targetUser); err != nil {
				return err
			}
			if err := txRepos.LocalCredentials().Create(ctx, &models.LocalCredential{
				Common:            models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
				UserID:            targetUser.ID,
				PasswordHash:      passwordHash,
				PasswordAlgorithm: "argon2id",
			}); err != nil {
				return err
			}
			createdUser = true
		}

		if _, err := txRepos.WorkspaceMembers().Get(ctx, workspaceID, targetUser.ID); err == nil {
			return utils.NewError(http.StatusConflict, "WORKSPACE_MEMBER_EXISTS", "This user is already a member of the workspace.", nil)
		}

		now := time.Now().UTC()
		createdMember = &models.WorkspaceMember{
			Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			WorkspaceID: workspaceID,
			UserID:      targetUser.ID,
			Role:        input.Role,
			JoinedAt:    now,
		}
		if err := txRepos.WorkspaceMembers().Create(ctx, createdMember); err != nil {
			return err
		}

		metadata, _ := json.Marshal(map[string]any{
			"email":       email,
			"role":        input.Role,
			"createdUser": createdUser,
		})
		if err := txRepos.AuditLogs().Create(ctx, &models.AuditLog{
			Common:       models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
			WorkspaceID:  workspaceID,
			ActorID:      principal.UserID,
			Action:       "workspace.user.provisioned",
			ResourceType: "user",
			ResourceID:   targetUser.ID,
			Metadata:     metadata,
			IPAddress:    meta.IPAddress,
			UserAgent:    meta.UserAgent,
		}); err != nil {
			return err
		}
		if s.outbox != nil {
			if err := s.outbox.Add(ctx, txRepos.OutboxEvents(), "workspace.user.provisioned", "user", targetUser.ID, workspaceID, map[string]any{
				"userId":      targetUser.ID,
				"actorUserId": principal.UserID,
				"role":        input.Role,
				"createdUser": createdUser,
			}); err != nil {
				return err
			}
		}

		existingUser = targetUser
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toWorkspaceMemberDTO(createdMember, existingUser), nil
}

func (s *WorkspaceService) AuthorizeWorkspace(ctx context.Context, principal interfaces.Principal, workspaceID string) (*models.WorkspaceMember, error) {
	member, err := s.repos.WorkspaceMembers().Get(ctx, workspaceID, principal.UserID)
	if err != nil {
		if utils.AsAppError(err).Code != "MEMBERSHIP_REQUIRED" {
			return nil, err
		}
		workspace, workspaceErr := s.repos.Workspaces().GetByID(ctx, workspaceID)
		if workspaceErr != nil {
			return nil, workspaceErr
		}
		if workspace.OwnerID != principal.UserID {
			return nil, err
		}
		return &models.WorkspaceMember{
			Common:      models.Common{CreatedAt: workspace.CreatedAt, UpdatedAt: workspace.UpdatedAt},
			WorkspaceID: workspace.ID,
			UserID:      principal.UserID,
			Role:        "owner",
			JoinedAt:    workspace.CreatedAt,
		}, nil
	}
	return member, nil
}

func isAdminRole(role string) bool {
	return role == "owner" || role == "admin"
}

func validateRoleAssignment(actorRole string, targetRole string) error {
	if !isAdminRole(actorRole) || !roleAllowed(targetRole) {
		return utils.ErrForbidden
	}
	if targetRole == "owner" && actorRole != "owner" {
		return utils.ErrForbidden
	}
	return nil
}

func (s *WorkspaceService) guardOwnerMutation(
	ctx context.Context,
	actorUserID string,
	actorRole string,
	target *models.WorkspaceMember,
	nextRole string,
	removing bool,
) error {
	if target.Role != "owner" {
		return nil
	}
	items, err := s.repos.WorkspaceMembers().ListByWorkspace(ctx, target.WorkspaceID)
	if err != nil {
		return err
	}
	ownerCount := 0
	for _, item := range items {
		if item.Role == "owner" {
			ownerCount++
		}
	}
	if ownerCount <= 1 {
		if removing {
			return utils.NewError(http.StatusConflict, "LAST_OWNER_REQUIRED", "The workspace must retain at least one owner.", nil)
		}
		if nextRole != "owner" {
			return utils.NewError(http.StatusConflict, "LAST_OWNER_REQUIRED", "The workspace must retain at least one owner.", nil)
		}
	}
	if actorRole != "owner" && target.Role == "owner" {
		return utils.ErrForbidden
	}
	if removing && target.UserID == actorUserID && ownerCount <= 1 {
		return utils.NewError(http.StatusConflict, "LAST_OWNER_REQUIRED", "You cannot leave the workspace as its last owner.", nil)
	}
	return nil
}

func (s *WorkspaceService) toWorkspaceMemberDTOs(ctx context.Context, items []models.WorkspaceMember) ([]WorkspaceMemberDTO, error) {
	result := make([]WorkspaceMemberDTO, 0, len(items))
	for _, item := range items {
		user, err := s.users.GetByID(ctx, item.UserID)
		if err != nil {
			if utils.AsAppError(err).Code == "USER_NOT_FOUND" {
				continue
			}
			return nil, err
		}
		dto := toWorkspaceMemberDTO(&item, user)
		if s.presence != nil {
			if record, ok := s.presence.Get(ctx, item.WorkspaceID, item.UserID); ok {
				dto.PresenceStatus = record.State
				dto.LastSeenAt = &record.LastSeenAt
			}
		}
		result = append(result, *dto)
	}
	return result, nil
}

func toWorkspaceMemberDTO(item *models.WorkspaceMember, user *models.User) *WorkspaceMemberDTO {
	lastSeenAt := item.LastSeenAt
	if user.LastSeenAt != nil {
		lastSeenAt = user.LastSeenAt
	}

	return &WorkspaceMemberDTO{
		ID:             item.ID,
		WorkspaceID:    item.WorkspaceID,
		UserID:         item.UserID,
		Role:           item.Role,
		JoinedAt:       item.JoinedAt,
		LastSeenAt:     lastSeenAt,
		CreatedAt:      item.CreatedAt,
		UpdatedAt:      item.UpdatedAt,
		DisplayName:    user.DisplayName,
		Email:          user.Email,
		AvatarURL:      user.AvatarURL,
		Status:         user.Status,
		PresenceStatus: user.PresenceStatus,
	}
}

func defaultWorkspaceSSOConfig(workspaceID string) *WorkspaceSSOConfigDTO {
	return &WorkspaceSSOConfigDTO{
		WorkspaceID:        workspaceID,
		Provider:           "oidc",
		AllowPasswordAuth:  true,
		AllowAutoProvision: true,
		AllowedDomains:     []string{},
		DefaultRole:        "member",
		AttributeMapping:   map[string]string{},
	}
}

func toWorkspaceSSOConfigDTO(item *models.WorkspaceSSOConfig) *WorkspaceSSOConfigDTO {
	if item == nil {
		return nil
	}
	return &WorkspaceSSOConfigDTO{
		ID:                     item.ID,
		WorkspaceID:            item.WorkspaceID,
		Provider:               item.Provider,
		Enabled:                item.Enabled,
		EnforceSSO:             item.EnforceSSO,
		AllowPasswordAuth:      item.AllowPasswordAuth,
		AllowAutoProvision:     item.AllowAutoProvision,
		AllowIDPInitiated:      item.AllowIDPInitiated,
		DomainHint:             item.DomainHint,
		IssuerURL:              item.IssuerURL,
		SSOURL:                 item.SSOURL,
		EntityID:               item.EntityID,
		ClientID:               item.ClientID,
		ClientSecretConfigured: strings.TrimSpace(item.ClientSecret) != "",
		Certificate:            item.Certificate,
		AllowedDomains:         decodeStringArrayJSON(item.AllowedDomains),
		DefaultRole:            item.DefaultRole,
		AttributeMapping:       decodeStringMapJSON(item.AttributeMapping),
		CreatedAt:              item.CreatedAt,
		UpdatedAt:              item.UpdatedAt,
	}
}

func normalizeDomainList(items []string) []string {
	if len(items) == 0 {
		return []string{}
	}
	seen := make(map[string]struct{}, len(items))
	result := make([]string, 0, len(items))
	for _, item := range items {
		normalized := strings.ToLower(strings.TrimSpace(item))
		if normalized == "" {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		result = append(result, normalized)
	}
	return result
}

func normalizeAttributeMapping(items map[string]string) map[string]string {
	result := make(map[string]string, len(items))
	for key, value := range items {
		normalizedKey := strings.TrimSpace(key)
		normalizedValue := strings.TrimSpace(value)
		if normalizedKey == "" || normalizedValue == "" {
			continue
		}
		result[normalizedKey] = normalizedValue
	}
	return result
}

func decodeStringArrayJSON(payload []byte) []string {
	if len(payload) == 0 {
		return []string{}
	}
	var result []string
	if err := json.Unmarshal(payload, &result); err != nil {
		return []string{}
	}
	return result
}

func decodeStringMapJSON(payload []byte) map[string]string {
	if len(payload) == 0 {
		return map[string]string{}
	}
	var result map[string]string
	if err := json.Unmarshal(payload, &result); err != nil {
		return map[string]string{}
	}
	if result == nil {
		return map[string]string{}
	}
	return result
}
