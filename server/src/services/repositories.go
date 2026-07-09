package services

import (
	"context"
	"errors"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repositories struct {
	db *gorm.DB
}

func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{db: db}
}

func (r *Repositories) Users() interfaces.UserRepository { return &userRepository{db: r.db} }
func (r *Repositories) UserSettings() interfaces.UserSettingsRepository {
	return &userSettingsRepository{db: r.db}
}
func (r *Repositories) NotificationPreferences() interfaces.NotificationPreferenceRepository {
	return &notificationPreferenceRepository{db: r.db}
}
func (r *Repositories) LocalCredentials() interfaces.LocalCredentialRepository {
	return &localCredentialRepository{db: r.db}
}
func (r *Repositories) AuthSessions() interfaces.AuthSessionRepository {
	return &authSessionRepository{db: r.db}
}
func (r *Repositories) AuthRefreshTokens() interfaces.AuthRefreshTokenRepository {
	return &authRefreshTokenRepository{db: r.db}
}
func (r *Repositories) EmailVerificationTokens() interfaces.EmailVerificationTokenRepository {
	return &emailVerificationTokenRepository{db: r.db}
}
func (r *Repositories) PasswordResetTokens() interfaces.PasswordResetTokenRepository {
	return &passwordResetTokenRepository{db: r.db}
}
func (r *Repositories) AuthAuditEvents() interfaces.AuthAuditEventRepository {
	return &authAuditEventRepository{db: r.db}
}
func (r *Repositories) Workspaces() interfaces.WorkspaceRepository {
	return &workspaceRepository{db: r.db}
}
func (r *Repositories) WorkspaceMembers() interfaces.WorkspaceMemberRepository {
	return &workspaceMemberRepository{db: r.db}
}
func (r *Repositories) WorkspaceSSOConfigs() interfaces.WorkspaceSSOConfigRepository {
	return &workspaceSSOConfigRepository{db: r.db}
}
func (r *Repositories) Teams() interfaces.TeamRepository       { return &teamRepository{db: r.db} }
func (r *Repositories) Channels() interfaces.ChannelRepository { return &channelRepository{db: r.db} }
func (r *Repositories) Conversations() interfaces.ConversationRepository {
	return &conversationRepository{db: r.db}
}
func (r *Repositories) ConversationMembers() interfaces.ConversationMemberRepository {
	return &conversationMemberRepository{db: r.db}
}
func (r *Repositories) Projects() interfaces.ProjectRepository { return &projectRepository{db: r.db} }
func (r *Repositories) Tasks() interfaces.TaskRepository       { return &taskRepository{db: r.db} }
func (r *Repositories) Messages() interfaces.MessageRepository { return &messageRepository{db: r.db} }
func (r *Repositories) Reactions() interfaces.ReactionRepository {
	return &reactionRepository{db: r.db}
}
func (r *Repositories) ReadReceipts() interfaces.ReadReceiptRepository {
	return &readReceiptRepository{db: r.db}
}
func (r *Repositories) Meetings() interfaces.MeetingRepository { return &meetingRepository{db: r.db} }
func (r *Repositories) MeetingParticipants() interfaces.MeetingParticipantRepository {
	return &meetingParticipantRepository{db: r.db}
}
func (r *Repositories) MeetingSessions() interfaces.MeetingSessionRepository {
	return &meetingSessionRepository{db: r.db}
}
func (r *Repositories) MeetingSessionParticipants() interfaces.MeetingSessionParticipantRepository {
	return &meetingSessionParticipantRepository{db: r.db}
}
func (r *Repositories) Integrations() interfaces.IntegrationRepository {
	return &integrationRepository{db: r.db}
}
func (r *Repositories) AuditLogs() interfaces.AuditLogRepository {
	return &auditLogRepository{db: r.db}
}
func (r *Repositories) Notifications() interfaces.NotificationRepository {
	return &notificationRepository{db: r.db}
}
func (r *Repositories) OutboxEvents() interfaces.OutboxRepository {
	return &outboxRepository{db: r.db}
}
func (r *Repositories) WebRTCNodes() interfaces.WebRTCNodeRepository {
	return &webrtcNodeRepository{db: r.db}
}
func (r *Repositories) WebRTCWebhookEvents() interfaces.WebRTCWebhookEventRepository {
	return &webrtcWebhookEventRepository{db: r.db}
}
func (r *Repositories) WithDB(db *gorm.DB) *Repositories { return &Repositories{db: db} }

type userRepository struct{ db *gorm.DB }

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}
func (r *userRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
	return &user, normalizeNotFound(err, utils.NewError(404, "USER_NOT_FOUND", "The requested user was not found.", nil))
}
func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).First(&user, "email_normalized = ? OR email = ?", email, email).Error
	return &user, normalizeNotFound(err, utils.NewError(404, "USER_NOT_FOUND", "The requested user was not found.", nil))
}
func (r *userRepository) ListStale(ctx context.Context, before time.Time, limit int) ([]models.User, error) {
	var items []models.User
	err := r.db.WithContext(ctx).
		Where("last_seen_at IS NOT NULL AND last_seen_at < ? AND presence_status <> ?", before, "offline").
		Order("last_seen_at asc").
		Limit(limit).
		Find(&items).Error
	return items, err
}
func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

