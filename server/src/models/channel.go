package models

import "time"

type Channel struct {
	Common
	WorkspaceID string     `gorm:"type:text;index;not null" json:"workspaceId"`
	TeamID      *string    `gorm:"type:text;index" json:"teamId,omitempty"`
	Name        string     `gorm:"type:text;not null" json:"name"`
	Slug        string     `gorm:"type:text;index;not null" json:"slug"`
	Description string     `gorm:"type:text" json:"description,omitempty"`
	Type        string     `gorm:"type:text;not null" json:"type"`
	Visibility  string     `gorm:"type:text;not null" json:"visibility"`
	CreatedBy   string     `gorm:"type:text;index;not null" json:"createdBy"`
	ArchivedAt  *time.Time `json:"archivedAt,omitempty"`
}
