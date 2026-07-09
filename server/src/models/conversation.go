package models

import "time"

type Conversation struct {
	Common
	WorkspaceID string     `gorm:"type:text;index;not null" json:"workspaceId"`
	ChannelID   *string    `gorm:"type:text;index" json:"channelId,omitempty"`
	Type        string     `gorm:"type:text;not null" json:"type"`
	Name        string     `gorm:"type:text" json:"name,omitempty"`
	CreatedBy   string     `gorm:"type:text;index;not null" json:"createdBy"`
	ArchivedAt  *time.Time `json:"archivedAt,omitempty"`
}

type ConversationMember struct {
	Common
	ConversationID    string     `gorm:"type:text;index;not null" json:"conversationId"`
	UserID            string     `gorm:"type:text;index;not null" json:"userId"`
	Role              string     `gorm:"type:text;not null" json:"role"`
	JoinedAt          time.Time  `gorm:"not null" json:"joinedAt"`
	LastReadMessageID *string    `gorm:"type:text" json:"lastReadMessageId,omitempty"`
	LastReadAt        *time.Time `json:"lastReadAt,omitempty"`
	MutedUntil        *time.Time `json:"mutedUntil,omitempty"`
}