type userSettingsRepository struct{ db *gorm.DB }

func (r *userSettingsRepository) GetByUserID(ctx context.Context, userID string) (*models.UserSettings, error) {
	var item models.UserSettings
	err := r.db.WithContext(ctx).First(&item, "user_id = ?", userID).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "USER_SETTINGS_NOT_FOUND", "The requested user settings were not found.", nil))
}

func (r *userSettingsRepository) Upsert(ctx context.Context, settings *models.UserSettings) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		UpdateAll: true,
	}).Create(settings).Error
}

type notificationPreferenceRepository struct{ db *gorm.DB }

func (r *notificationPreferenceRepository) GetByUserID(ctx context.Context, userID string) (*models.NotificationPreference, error) {
	var item models.NotificationPreference
	err := r.db.WithContext(ctx).First(&item, "user_id = ?", userID).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "NOTIFICATION_PREFERENCES_NOT_FOUND", "The requested notification preferences were not found.", nil))
}

func (r *notificationPreferenceRepository) Upsert(ctx context.Context, preference *models.NotificationPreference) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		UpdateAll: true,
	}).Create(preference).Error
}

type localCredentialRepository struct{ db *gorm.DB }

func (r *localCredentialRepository) Create(ctx context.Context, credential *models.LocalCredential) error {
	return r.db.WithContext(ctx).Create(credential).Error
}

func (r *localCredentialRepository) GetByUserID(ctx context.Context, userID string) (*models.LocalCredential, error) {
	var credential models.LocalCredential
	err := r.db.WithContext(ctx).First(&credential, "user_id = ?", userID).Error
	return &credential, normalizeNotFound(err, utils.NewError(404, "LOCAL_CREDENTIAL_NOT_FOUND", "The requested credential was not found.", nil))
}

func (r *localCredentialRepository) Update(ctx context.Context, credential *models.LocalCredential) error {
	return r.db.WithContext(ctx).Save(credential).Error
}

type authSessionRepository struct{ db *gorm.DB }

func (r *authSessionRepository) Create(ctx context.Context, session *models.AuthSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *authSessionRepository) GetByID(ctx context.Context, id string) (*models.AuthSession, error) {
	var session models.AuthSession
	err := r.db.WithContext(ctx).First(&session, "id = ?", id).Error
	return &session, normalizeNotFound(err, utils.NewError(404, "AUTH_SESSION_NOT_FOUND", "The requested session was not found.", nil))
}

func (r *authSessionRepository) ListActiveByUser(ctx context.Context, userID string, now time.Time) ([]models.AuthSession, error) {
	var items []models.AuthSession
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND revoked_at IS NULL AND expires_at > ?", userID, now).
		Order("created_at desc").
		Find(&items).Error
	return items, err
}

func (r *authSessionRepository) ListByUser(ctx context.Context, userID string) ([]models.AuthSession, error) {
	var items []models.AuthSession
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&items).Error
	return items, err
}

func (r *authSessionRepository) Update(ctx context.Context, session *models.AuthSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

func (r *authSessionRepository) Revoke(ctx context.Context, id string, reason string, revokedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.AuthSession{}).Where("id = ? AND revoked_at IS NULL", id).Updates(map[string]any{
		"revoked_at":        revokedAt,
		"revocation_reason": reason,
		"updated_at":        revokedAt,
	}).Error
}

func (r *authSessionRepository) RevokeAllByUser(ctx context.Context, userID string, reason string, revokedAt time.Time, exceptSessionID string) error {
	query := r.db.WithContext(ctx).Model(&models.AuthSession{}).Where("user_id = ? AND revoked_at IS NULL", userID)
	if exceptSessionID != "" {
		query = query.Where("id <> ?", exceptSessionID)
	}
	return query.Updates(map[string]any{
		"revoked_at":        revokedAt,
		"revocation_reason": reason,
		"updated_at":        revokedAt,
	}).Error
}

func (r *authSessionRepository) RevokeFamily(ctx context.Context, familyID string, reason string, revokedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.AuthSession{}).Where("refresh_token_family_id = ? AND revoked_at IS NULL", familyID).Updates(map[string]any{
		"revoked_at":        revokedAt,
		"revocation_reason": reason,
		"updated_at":        revokedAt,
	}).Error
}

func (r *authSessionRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&models.AuthSession{}).Error
}

type authRefreshTokenRepository struct{ db *gorm.DB }

