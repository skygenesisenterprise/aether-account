package models

import "time"

type Task struct {
	Common
	WorkspaceID    string     `gorm:"type:text;index;not null" json:"workspaceId"`
	Title          string     `gorm:"type:text;not null" json:"title"`
	Description    string     `gorm:"type:text" json:"description,omitempty"`
	Status         string     `gorm:"type:text;index;not null;default:'inbox'" json:"status"`
	Priority       string     `gorm:"type:text;index;not null;default:'medium'" json:"priority"`
	Project        string     `gorm:"type:text" json:"project,omitempty"`
	AssigneeUserID *string    `gorm:"type:text;index" json:"assigneeUserId,omitempty"`
	CreatedBy      string     `gorm:"type:text;index;not null" json:"createdBy"`
	DueAt          *time.Time `json:"dueAt,omitempty"`
	CompletedAt    *time.Time `json:"completedAt,omitempty"`
	ArchivedAt     *time.Time `json:"archivedAt,omitempty"`
}

