package interfaces

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/skygenesisenterprise/aether-meet/server/src/models"
)

type Principal struct {
	UserID      string   `json:"userId"`
	WorkspaceID string   `json:"workspaceId,omitempty"`
	Roles       []string `json:"roles,omitempty"`
	Permissions []string `json:"permissions,omitempty"`
	SessionID   string   `json:"sessionId,omitempty"`
}

type IdentityProvider interface {
	Authenticate(ctx context.Context, token string) (*Principal, error)
	IssueToken(ctx context.Context, principal Principal) (string, error)
}

type ProviderRoom struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	URL       string    `json:"url,omitempty"`
	Provider  string    `json:"provider,omitempty"`
	NodeID    string    `json:"nodeId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	ClosedAt  time.Time `json:"closedAt,omitempty"`
}

type CreateRoomInput struct {
	MeetingID    string
	WorkspaceID  string
	RoomName     string
	EmptyTimeout uint32
	Metadata     map[string]string
}

type JoinTokenPermissions struct {
	Role                  string   `json:"role"`
	CanJoin               bool     `json:"canJoin"`
	CanPublishAudio       bool     `json:"canPublishAudio"`
	CanPublishVideo       bool     `json:"canPublishVideo"`
	CanPublishScreen      bool     `json:"canPublishScreen"`
	CanSubscribe          bool     `json:"canSubscribe"`
	CanModerate           bool     `json:"canModerate"`
	CanRecord             bool     `json:"canRecord"`
	CanRemoveParticipants bool     `json:"canRemoveParticipants"`
	PublishSources        []string `json:"publishSources,omitempty"`
}

type JoinTokenInput struct {
	MeetingID           string
	WorkspaceID         string
	SessionID           string
	RoomName            string
	ParticipantIdentity string
	ParticipantName     string
	Metadata            string
	Attributes          map[string]string
	Permissions         JoinTokenPermissions
	TTL                 time.Duration
}

type JoinToken struct {
	Token               string             `json:"token"`
	MeetingID           string             `json:"meetingId"`
	SessionID           string             `json:"sessionId"`
	RoomName            string             `json:"roomName"`
	ParticipantIdentity string             `json:"participantIdentity"`
	SignalingURL        string             `json:"signalingUrl"`
	ExpiresAt           time.Time          `json:"expiresAt"`
	ICEServers          []models.ICEServer `json:"iceServers,omitempty"`
}

type MuteTrackInput struct {
	RoomName string
	Identity string
	TrackSID string
	Muted    bool
}

type ProviderParticipant struct {
	Identity string `json:"identity"`
	Name     string `json:"name,omitempty"`
	State    string `json:"state,omitempty"`
	Metadata string `json:"metadata,omitempty"`
}

type WebRTCProvider interface {
	CreateRoom(ctx context.Context, input CreateRoomInput) (*ProviderRoom, error)
	GetRoom(ctx context.Context, roomName string) (*ProviderRoom, error)
	ListRooms(ctx context.Context) ([]ProviderRoom, error)
	DeleteRoom(ctx context.Context, roomName string) error
	CreateJoinToken(ctx context.Context, input JoinTokenInput) (*JoinToken, error)
	RemoveParticipant(ctx context.Context, roomName string, identity string) error
	MuteParticipantTrack(ctx context.Context, input MuteTrackInput) error
	ListParticipants(ctx context.Context, roomName string) ([]ProviderParticipant, error)
	Healthy(ctx context.Context) error
	PublicURL() string
	InternalURL() string
	ProviderName() string
}

type NodeSelector interface {
	SelectNode(ctx context.Context, workspaceID string, region string) (*models.WebRTCNode, error)
}

type Object struct {
	Key         string
	ContentType string
	Body        io.Reader
	Size        int64
}

type ObjectStorage interface {
	Put(ctx context.Context, object Object) error
	Get(ctx context.Context, key string) (io.ReadCloser, error)
	Delete(ctx context.Context, key string) error
	SignedURL(ctx context.Context, key string, ttl time.Duration) (string, error)
}

type IntegrationProvider interface {
	Name() string
	ValidateConfiguration(ctx context.Context, config map[string]any) error
	HandleWebhook(ctx context.Context, integration models.Integration, payload []byte, headers http.Header) ([]Event, error)
}

type JobHandler func(ctx context.Context, job models.Job) error

type JobQueue interface {
	Enqueue(ctx context.Context, queue string, job models.Job) error
	Consume(ctx context.Context, queue string, consumerGroup string, consumerName string, handler JobHandler) error
	Retry(ctx context.Context, queue string, job models.Job, delay time.Duration, cause error) error
	DeadLetter(ctx context.Context, queue string, job models.Job, cause error) error
	ListDeadLetters(ctx context.Context, queue string, limit int) ([]models.Job, error)
	Close() error
	Healthy(ctx context.Context) error
}

type JobProducer interface {
	EnqueueJob(ctx context.Context, queue string, jobType string, payload any, options JobOptions) (models.Job, error)
}

type JobOptions struct {
	WorkspaceID    string
	ActorID        string
	IdempotencyKey string
	MaxAttempts    int
	AvailableAt    time.Time
	Payload        json.RawMessage
}
