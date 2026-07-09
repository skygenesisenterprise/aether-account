package models

import "time"

type Message struct {
	Common
	WorkspaceID     string     `gorm:"type:text;index;not null" json:"workspaceId"`
	ConversationID  string     `gorm:"type:text;index;not null" json:"conversationId"`
	AuthorID        string     `gorm:"type:text;index;not null" json:"authorId"`
	ParentMessageID *string    `gorm:"type:text;index" json:"parentMessageId,omitempty"`
	Type            string     `gorm:"type:text;not null" json:"type"`
	Content         string     `gorm:"type:text;not null" json:"content"`
	Metadata        []byte     `gorm:"type:jsonb" json:"metadata,omitempty"`
	EditedAt        *time.Time `json:"editedAt,omitempty"`
	DeletedAt       *time.Time `gorm:"index" json:"deletedAt,omitempty"`
}

type Reaction struct {
	Common
	MessageID string `gorm:"type:text;index;not null" json:"messageId"`
	UserID    string `gorm:"type:text;index;not null" json:"userId"`
	Emoji     string `gorm:"type:text;not null" json:"emoji"`
}

type ReadReceipt struct {
	Common
	ConversationID string    `gorm:"type:text;index;not null" json:"conversationId"`
	MessageID      string    `gorm:"type:text;index;not null" json:"messageId"`
	UserID         string    `gorm:"type:text;index;not null" json:"userId"`
	ReadAt         time.Time `gorm:"not null" json:"readAt"`
}