func (r *authRefreshTokenRepository) Create(ctx context.Context, token *models.AuthRefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *authRefreshTokenRepository) GetByHash(ctx context.Context, tokenHash string) (*models.AuthRefreshToken, error) {
	var token models.AuthRefreshToken
	err := r.db.WithContext(ctx).First(&token, "token_hash = ?", tokenHash).Error
	return &token, normalizeNotFound(err, utils.NewError(404, "REFRESH_TOKEN_NOT_FOUND", "The requested refresh token was not found.", nil))
}

func (r *authRefreshTokenRepository) GetByID(ctx context.Context, id string) (*models.AuthRefreshToken, error) {
	var token models.AuthRefreshToken
	err := r.db.WithContext(ctx).First(&token, "id = ?", id).Error
	return &token, normalizeNotFound(err, utils.NewError(404, "REFRESH_TOKEN_NOT_FOUND", "The requested refresh token was not found.", nil))
}

func (r *authRefreshTokenRepository) Update(ctx context.Context, token *models.AuthRefreshToken) error {
	return r.db.WithContext(ctx).Save(token).Error
}

func (r *authRefreshTokenRepository) RevokeFamily(ctx context.Context, familyID string, revokedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.AuthRefreshToken{}).Where("family_id = ? AND revoked_at IS NULL", familyID).Updates(map[string]any{
		"revoked_at": revokedAt,
		"updated_at": revokedAt,
	}).Error
}

func (r *authRefreshTokenRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&models.AuthRefreshToken{}).Error
}

type emailVerificationTokenRepository struct{ db *gorm.DB }

func (r *emailVerificationTokenRepository) Create(ctx context.Context, token *models.EmailVerificationToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *emailVerificationTokenRepository) GetByHash(ctx context.Context, tokenHash string) (*models.EmailVerificationToken, error) {
	var token models.EmailVerificationToken
	err := r.db.WithContext(ctx).First(&token, "token_hash = ?", tokenHash).Error
	return &token, normalizeNotFound(err, utils.NewError(404, "EMAIL_VERIFICATION_TOKEN_NOT_FOUND", "The requested email verification token was not found.", nil))
}

func (r *emailVerificationTokenRepository) Update(ctx context.Context, token *models.EmailVerificationToken) error {
	return r.db.WithContext(ctx).Save(token).Error
}

func (r *emailVerificationTokenRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&models.EmailVerificationToken{}).Error
}

type passwordResetTokenRepository struct{ db *gorm.DB }

func (r *passwordResetTokenRepository) Create(ctx context.Context, token *models.PasswordResetToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *passwordResetTokenRepository) GetByHash(ctx context.Context, tokenHash string) (*models.PasswordResetToken, error) {
	var token models.PasswordResetToken
	err := r.db.WithContext(ctx).First(&token, "token_hash = ?", tokenHash).Error
	return &token, normalizeNotFound(err, utils.NewError(404, "PASSWORD_RESET_TOKEN_NOT_FOUND", "The requested password reset token was not found.", nil))
}

func (r *passwordResetTokenRepository) Update(ctx context.Context, token *models.PasswordResetToken) error {
	return r.db.WithContext(ctx).Save(token).Error
}

func (r *passwordResetTokenRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&models.PasswordResetToken{}).Error
}

type authAuditEventRepository struct{ db *gorm.DB }

func (r *authAuditEventRepository) Create(ctx context.Context, event *models.AuthAuditEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

type workspaceRepository struct{ db *gorm.DB }

func (r *workspaceRepository) Create(ctx context.Context, workspace *models.Workspace) error {
	return r.db.WithContext(ctx).Create(workspace).Error
}
func (r *workspaceRepository) ListByUser(ctx context.Context, userID string) ([]models.Workspace, error) {
	var items []models.Workspace
	err := r.db.WithContext(ctx).
		Table("workspaces").
		Joins("left join workspace_members on workspace_members.workspace_id = workspaces.id").
		Where("(workspace_members.user_id = ? OR workspaces.owner_id = ?) AND workspaces.archived_at IS NULL", userID, userID).
		Distinct("workspaces.id, workspaces.created_at, workspaces.updated_at, workspaces.name, workspaces.slug, workspaces.description, workspaces.visibility, workspaces.owner_id, workspaces.archived_at").
		Order("workspaces.created_at asc").
		Scan(&items).Error
	return items, err
}
func (r *workspaceRepository) GetByID(ctx context.Context, id string) (*models.Workspace, error) {
	var item models.Workspace
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.ErrWorkspaceNotFound)
}
func (r *workspaceRepository) Update(ctx context.Context, workspace *models.Workspace) error {
	return r.db.WithContext(ctx).Save(workspace).Error
}
func (r *workspaceRepository) Archive(ctx context.Context, id string, archivedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.Workspace{}).Where("id = ?", id).Update("archived_at", archivedAt).Error
}

type workspaceMemberRepository struct{ db *gorm.DB }

