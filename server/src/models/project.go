package models

import "time"

type Project struct {
	Common
	WorkspaceID string     `gorm:"type:text;index;not null" json:"workspaceId"`
	Name        string     `gorm:"type:text;not null" json:"name"`
	Summary     string     `gorm:"type:text" json:"summary,omitempty"`
	Status      string     `gorm:"type:text;index;not null;default:'active'" json:"status"`
	Progress    int        `gorm:"not null;default:0" json:"progress"`
	Cadence     string     `gorm:"type:text" json:"cadence,omitempty"`
	OwnerUserID *string    `gorm:"type:text;index" json:"ownerUserId,omitempty"`
	CreatedBy   string     `gorm:"type:text;index;not null" json:"createdBy"`
	ArchivedAt  *time.Time `json:"archivedAt,omitempty"`
}

