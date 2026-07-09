package services

import (
	"context"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type UserService struct {
	users                   interfaces.UserRepository
	settings                interfaces.UserSettingsRepository
	notificationPreferences interfaces.NotificationPreferenceRepository
	presence                *PresenceService
}

type UserPreferencesDTO struct {
	Theme         string `json:"theme"`
	Language      string `json:"language"`
	Locale        string `json:"locale"`
	Timezone      string `json:"timezone"`
	StatusMessage string `json:"statusMessage,omitempty"`
	Density       string `json:"density"`
	Contrast      string `json:"contrast"`
	SoundEnabled  bool   `json:"soundEnabled"`
	SecureSession bool   `json:"secureSession"`
}

type NotificationPreferencesDTO struct {
	DirectMessages       bool `json:"directMessages"`
	Mentions             bool `json:"mentions"`
	ChannelMessages      bool `json:"channelMessages"`
	MeetingReminders     bool `json:"meetingReminders"`
	IncomingCalls        bool `json:"incomingCalls"`
	EmailNotifications   bool `json:"emailNotifications"`
	Sounds               bool `json:"sounds"`
	DesktopNotifications bool `json:"desktopNotifications"`
}

func NewUserService(
	users interfaces.UserRepository,
	settings interfaces.UserSettingsRepository,
	notificationPreferences interfaces.NotificationPreferenceRepository,
	presence *PresenceService,
) *UserService {
	return &UserService{
		users:                   users,
		settings:                settings,
		notificationPreferences: notificationPreferences,
		presence:                presence,
	}
}

func (s *UserService) EnsureUser(ctx context.Context, principal interfaces.Principal) (*models.User, error) {
	user, err := s.users.GetByID(ctx, principal.UserID)
	if err == nil {
		return user, nil
	}
	user = &models.User{
		Common:          models.Common{ID: principal.UserID, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()},
		Email:           principal.UserID + "@local.aether",
		EmailNormalized: principal.UserID + "@local.aether",
		DisplayName:     principal.UserID,
		Status:          "active",
		PresenceStatus:  "online",
	}
	if createErr := s.users.Create(ctx, user); createErr != nil {
		return nil, createErr
	}
	return user, nil
}

func (s *UserService) GetMe(ctx context.Context, principal interfaces.Principal) (*models.User, error) {
	return s.EnsureUser(ctx, principal)
}

func (s *UserService) UpdateMe(ctx context.Context, principal interfaces.Principal, displayName, avatarURL, status string) (*models.User, error) {
	user, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	if displayName != "" {
		user.DisplayName = strings.TrimSpace(displayName)
	}
	if trimmed := strings.TrimSpace(avatarURL); trimmed != "" {
		user.AvatarURL = &trimmed
	} else {
		user.AvatarURL = nil
	}
	if status != "" {
		normalizedStatus := normalizePresenceState(status)
		if normalizedStatus == "" {
			return nil, utils.ErrValidationFailed
		}
		user.PresenceStatus = normalizedStatus
	}
	user.UpdatedAt = time.Now().UTC()
	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}
	if s.presence != nil {
		if err := s.presence.RefreshUserState(ctx, user.ID); err != nil {
			return nil, err
		}
	}
	return user, nil
}

func (s *UserService) GetPreferences(ctx context.Context, principal interfaces.Principal) (*UserPreferencesDTO, error) {
	_, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	settings, err := s.settings.GetByUserID(ctx, principal.UserID)
	if err != nil {
		if utils.AsAppError(err).Code != "USER_SETTINGS_NOT_FOUND" {
			return nil, err
		}
		return &UserPreferencesDTO{
			Theme: "system", Language: "fr", Locale: "fr", Timezone: "Europe/Paris",
			Density: "comfortable", Contrast: "default", SoundEnabled: true, SecureSession: true,
		}, nil
	}
	statusMessage := ""
	if settings.StatusMessage != nil {
		statusMessage = *settings.StatusMessage
	}
	return &UserPreferencesDTO{
		Theme:         settings.Theme,
		Language:      settings.Language,
		Locale:        settings.Locale,
		Timezone:      settings.TimeZone,
		StatusMessage: statusMessage,
		Density:       settings.Density,
		Contrast:      settings.Contrast,
		SoundEnabled:  settings.SoundEnabled,
		SecureSession: settings.SecureSession,
	}, nil
}

func (s *UserService) UpdatePreferences(ctx context.Context, principal interfaces.Principal, input UserPreferencesDTO) (*UserPreferencesDTO, error) {
	_, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	statusMessage := strings.TrimSpace(input.StatusMessage)
	settings := &models.UserSettings{
		Common:        models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		UserID:        principal.UserID,
		Theme:         defaultString(input.Theme, "system"),
		Language:      defaultString(input.Language, "fr"),
		Locale:        defaultString(input.Locale, "fr"),
		TimeZone:      defaultString(input.Timezone, "Europe/Paris"),
		Density:       defaultString(input.Density, "comfortable"),
		Contrast:      defaultString(input.Contrast, "default"),
		SoundEnabled:  input.SoundEnabled,
		SecureSession: input.SecureSession,
	}
	if statusMessage != "" {
		settings.StatusMessage = &statusMessage
	}
	if err := s.settings.Upsert(ctx, settings); err != nil {
		return nil, err
	}
	return s.GetPreferences(ctx, principal)
}

func (s *UserService) GetNotificationPreferences(ctx context.Context, principal interfaces.Principal) (*NotificationPreferencesDTO, error) {
	_, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	prefs, err := s.notificationPreferences.GetByUserID(ctx, principal.UserID)
	if err != nil {
		if utils.AsAppError(err).Code != "NOTIFICATION_PREFERENCES_NOT_FOUND" {
			return nil, err
		}
		return &NotificationPreferencesDTO{
			DirectMessages: true, Mentions: true, ChannelMessages: true, MeetingReminders: true,
			IncomingCalls: true, EmailNotifications: true, Sounds: true, DesktopNotifications: true,
		}, nil
	}
	return &NotificationPreferencesDTO{
		DirectMessages:       prefs.DirectMessageNotifications,
		Mentions:             prefs.MentionNotifications,
		ChannelMessages:      prefs.ChannelMessageNotifications,
		MeetingReminders:     prefs.MeetingReminders,
		IncomingCalls:        prefs.CallNotifications,
		EmailNotifications:   prefs.EmailNotifications,
		Sounds:               prefs.SoundEnabled,
		DesktopNotifications: prefs.DesktopNotifications,
	}, nil
}

func (s *UserService) UpdateNotificationPreferences(
	ctx context.Context,
	principal interfaces.Principal,
	input NotificationPreferencesDTO,
) (*NotificationPreferencesDTO, error) {
	_, err := s.EnsureUser(ctx, principal)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	preference := &models.NotificationPreference{
		Common:                      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		UserID:                      principal.UserID,
		DirectMessageNotifications:  input.DirectMessages,
		MentionNotifications:        input.Mentions,
		ChannelMessageNotifications: input.ChannelMessages,
		MeetingReminders:            input.MeetingReminders,
		CallNotifications:           input.IncomingCalls,
		EmailNotifications:          input.EmailNotifications,
		SoundEnabled:                input.Sounds,
		DesktopNotifications:        input.DesktopNotifications,
	}
	if err := s.notificationPreferences.Upsert(ctx, preference); err != nil {
		return nil, err
	}
	return s.GetNotificationPreferences(ctx, principal)
}

func defaultString(value string, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}

func roleAllowed(role string) bool {
	return utils.ValidRole(role)
}
