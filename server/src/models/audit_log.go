package models

type AuditLog struct {
	Common
	WorkspaceID  string `gorm:"type:text;index;not null" json:"workspaceId"`
	ActorID      string `gorm:"type:text;index;not null" json:"actorId"`
	Action       string `gorm:"type:text;index;not null" json:"action"`
	ResourceType string `gorm:"type:text;index;not null" json:"resourceType"`
	ResourceID   string `gorm:"type:text;index;not null" json:"resourceId"`
	Metadata     []byte `gorm:"type:jsonb" json:"metadata,omitempty"`
	IPAddress    string `gorm:"type:text" json:"ipAddress,omitempty"`
	UserAgent    string `gorm:"type:text" json:"userAgent,omitempty"`
}