func (r *workspaceMemberRepository) Create(ctx context.Context, member *models.WorkspaceMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}
func (r *workspaceMemberRepository) Get(ctx context.Context, workspaceID, userID string) (*models.WorkspaceMember, error) {
	var item models.WorkspaceMember
	err := r.db.WithContext(ctx).First(&item, "workspace_id = ? AND user_id = ?", workspaceID, userID).Error
	return &item, normalizeNotFound(err, utils.ErrMembershipRequired)
}
func (r *workspaceMemberRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.WorkspaceMember, error) {
	var items []models.WorkspaceMember
	err := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID).Order("joined_at asc").Find(&items).Error
	return items, err
}
func (r *workspaceMemberRepository) Update(ctx context.Context, member *models.WorkspaceMember) error {
	return r.db.WithContext(ctx).Save(member).Error
}
func (r *workspaceMemberRepository) Delete(ctx context.Context, workspaceID, userID string) error {
	return r.db.WithContext(ctx).Delete(&models.WorkspaceMember{}, "workspace_id = ? AND user_id = ?", workspaceID, userID).Error
}

type workspaceSSOConfigRepository struct{ db *gorm.DB }

func (r *workspaceSSOConfigRepository) GetByWorkspaceID(ctx context.Context, workspaceID string) (*models.WorkspaceSSOConfig, error) {
	var item models.WorkspaceSSOConfig
	err := r.db.WithContext(ctx).First(&item, "workspace_id = ?", workspaceID).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "WORKSPACE_SSO_NOT_FOUND", "The workspace SSO configuration was not found.", nil))
}

func (r *workspaceSSOConfigRepository) Upsert(ctx context.Context, item *models.WorkspaceSSOConfig) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "workspace_id"}},
		UpdateAll: true,
	}).Create(item).Error
}

type teamRepository struct{ db *gorm.DB }

func (r *teamRepository) Create(ctx context.Context, team *models.Team) error {
	return r.db.WithContext(ctx).Create(team).Error
}
func (r *teamRepository) GetByID(ctx context.Context, id string) (*models.Team, error) {
	var item models.Team
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "TEAM_NOT_FOUND", "The requested team was not found.", nil))
}
func (r *teamRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Team, error) {
	var items []models.Team
	err := r.db.WithContext(ctx).Where("workspace_id = ? AND archived_at IS NULL", workspaceID).Order("created_at asc").Find(&items).Error
	return items, err
}
func (r *teamRepository) Update(ctx context.Context, team *models.Team) error {
	return r.db.WithContext(ctx).Save(team).Error
}
func (r *teamRepository) Archive(ctx context.Context, id string, archivedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.Team{}).Where("id = ?", id).Update("archived_at", archivedAt).Error
}

type channelRepository struct{ db *gorm.DB }

func (r *channelRepository) Create(ctx context.Context, channel *models.Channel) error {
	return r.db.WithContext(ctx).Create(channel).Error
}
func (r *channelRepository) GetByID(ctx context.Context, id string) (*models.Channel, error) {
	var item models.Channel
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "CHANNEL_NOT_FOUND", "The requested channel was not found.", nil))
}
func (r *channelRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Channel, error) {
	var items []models.Channel
	err := r.db.WithContext(ctx).Where("workspace_id = ? AND archived_at IS NULL", workspaceID).Order("created_at asc").Find(&items).Error
	return items, err
}
func (r *channelRepository) Update(ctx context.Context, channel *models.Channel) error {
	return r.db.WithContext(ctx).Save(channel).Error
}
func (r *channelRepository) Archive(ctx context.Context, id string, archivedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.Channel{}).Where("id = ?", id).Update("archived_at", archivedAt).Error
}

type conversationRepository struct{ db *gorm.DB }

func (r *conversationRepository) Create(ctx context.Context, conversation *models.Conversation) error {
	return r.db.WithContext(ctx).Create(conversation).Error
}
func (r *conversationRepository) GetByID(ctx context.Context, id string) (*models.Conversation, error) {
	var item models.Conversation
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.ErrConversationNotFound)
}
func (r *conversationRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Conversation, error) {
	var items []models.Conversation
	err := r.db.WithContext(ctx).Where("workspace_id = ? AND archived_at IS NULL", workspaceID).Order("updated_at desc").Find(&items).Error
	return items, err
}
func (r *conversationRepository) Update(ctx context.Context, conversation *models.Conversation) error {
	return r.db.WithContext(ctx).Save(conversation).Error
}
func (r *conversationRepository) Archive(ctx context.Context, id string, archivedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.Conversation{}).Where("id = ?", id).Update("archived_at", archivedAt).Error
}

type conversationMemberRepository struct{ db *gorm.DB }

