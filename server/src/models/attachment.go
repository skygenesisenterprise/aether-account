package models

type Attachment struct {
	Common
	WorkspaceID string `gorm:"type:text;index;not null" json:"workspaceId"`
	OwnerID     string `gorm:"type:text;index;not null" json:"ownerId"`
	Name        string `gorm:"type:text;not null" json:"name"`
	ContentType string `gorm:"type:text" json:"contentType,omitempty"`
	StorageKey  string `gorm:"type:text;index" json:"storageKey,omitempty"`
	Status      string `gorm:"type:text;index;not null" json:"status"`
	SizeBytes   int64  `gorm:"not null;default:0" json:"sizeBytes"`
	Metadata    []byte `gorm:"type:jsonb" json:"metadata,omitempty"`
}
