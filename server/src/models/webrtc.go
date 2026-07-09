package models

import "time"

type MeetingSession struct {
	Common
	MeetingID         string     `gorm:"type:text;index;not null" json:"meetingId"`
	WorkspaceID       string     `gorm:"type:text;index;not null" json:"workspaceId"`
	Provider          string     `gorm:"type:text;index;not null" json:"provider"`
	ProviderRoomName  string     `gorm:"type:text;uniqueIndex;not null" json:"providerRoomName"`
	ProviderRoomID    string     `gorm:"type:text;index" json:"providerRoomId,omitempty"`
	NodeID            string     `gorm:"type:text;index;not null" json:"nodeId"`
	Status            string     `gorm:"type:text;index;not null" json:"status"`
	PublicURL         string     `gorm:"type:text;not null" json:"publicUrl"`
	SignalingURL      string     `gorm:"type:text;not null" json:"signalingUrl"`
	ConnectionDetails []byte     `gorm:"type:jsonb" json:"connectionDetails,omitempty"`
	StartedAt         *time.Time `json:"startedAt,omitempty"`
	EndedAt           *time.Time `json:"endedAt,omitempty"`
}

type MeetingSessionParticipant struct {
	Common
	SessionID        string     `gorm:"type:text;index;not null" json:"sessionId"`
	WorkspaceID      string     `gorm:"type:text;index;not null" json:"workspaceId"`
	UserID           string     `gorm:"type:text;index;not null" json:"userId"`
	ProviderIdentity string     `gorm:"type:text;index;not null" json:"providerIdentity"`
	Role             string     `gorm:"type:text;index;not null" json:"role"`
	Status           string     `gorm:"type:text;index;not null" json:"status"`
	Metadata         []byte     `gorm:"type:jsonb" json:"metadata,omitempty"`
	JoinedAt         *time.Time `json:"joinedAt,omitempty"`
	LeftAt           *time.Time `json:"leftAt,omitempty"`
	LastSeenAt       *time.Time `json:"lastSeenAt,omitempty"`
}

type WebRTCNode struct {
	Common
	Provider           string     `gorm:"type:text;index;not null" json:"provider"`
	Region             string     `gorm:"type:text;index;not null" json:"region"`
	InternalURL        string     `gorm:"type:text;not null" json:"internalUrl"`
	PublicURL          string     `gorm:"type:text;not null" json:"publicUrl"`
	Status             string     `gorm:"type:text;index;not null" json:"status"`
	Capacity           int        `gorm:"not null;default:0" json:"capacity"`
	ActiveRooms        int        `gorm:"not null;default:0" json:"activeRooms"`
	ActiveParticipants int        `gorm:"not null;default:0" json:"activeParticipants"`
	LastHeartbeatAt    *time.Time `gorm:"index" json:"lastHeartbeatAt,omitempty"`
	Draining           bool       `gorm:"not null;default:false" json:"draining"`
}

type WebRTCWebhookEvent struct {
	Common
	Provider     string    `gorm:"type:text;index;not null" json:"provider"`
	EventID      string    `gorm:"type:text;uniqueIndex;not null" json:"eventId"`
	EventType    string    `gorm:"type:text;index;not null" json:"eventType"`
	WorkspaceID  string    `gorm:"type:text;index" json:"workspaceId,omitempty"`
	MeetingID    string    `gorm:"type:text;index" json:"meetingId,omitempty"`
	SessionID    string    `gorm:"type:text;index" json:"sessionId,omitempty"`
	ProviderRoom string    `gorm:"type:text;index" json:"providerRoom,omitempty"`
	ReceivedAt   time.Time `gorm:"not null" json:"receivedAt"`
	Payload      []byte    `gorm:"type:jsonb;not null" json:"payload"`
}

type ICEServer struct {
	URLs       []string `json:"urls"`
	Username   string   `json:"username,omitempty"`
	Credential string   `json:"credential,omitempty"`
}