func (r *conversationMemberRepository) Create(ctx context.Context, member *models.ConversationMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}
func (r *conversationMemberRepository) ListByConversation(ctx context.Context, conversationID string) ([]models.ConversationMember, error) {
	var items []models.ConversationMember
	err := r.db.WithContext(ctx).Where("conversation_id = ?", conversationID).Find(&items).Error
	return items, err
}
func (r *conversationMemberRepository) Get(ctx context.Context, conversationID, userID string) (*models.ConversationMember, error) {
	var item models.ConversationMember
	err := r.db.WithContext(ctx).First(&item, "conversation_id = ? AND user_id = ?", conversationID, userID).Error
	return &item, normalizeNotFound(err, utils.ErrMembershipRequired)
}
func (r *conversationMemberRepository) Update(ctx context.Context, member *models.ConversationMember) error {
	return r.db.WithContext(ctx).Save(member).Error
}
func (r *conversationMemberRepository) Delete(ctx context.Context, conversationID, userID string) error {
	return r.db.WithContext(ctx).Delete(&models.ConversationMember{}, "conversation_id = ? AND user_id = ?", conversationID, userID).Error
}

type messageRepository struct{ db *gorm.DB }

type projectRepository struct{ db *gorm.DB }
type taskRepository struct{ db *gorm.DB }

func (r *projectRepository) Create(ctx context.Context, project *models.Project) error {
	return r.db.WithContext(ctx).Create(project).Error
}
func (r *projectRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Project, error) {
	var items []models.Project
	err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND archived_at IS NULL", workspaceID).
		Order("created_at desc").
		Find(&items).Error
	return items, err
}
func (r *projectRepository) GetByID(ctx context.Context, id string) (*models.Project, error) {
	var item models.Project
	err := r.db.WithContext(ctx).First(&item, "id = ? AND archived_at IS NULL", id).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "PROJECT_NOT_FOUND", "The requested project was not found.", nil))
}
func (r *projectRepository) Update(ctx context.Context, project *models.Project) error {
	return r.db.WithContext(ctx).Save(project).Error
}
func (r *projectRepository) Archive(ctx context.Context, id string, archivedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.Project{}).Where("id = ?", id).Update("archived_at", archivedAt).Error
}

func (r *taskRepository) Create(ctx context.Context, task *models.Task) error {
	return r.db.WithContext(ctx).Create(task).Error
}
func (r *taskRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Task, error) {
	var items []models.Task
	err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND archived_at IS NULL", workspaceID).
		Order("completed_at asc nulls first, due_at asc nulls last, created_at desc").
		Find(&items).Error
	return items, err
}
func (r *taskRepository) GetByID(ctx context.Context, id string) (*models.Task, error) {
	var item models.Task
	err := r.db.WithContext(ctx).First(&item, "id = ? AND archived_at IS NULL", id).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "TASK_NOT_FOUND", "The requested task was not found.", nil))
}
func (r *taskRepository) Update(ctx context.Context, task *models.Task) error {
	return r.db.WithContext(ctx).Save(task).Error
}
func (r *taskRepository) Archive(ctx context.Context, id string, archivedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.Task{}).Where("id = ?", id).Update("archived_at", archivedAt).Error
}

func (r *messageRepository) Create(ctx context.Context, message *models.Message) error {
	return r.db.WithContext(ctx).Create(message).Error
}
func (r *messageRepository) GetByID(ctx context.Context, id string) (*models.Message, error) {
	var item models.Message
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.ErrMessageNotFound)
}
func (r *messageRepository) ListByConversation(ctx context.Context, conversationID string, cursor string, limit int) ([]models.Message, string, bool, error) {
	query := r.db.WithContext(ctx).Where("conversation_id = ?", conversationID).Order("created_at desc, id desc").Limit(limit + 1)
	if cursor != "" {
		createdAt, id, err := utils.DecodeCursor(cursor)
		if err != nil {
			return nil, "", false, utils.NewError(400, "INVALID_CURSOR", "The pagination cursor is invalid.", nil)
		}
		query = query.Where("(created_at, id) < (?, ?)", createdAt, id)
	}
	var items []models.Message
	if err := query.Find(&items).Error; err != nil {
		return nil, "", false, err
	}
	hasMore := len(items) > limit
	if hasMore {
		items = items[:limit]
	}
	nextCursor := ""
	if hasMore && len(items) > 0 {
		last := items[len(items)-1]
		nextCursor = utils.EncodeCursor(last.CreatedAt, last.ID)
	}
	return items, nextCursor, hasMore, nil
}
func (r *messageRepository) Update(ctx context.Context, message *models.Message) error {
	return r.db.WithContext(ctx).Save(message).Error
}
func (r *messageRepository) SoftDelete(ctx context.Context, id string, deletedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.Message{}).Where("id = ?", id).Update("deleted_at", deletedAt).Error
}

type reactionRepository struct{ db *gorm.DB }

func (r *reactionRepository) Create(ctx context.Context, reaction *models.Reaction) error {
	return r.db.WithContext(ctx).Create(reaction).Error
}
func (r *reactionRepository) Delete(ctx context.Context, messageID, userID, emoji string) error {
	return r.db.WithContext(ctx).Delete(&models.Reaction{}, "message_id = ? AND user_id = ? AND emoji = ?", messageID, userID, emoji).Error
}
func (r *reactionRepository) ListByMessage(ctx context.Context, messageID string) ([]models.Reaction, error) {
	var items []models.Reaction
	err := r.db.WithContext(ctx).Where("message_id = ?", messageID).Find(&items).Error
	return items, err
}

