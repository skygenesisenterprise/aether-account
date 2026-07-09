package models

import "gorm.io/datatypes"

type WorkspaceSSOConfig struct {
	Common
	WorkspaceID        string         `gorm:"column:workspace_id;type:text;uniqueIndex;not null" json:"workspaceId"`
	Provider           string         `gorm:"column:provider;type:text;not null;default:'oidc'" json:"provider"`
	Enabled            bool           `gorm:"column:enabled;not null;default:false" json:"enabled"`
	EnforceSSO         bool           `gorm:"column:enforce_sso;not null;default:false" json:"enforceSso"`
	AllowPasswordAuth  bool           `gorm:"column:allow_password_auth;not null;default:true" json:"allowPasswordAuth"`
	AllowAutoProvision bool           `gorm:"column:auto_provision;not null;default:true" json:"allowAutoProvision"`
	AllowIDPInitiated  bool           `gorm:"column:allow_idp_initiated;not null;default:false" json:"allowIdpInitiated"`
	DomainHint         string         `gorm:"column:domain_hint;type:text" json:"domainHint,omitempty"`
	IssuerURL          string         `gorm:"column:issuer_url;type:text" json:"issuerUrl,omitempty"`
	SSOURL             string         `gorm:"column:sso_url;type:text" json:"ssoUrl,omitempty"`
	EntityID           string         `gorm:"column:entity_id;type:text" json:"entityId,omitempty"`
	ClientID           string         `gorm:"column:client_id;type:text" json:"clientId,omitempty"`
	ClientSecret       string         `gorm:"column:client_secret;type:text" json:"-"`
	Certificate        string         `gorm:"column:certificate;type:text" json:"certificate,omitempty"`
	AllowedDomains     datatypes.JSON `gorm:"column:allowed_domains;type:jsonb;not null;default:'[]'" json:"allowedDomains,omitempty"`
	DefaultRole        string         `gorm:"column:default_role;type:text;not null;default:'member'" json:"defaultRole"`
	AttributeMapping   datatypes.JSON `gorm:"column:attribute_mapping;type:jsonb;not null;default:'{}'" json:"attributeMapping,omitempty"`
}

func (WorkspaceSSOConfig) TableName() string {
	return "workspace_sso_configs"
}
