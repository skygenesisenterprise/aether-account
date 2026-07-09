package interfaces

import (
	"context"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/models"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	ListStale(ctx context.Context, before time.Time, limit int) ([]models.User, error)
	Update(ctx context.Context, user *models.User) error
}

type UserSettingsRepository interface {
	GetByUserID(ctx context.Context, userID string) (*models.UserSettings, error)
	Upsert(ctx context.Context, settings *models.UserSettings) error
}

type NotificationPreferenceRepository interface {
	GetByUserID(ctx context.Context, userID string) (*models.NotificationPreference, error)
	Upsert(ctx context.Context, preference *models.NotificationPreference) error
}

type LocalCredentialRepository interface {
	Create(ctx context.Context, credential *models.LocalCredential) error
	GetByUserID(ctx context.Context, userID string) (*models.LocalCredential, error)
	Update(ctx context.Context, credential *models.LocalCredential) error
}

type AuthSessionRepository interface {
	Create(ctx context.Context, session *models.AuthSession) error
	GetByID(ctx context.Context, id string) (*models.AuthSession, error)
	ListActiveByUser(ctx context.Context, userID string, now time.Time) ([]models.AuthSession, error)
	ListByUser(ctx context.Context, userID string) ([]models.AuthSession, error)
	Update(ctx context.Context, session *models.AuthSession) error
	Revoke(ctx context.Context, id string, reason string, revokedAt time.Time) error
	RevokeAllByUser(ctx context.Context, userID string, reason string, revokedAt time.Time, exceptSessionID string) error
	RevokeFamily(ctx context.Context, familyID string, reason string, revokedAt time.Time) error
	DeleteExpired(ctx context.Context, before time.Time) error
}

type AuthRefreshTokenRepository interface {
	Create(ctx context.Context, token *models.AuthRefreshToken) error
	GetByHash(ctx context.Context, tokenHash string) (*models.AuthRefreshToken, error)
	GetByID(ctx context.Context, id string) (*models.AuthRefreshToken, error)
	Update(ctx context.Context, token *models.AuthRefreshToken) error
	RevokeFamily(ctx context.Context, familyID string, revokedAt time.Time) error
	DeleteExpired(ctx context.Context, before time.Time) error
}

type EmailVerificationTokenRepository interface {
	Create(ctx context.Context, token *models.EmailVerificationToken) error
	GetByHash(ctx context.Context, tokenHash string) (*models.EmailVerificationToken, error)
	Update(ctx context.Context, token *models.EmailVerificationToken) error
	DeleteExpired(ctx context.Context, before time.Time) error
}

type PasswordResetTokenRepository interface {
	Create(ctx context.Context, token *models.PasswordResetToken) error
	GetByHash(ctx context.Context, tokenHash string) (*models.PasswordResetToken, error)
	Update(ctx context.Context, token *models.PasswordResetToken) error
	DeleteExpired(ctx context.Context, before time.Time) error
}

type AuthAuditEventRepository interface {
	Create(ctx context.Context, event *models.AuthAuditEvent) error
}

type WorkspaceRepository interface {
	Create(ctx context.Context, workspace *models.Workspace) error
	ListByUser(ctx context.Context, userID string) ([]models.Workspace, error)
	GetByID(ctx context.Context, id string) (*models.Workspace, error)
	Update(ctx context.Context, workspace *models.Workspace) error
	Archive(ctx context.Context, id string, archivedAt time.Time) error
}

type WorkspaceMemberRepository interface {
	Create(ctx context.Context, member *models.WorkspaceMember) error
	Get(ctx context.Context, workspaceID, userID string) (*models.WorkspaceMember, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.WorkspaceMember, error)
	Update(ctx context.Context, member *models.WorkspaceMember) error
	Delete(ctx context.Context, workspaceID, userID string) error
}

type WorkspaceSSOConfigRepository interface {
	GetByWorkspaceID(ctx context.Context, workspaceID string) (*models.WorkspaceSSOConfig, error)
	Upsert(ctx context.Context, config *models.WorkspaceSSOConfig) error
}

