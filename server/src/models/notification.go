package models

import "time"

type Notification struct {
	Common
	WorkspaceID    string     `gorm:"type:text;index;not null" json:"workspaceId"`
	UserID         string     `gorm:"type:text;index;not null" json:"userId"`
	Type           string     `gorm:"type:text;index;not null" json:"type"`
	Title          string     `gorm:"type:text;not null" json:"title"`
	Body           string     `gorm:"type:text;not null" json:"body"`
	ResourceType   string     `gorm:"type:text;index" json:"resourceType,omitempty"`
	ResourceID     string     `gorm:"type:text;index" json:"resourceId,omitempty"`
	Metadata       []byte     `gorm:"type:jsonb" json:"metadata,omitempty"`
	ReadAt         *time.Time `gorm:"index" json:"readAt,omitempty"`
	IdempotencyKey string     `gorm:"type:text;uniqueIndex" json:"idempotencyKey,omitempty"`
}
