package models

import "time"

type Meeting struct {
	Common
	WorkspaceID    string     `gorm:"type:text;index;not null" json:"workspaceId"`
	ConversationID *string    `gorm:"type:text;index" json:"conversationId,omitempty"`
	Provider       string     `gorm:"type:text;index;not null" json:"provider"`
	ProviderRoomID string     `gorm:"type:text" json:"providerRoomId,omitempty"`
	Title          string     `gorm:"type:text;not null" json:"title"`
	Status         string     `gorm:"type:text;index;not null" json:"status"`
	CreatedBy      string     `gorm:"type:text;index;not null" json:"createdBy"`
	StartedAt      *time.Time `json:"startedAt,omitempty"`
	EndedAt        *time.Time `json:"endedAt,omitempty"`
}

type MeetingParticipant struct {
	Common
	MeetingID string     `gorm:"type:text;index;not null" json:"meetingId"`
	UserID    string     `gorm:"type:text;index;not null" json:"userId"`
	Role      string     `gorm:"type:text;index;not null;default:'attendee'" json:"role"`
	Status    string     `gorm:"type:text;not null" json:"status"`
	Metadata  []byte     `gorm:"type:jsonb" json:"metadata,omitempty"`
	JoinedAt  *time.Time `json:"joinedAt,omitempty"`
	LeftAt    *time.Time `json:"leftAt,omitempty"`
}