type TeamRepository interface {
	Create(ctx context.Context, team *models.Team) error
	GetByID(ctx context.Context, id string) (*models.Team, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Team, error)
	Update(ctx context.Context, team *models.Team) error
	Archive(ctx context.Context, id string, archivedAt time.Time) error
}

type ChannelRepository interface {
	Create(ctx context.Context, channel *models.Channel) error
	GetByID(ctx context.Context, id string) (*models.Channel, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Channel, error)
	Update(ctx context.Context, channel *models.Channel) error
	Archive(ctx context.Context, id string, archivedAt time.Time) error
}

type ConversationRepository interface {
	Create(ctx context.Context, conversation *models.Conversation) error
	GetByID(ctx context.Context, id string) (*models.Conversation, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Conversation, error)
	Update(ctx context.Context, conversation *models.Conversation) error
	Archive(ctx context.Context, id string, archivedAt time.Time) error
}

type ConversationMemberRepository interface {
	Create(ctx context.Context, member *models.ConversationMember) error
	ListByConversation(ctx context.Context, conversationID string) ([]models.ConversationMember, error)
	Get(ctx context.Context, conversationID, userID string) (*models.ConversationMember, error)
	Update(ctx context.Context, member *models.ConversationMember) error
	Delete(ctx context.Context, conversationID, userID string) error
}

type TaskRepository interface {
	Create(ctx context.Context, task *models.Task) error
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Task, error)
	GetByID(ctx context.Context, id string) (*models.Task, error)
	Update(ctx context.Context, task *models.Task) error
	Archive(ctx context.Context, id string, archivedAt time.Time) error
}

type ProjectRepository interface {
	Create(ctx context.Context, project *models.Project) error
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Project, error)
	GetByID(ctx context.Context, id string) (*models.Project, error)
	Update(ctx context.Context, project *models.Project) error
	Archive(ctx context.Context, id string, archivedAt time.Time) error
}

type MessageRepository interface {
	Create(ctx context.Context, message *models.Message) error
	GetByID(ctx context.Context, id string) (*models.Message, error)
	ListByConversation(ctx context.Context, conversationID string, cursor string, limit int) ([]models.Message, string, bool, error)
	Update(ctx context.Context, message *models.Message) error
	SoftDelete(ctx context.Context, id string, deletedAt time.Time) error
}

type ReactionRepository interface {
	Create(ctx context.Context, reaction *models.Reaction) error
	Delete(ctx context.Context, messageID, userID, emoji string) error
	ListByMessage(ctx context.Context, messageID string) ([]models.Reaction, error)
}

type ReadReceiptRepository interface {
	Upsert(ctx context.Context, receipt *models.ReadReceipt) error
}

type MeetingRepository interface {
	Create(ctx context.Context, meeting *models.Meeting) error
	GetByID(ctx context.Context, id string) (*models.Meeting, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Meeting, error)
	ListActive(ctx context.Context, limit int) ([]models.Meeting, error)
	ListStartingBetween(ctx context.Context, start, end time.Time, limit int) ([]models.Meeting, error)
	ListExpiredScheduled(ctx context.Context, before time.Time, limit int) ([]models.Meeting, error)
	ListAbandonedActive(ctx context.Context, before time.Time, limit int) ([]models.Meeting, error)
	Update(ctx context.Context, meeting *models.Meeting) error
}

type MeetingParticipantRepository interface {
	Create(ctx context.Context, participant *models.MeetingParticipant) error
	Get(ctx context.Context, meetingID, userID string) (*models.MeetingParticipant, error)
	ListByMeeting(ctx context.Context, meetingID string) ([]models.MeetingParticipant, error)
	Upsert(ctx context.Context, participant *models.MeetingParticipant) error
	Update(ctx context.Context, participant *models.MeetingParticipant) error
}

type MeetingSessionRepository interface {
	Create(ctx context.Context, session *models.MeetingSession) error
	GetByID(ctx context.Context, id string) (*models.MeetingSession, error)
	GetActiveByMeeting(ctx context.Context, meetingID string) (*models.MeetingSession, error)
	GetByProviderRoomName(ctx context.Context, roomName string) (*models.MeetingSession, error)
	ListActive(ctx context.Context, limit int) ([]models.MeetingSession, error)
	Update(ctx context.Context, session *models.MeetingSession) error
}