type readReceiptRepository struct{ db *gorm.DB }

func (r *readReceiptRepository) Upsert(ctx context.Context, receipt *models.ReadReceipt) error {
	return r.db.WithContext(ctx).Where(
		"conversation_id = ? AND message_id = ? AND user_id = ?",
		receipt.ConversationID,
		receipt.MessageID,
		receipt.UserID,
	).Assign(receipt).FirstOrCreate(receipt).Error
}

type meetingRepository struct{ db *gorm.DB }

func (r *meetingRepository) Create(ctx context.Context, meeting *models.Meeting) error {
	return r.db.WithContext(ctx).Create(meeting).Error
}
func (r *meetingRepository) GetByID(ctx context.Context, id string) (*models.Meeting, error) {
	var item models.Meeting
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "MEETING_NOT_FOUND", "The requested meeting was not found.", nil))
}
func (r *meetingRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Meeting, error) {
	var items []models.Meeting
	err := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID).Order("created_at desc").Find(&items).Error
	return items, err
}
func (r *meetingRepository) ListActive(ctx context.Context, limit int) ([]models.Meeting, error) {
	var items []models.Meeting
	err := r.db.WithContext(ctx).Where("status = ?", "active").Order("updated_at asc").Limit(limit).Find(&items).Error
	return items, err
}
func (r *meetingRepository) ListStartingBetween(ctx context.Context, start, end time.Time, limit int) ([]models.Meeting, error) {
	var items []models.Meeting
	err := r.db.WithContext(ctx).
		Where("status = ? AND started_at IS NULL AND created_at <= ?", "scheduled", end).
		Order("created_at asc").
		Limit(limit).
		Find(&items).Error
	return items, err
}
func (r *meetingRepository) ListExpiredScheduled(ctx context.Context, before time.Time, limit int) ([]models.Meeting, error) {
	var items []models.Meeting
	err := r.db.WithContext(ctx).
		Where("status = ? AND started_at IS NULL AND created_at < ?", "scheduled", before).
		Order("created_at asc").
		Limit(limit).
		Find(&items).Error
	return items, err
}
func (r *meetingRepository) ListAbandonedActive(ctx context.Context, before time.Time, limit int) ([]models.Meeting, error) {
	var items []models.Meeting
	err := r.db.WithContext(ctx).
		Where("status = ? AND started_at IS NOT NULL AND ended_at IS NULL AND updated_at < ?", "active", before).
		Order("updated_at asc").
		Limit(limit).
		Find(&items).Error
	return items, err
}
func (r *meetingRepository) Update(ctx context.Context, meeting *models.Meeting) error {
	return r.db.WithContext(ctx).Save(meeting).Error
}

type meetingParticipantRepository struct{ db *gorm.DB }

func (r *meetingParticipantRepository) Create(ctx context.Context, participant *models.MeetingParticipant) error {
	return r.db.WithContext(ctx).Create(participant).Error
}
func (r *meetingParticipantRepository) Get(ctx context.Context, meetingID, userID string) (*models.MeetingParticipant, error) {
	var item models.MeetingParticipant
	err := r.db.WithContext(ctx).First(&item, "meeting_id = ? AND user_id = ?", meetingID, userID).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "MEETING_PARTICIPANT_NOT_FOUND", "The requested meeting participant was not found.", nil))
}
func (r *meetingParticipantRepository) ListByMeeting(ctx context.Context, meetingID string) ([]models.MeetingParticipant, error) {
	var items []models.MeetingParticipant
	err := r.db.WithContext(ctx).Where("meeting_id = ?", meetingID).Order("created_at asc").Find(&items).Error
	return items, err
}
func (r *meetingParticipantRepository) Upsert(ctx context.Context, participant *models.MeetingParticipant) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "meeting_id"}, {Name: "user_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"role", "status", "metadata", "joined_at", "left_at", "updated_at"}),
		}).
		Create(participant).Error
}
func (r *meetingParticipantRepository) Update(ctx context.Context, participant *models.MeetingParticipant) error {
	return r.db.WithContext(ctx).Save(participant).Error
}

type meetingSessionRepository struct{ db *gorm.DB }

