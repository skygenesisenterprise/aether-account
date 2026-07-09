package models

import "time"

type OutboxEvent struct {
	Common
	EventType     string     `gorm:"type:text;index;not null" json:"eventType"`
	AggregateType string     `gorm:"type:text;index;not null" json:"aggregateType"`
	AggregateID   string     `gorm:"type:text;index;not null" json:"aggregateId"`
	WorkspaceID   string     `gorm:"type:text;index;not null" json:"workspaceId"`
	Payload       []byte     `gorm:"type:jsonb;not null" json:"payload"`
	Attempts      int        `gorm:"not null;default:0" json:"attempts"`
	PublishedAt   *time.Time `gorm:"index" json:"publishedAt,omitempty"`
	LastError     string     `gorm:"type:text" json:"lastError,omitempty"`
	LockedAt      *time.Time `json:"lockedAt,omitempty"`
	LockedBy      string     `gorm:"type:text;index" json:"lockedBy,omitempty"`
}