type MeetingSessionParticipantRepository interface {
	Create(ctx context.Context, participant *models.MeetingSessionParticipant) error
	GetByIdentity(ctx context.Context, sessionID, providerIdentity string) (*models.MeetingSessionParticipant, error)
	ListBySession(ctx context.Context, sessionID string) ([]models.MeetingSessionParticipant, error)
	Upsert(ctx context.Context, participant *models.MeetingSessionParticipant) error
	Update(ctx context.Context, participant *models.MeetingSessionParticipant) error
}

type WebRTCNodeRepository interface {
	Upsert(ctx context.Context, node *models.WebRTCNode) error
	GetByID(ctx context.Context, id string) (*models.WebRTCNode, error)
	ListHealthy(ctx context.Context, provider string) ([]models.WebRTCNode, error)
	Update(ctx context.Context, node *models.WebRTCNode) error
}

type WebRTCWebhookEventRepository interface {
	Create(ctx context.Context, event *models.WebRTCWebhookEvent) error
	GetByEventID(ctx context.Context, provider, eventID string) (*models.WebRTCWebhookEvent, error)
}

type IntegrationRepository interface {
	Create(ctx context.Context, integration *models.Integration) error
	GetByID(ctx context.Context, id string) (*models.Integration, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]models.Integration, error)
	Update(ctx context.Context, integration *models.Integration) error
	Delete(ctx context.Context, id string) error
}

type AuditLogRepository interface {
	Create(ctx context.Context, audit *models.AuditLog) error
	ListByWorkspace(ctx context.Context, workspaceID string, limit int) ([]models.AuditLog, error)
}

type NotificationRepository interface {
	Create(ctx context.Context, notification *models.Notification) error
	GetByIdempotencyKey(ctx context.Context, key string) (*models.Notification, error)
	ListByUser(ctx context.Context, userID string, before *time.Time, beforeID string, limit int) ([]models.Notification, error)
	CountUnreadByUser(ctx context.Context, userID string) (int64, error)
	MarkRead(ctx context.Context, userID, notificationID string, readAt time.Time) (bool, error)
	MarkAllRead(ctx context.Context, userID string, readAt time.Time) (bool, error)
	ListBefore(ctx context.Context, before time.Time, limit int) ([]models.Notification, error)
	DeleteByIDs(ctx context.Context, ids []string) error
}

type OutboxRepository interface {
	Create(ctx context.Context, event *models.OutboxEvent) error
	ClaimUnpublished(ctx context.Context, workerID string, limit int, maxAttempts int) ([]models.OutboxEvent, error)
	MarkPublished(ctx context.Context, id string, publishedAt time.Time) error
	MarkFailed(ctx context.Context, id string, attempts int, lastError string) error
}

type RepositorySet interface {
	Users() UserRepository
	UserSettings() UserSettingsRepository
	NotificationPreferences() NotificationPreferenceRepository
	LocalCredentials() LocalCredentialRepository
	AuthSessions() AuthSessionRepository
	AuthRefreshTokens() AuthRefreshTokenRepository
	EmailVerificationTokens() EmailVerificationTokenRepository
	PasswordResetTokens() PasswordResetTokenRepository
	AuthAuditEvents() AuthAuditEventRepository
	Workspaces() WorkspaceRepository
	WorkspaceMembers() WorkspaceMemberRepository
	WorkspaceSSOConfigs() WorkspaceSSOConfigRepository
	Teams() TeamRepository
	Channels() ChannelRepository
	Conversations() ConversationRepository
	ConversationMembers() ConversationMemberRepository
	Messages() MessageRepository
	Reactions() ReactionRepository
	ReadReceipts() ReadReceiptRepository
	Meetings() MeetingRepository
	MeetingParticipants() MeetingParticipantRepository
	MeetingSessions() MeetingSessionRepository
	MeetingSessionParticipants() MeetingSessionParticipantRepository
	Integrations() IntegrationRepository
	AuditLogs() AuditLogRepository
	Notifications() NotificationRepository
	OutboxEvents() OutboxRepository
	WebRTCNodes() WebRTCNodeRepository
	WebRTCWebhookEvents() WebRTCWebhookEventRepository
}