func (r *meetingSessionRepository) Create(ctx context.Context, session *models.MeetingSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}
func (r *meetingSessionRepository) GetByID(ctx context.Context, id string) (*models.MeetingSession, error) {
	var item models.MeetingSession
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "MEETING_SESSION_NOT_FOUND", "The requested meeting session was not found.", nil))
}
func (r *meetingSessionRepository) GetActiveByMeeting(ctx context.Context, meetingID string) (*models.MeetingSession, error) {
	var item models.MeetingSession
	err := r.db.WithContext(ctx).
		Where("meeting_id = ? AND status IN ?", meetingID, []string{"pending", "active", "ending"}).
		Order("created_at desc").
		First(&item).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "MEETING_SESSION_NOT_FOUND", "The requested meeting session was not found.", nil))
}
func (r *meetingSessionRepository) GetByProviderRoomName(ctx context.Context, roomName string) (*models.MeetingSession, error) {
	var item models.MeetingSession
	err := r.db.WithContext(ctx).First(&item, "provider_room_name = ?", roomName).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "MEETING_SESSION_NOT_FOUND", "The requested meeting session was not found.", nil))
}
func (r *meetingSessionRepository) ListActive(ctx context.Context, limit int) ([]models.MeetingSession, error) {
	var items []models.MeetingSession
	err := r.db.WithContext(ctx).Where("status IN ?", []string{"pending", "active", "ending"}).Order("updated_at asc").Limit(limit).Find(&items).Error
	return items, err
}
func (r *meetingSessionRepository) Update(ctx context.Context, session *models.MeetingSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

type meetingSessionParticipantRepository struct{ db *gorm.DB }

func (r *meetingSessionParticipantRepository) Create(ctx context.Context, participant *models.MeetingSessionParticipant) error {
	return r.db.WithContext(ctx).Create(participant).Error
}
func (r *meetingSessionParticipantRepository) GetByIdentity(ctx context.Context, sessionID, providerIdentity string) (*models.MeetingSessionParticipant, error) {
	var item models.MeetingSessionParticipant
	err := r.db.WithContext(ctx).First(&item, "session_id = ? AND provider_identity = ?", sessionID, providerIdentity).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "SESSION_PARTICIPANT_NOT_FOUND", "The requested session participant was not found.", nil))
}
func (r *meetingSessionParticipantRepository) ListBySession(ctx context.Context, sessionID string) ([]models.MeetingSessionParticipant, error) {
	var items []models.MeetingSessionParticipant
	err := r.db.WithContext(ctx).Where("session_id = ?", sessionID).Order("created_at asc").Find(&items).Error
	return items, err
}
func (r *meetingSessionParticipantRepository) Upsert(ctx context.Context, participant *models.MeetingSessionParticipant) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "session_id"}, {Name: "provider_identity"}},
			DoUpdates: clause.AssignmentColumns([]string{"workspace_id", "user_id", "role", "status", "metadata", "joined_at", "left_at", "last_seen_at", "updated_at"}),
		}).
		Create(participant).Error
}
func (r *meetingSessionParticipantRepository) Update(ctx context.Context, participant *models.MeetingSessionParticipant) error {
	return r.db.WithContext(ctx).Save(participant).Error
}

type webrtcNodeRepository struct{ db *gorm.DB }

func (r *webrtcNodeRepository) Upsert(ctx context.Context, node *models.WebRTCNode) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id"}},
			DoUpdates: clause.AssignmentColumns([]string{"provider", "region", "internal_url", "public_url", "status", "capacity", "active_rooms", "active_participants", "last_heartbeat_at", "draining", "updated_at"}),
		}).
		Create(node).Error
}
func (r *webrtcNodeRepository) GetByID(ctx context.Context, id string) (*models.WebRTCNode, error) {
	var item models.WebRTCNode
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "WEBRTC_NODE_NOT_FOUND", "The requested WebRTC node was not found.", nil))
}
func (r *webrtcNodeRepository) ListHealthy(ctx context.Context, provider string) ([]models.WebRTCNode, error) {
	var items []models.WebRTCNode
	err := r.db.WithContext(ctx).
		Where("provider = ? AND status = ? AND draining = ?", provider, "healthy", false).
		Order("created_at asc").
		Find(&items).Error
	return items, err
}
func (r *webrtcNodeRepository) Update(ctx context.Context, node *models.WebRTCNode) error {
	return r.db.WithContext(ctx).Save(node).Error
}

type webrtcWebhookEventRepository struct{ db *gorm.DB }

func (r *webrtcWebhookEventRepository) Create(ctx context.Context, event *models.WebRTCWebhookEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}
func (r *webrtcWebhookEventRepository) GetByEventID(ctx context.Context, provider, eventID string) (*models.WebRTCWebhookEvent, error) {
	var item models.WebRTCWebhookEvent
	err := r.db.WithContext(ctx).First(&item, "provider = ? AND event_id = ?", provider, eventID).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "WEBHOOK_EVENT_NOT_FOUND", "The requested webhook event was not found.", nil))
}

type integrationRepository struct{ db *gorm.DB }

