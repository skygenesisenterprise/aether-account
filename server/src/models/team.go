package models

import "time"

type Team struct {
	Common
	WorkspaceID string     `gorm:"type:text;index;not null" json:"workspaceId"`
	Name        string     `gorm:"type:text;not null" json:"name"`
	Description string     `gorm:"type:text" json:"description,omitempty"`
	CreatedBy   string     `gorm:"type:text;index;not null" json:"createdBy"`
	ArchivedAt  *time.Time `json:"archivedAt,omitempty"`
}
