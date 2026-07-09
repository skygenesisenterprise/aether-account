package models

type Integration struct {
	Common
	WorkspaceID   string `gorm:"type:text;index;not null" json:"workspaceId"`
	Provider      string `gorm:"type:text;index;not null" json:"provider"`
	Name          string `gorm:"type:text;not null" json:"name"`
	Status        string `gorm:"type:text;index;not null" json:"status"`
	Configuration []byte `gorm:"type:jsonb" json:"configuration,omitempty"`
	CreatedBy     string `gorm:"type:text;index;not null" json:"createdBy"`
}