func (r *integrationRepository) Create(ctx context.Context, integration *models.Integration) error {
	return r.db.WithContext(ctx).Create(integration).Error
}
func (r *integrationRepository) GetByID(ctx context.Context, id string) (*models.Integration, error) {
	var item models.Integration
	err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "APPLICATION_NOT_FOUND", "The requested application was not found.", nil))
}
func (r *integrationRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Integration, error) {
	var items []models.Integration
	err := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID).Order("created_at desc").Find(&items).Error
	return items, err
}
func (r *integrationRepository) Update(ctx context.Context, integration *models.Integration) error {
	return r.db.WithContext(ctx).Save(integration).Error
}
func (r *integrationRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Integration{}, "id = ?", id).Error
}

type auditLogRepository struct{ db *gorm.DB }

func (r *auditLogRepository) Create(ctx context.Context, audit *models.AuditLog) error {
	return r.db.WithContext(ctx).Create(audit).Error
}
func (r *auditLogRepository) ListByWorkspace(ctx context.Context, workspaceID string, limit int) ([]models.AuditLog, error) {
	var items []models.AuditLog
	err := r.db.WithContext(ctx).Where("workspace_id = ?", workspaceID).Order("created_at desc").Limit(limit).Find(&items).Error
	return items, err
}

type notificationRepository struct{ db *gorm.DB }

func (r *notificationRepository) Create(ctx context.Context, notification *models.Notification) error {
	return r.db.WithContext(ctx).Create(notification).Error
}
func (r *notificationRepository) GetByIdempotencyKey(ctx context.Context, key string) (*models.Notification, error) {
	var item models.Notification
	err := r.db.WithContext(ctx).First(&item, "idempotency_key = ?", key).Error
	return &item, normalizeNotFound(err, utils.NewError(404, "NOTIFICATION_NOT_FOUND", "The requested notification was not found.", nil))
}
func (r *notificationRepository) ListByUser(ctx context.Context, userID string, before *time.Time, beforeID string, limit int) ([]models.Notification, error) {
	var items []models.Notification
	query := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at desc, id desc")
	if before != nil {
		query = query.Where("(created_at < ?) OR (created_at = ? AND id < ?)", before.UTC(), before.UTC(), beforeID)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&items).Error
	return items, err
}
func (r *notificationRepository) CountUnreadByUser(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Notification{}).Where("user_id = ? AND read_at IS NULL", userID).Count(&count).Error
	return count, err
}
func (r *notificationRepository) MarkRead(ctx context.Context, userID, notificationID string, readAt time.Time) (bool, error) {
	result := r.db.WithContext(ctx).
		Model(&models.Notification{}).
		Where("id = ? AND user_id = ? AND read_at IS NULL", notificationID, userID).
		Updates(map[string]any{"read_at": readAt, "updated_at": readAt})
	return result.RowsAffected > 0, result.Error
}
func (r *notificationRepository) MarkAllRead(ctx context.Context, userID string, readAt time.Time) (bool, error) {
	result := r.db.WithContext(ctx).
		Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Updates(map[string]any{"read_at": readAt, "updated_at": readAt})
	return result.RowsAffected > 0, result.Error
}
func (r *notificationRepository) ListBefore(ctx context.Context, before time.Time, limit int) ([]models.Notification, error) {
	var items []models.Notification
	err := r.db.WithContext(ctx).Where("created_at < ?", before).Order("created_at asc").Limit(limit).Find(&items).Error
	return items, err
}
func (r *notificationRepository) DeleteByIDs(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Delete(&models.Notification{}, "id IN ?", ids).Error
}

type outboxRepository struct{ db *gorm.DB }

func (r *outboxRepository) Create(ctx context.Context, event *models.OutboxEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *outboxRepository) ClaimUnpublished(ctx context.Context, workerID string, limit int, maxAttempts int) ([]models.OutboxEvent, error) {
	var items []models.OutboxEvent
	now := time.Now().UTC()
	return items, r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.
			Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where("published_at IS NULL AND attempts < ? AND (locked_at IS NULL OR locked_at < ?)", maxAttempts, now.Add(-2*time.Minute)).
			Order("created_at asc").
			Limit(limit).
			Find(&items).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return nil
		}
		ids := make([]string, 0, len(items))
		for _, item := range items {
			ids = append(ids, item.ID)
		}
		return tx.Model(&models.OutboxEvent{}).
			Where("id IN ?", ids).
			Updates(map[string]any{"locked_at": now, "locked_by": workerID}).Error
	})
}

func (r *outboxRepository) MarkPublished(ctx context.Context, id string, publishedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&models.OutboxEvent{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"published_at": publishedAt,
			"locked_at":    nil,
			"locked_by":    "",
			"last_error":   "",
		}).Error
}

func (r *outboxRepository) MarkFailed(ctx context.Context, id string, attempts int, lastError string) error {
	return r.db.WithContext(ctx).Model(&models.OutboxEvent{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"attempts":   attempts,
			"last_error": lastError,
			"locked_at":  nil,
			"locked_by":  "",
			"updated_at": time.Now().UTC(),
		}).Error
}

func normalizeNotFound(err error, notFound error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return notFound
	}
	return err
}
