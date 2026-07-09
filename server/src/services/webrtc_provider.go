package services

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	lkauth "github.com/livekit/protocol/auth"
	livekit "github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type DisabledWebRTCProvider struct{}

func (p *DisabledWebRTCProvider) CreateRoom(context.Context, interfaces.CreateRoomInput) (*interfaces.ProviderRoom, error) {
	return nil, utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) GetRoom(context.Context, string) (*interfaces.ProviderRoom, error) {
	return nil, utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) ListRooms(context.Context) ([]interfaces.ProviderRoom, error) {
	return nil, utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) DeleteRoom(context.Context, string) error {
	return utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) CreateJoinToken(context.Context, interfaces.JoinTokenInput) (*interfaces.JoinToken, error) {
	return nil, utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) RemoveParticipant(context.Context, string, string) error {
	return utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) MuteParticipantTrack(context.Context, interfaces.MuteTrackInput) error {
	return utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) ListParticipants(context.Context, string) ([]interfaces.ProviderParticipant, error) {
	return nil, utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) Healthy(context.Context) error {
	return utils.ErrMeetingProviderUnavailable
}
func (p *DisabledWebRTCProvider) PublicURL() string    { return "" }
func (p *DisabledWebRTCProvider) InternalURL() string  { return "" }
func (p *DisabledWebRTCProvider) ProviderName() string { return "disabled" }

type LiveKitProvider struct {
	cfg        config.Config
	roomClient *lksdk.RoomServiceClient
	keyAuth    lkauth.KeyProvider
}

func NewWebRTCProvider(cfg config.Config) interfaces.WebRTCProvider {
	if cfg.WebRTC.Provider != "livekit" {
		return &DisabledWebRTCProvider{}
	}
	return &LiveKitProvider{
		cfg:        cfg,
		roomClient: lksdk.NewRoomServiceClient(cfg.LiveKit.InternalURL, cfg.LiveKit.APIKey, cfg.LiveKit.APISecret),
		keyAuth:    lkauth.NewSimpleKeyProvider(cfg.LiveKit.APIKey, cfg.LiveKit.APISecret),
	}
}

func (p *LiveKitProvider) ProviderName() string { return "livekit" }
func (p *LiveKitProvider) PublicURL() string    { return p.cfg.WebRTC.PublicURL }
func (p *LiveKitProvider) InternalURL() string  { return p.cfg.LiveKit.InternalURL }

func (p *LiveKitProvider) CreateRoom(ctx context.Context, input interfaces.CreateRoomInput) (*interfaces.ProviderRoom, error) {
	start := time.Now()
	room, err := p.roomClient.CreateRoom(ctx, &livekit.CreateRoomRequest{
		Name:         input.RoomName,
		EmptyTimeout: input.EmptyTimeout,
		Metadata:     mustJSON(input.Metadata),
	})
	if err != nil {
		return nil, err
	}
	createdAt := time.Now().UTC()
	if ts := room.GetCreationTime(); ts > 0 {
		createdAt = time.Unix(ts, 0).UTC()
	}
	_ = start
	return &interfaces.ProviderRoom{
		ID:        room.GetSid(),
		Name:      room.GetName(),
		URL:       p.cfg.WebRTC.PublicURL,
		Provider:  p.ProviderName(),
		CreatedAt: createdAt,
	}, nil
}

func (p *LiveKitProvider) GetRoom(ctx context.Context, roomName string) (*interfaces.ProviderRoom, error) {
	rooms, err := p.roomClient.ListRooms(ctx, &livekit.ListRoomsRequest{Names: []string{roomName}})
	if err != nil {
		return nil, err
	}
	if len(rooms.GetRooms()) == 0 {
		return nil, utils.NewError(404, "PROVIDER_ROOM_NOT_FOUND", "The provider room was not found.", nil)
	}
	room := rooms.GetRooms()[0]
	createdAt := time.Now().UTC()
	if ts := room.GetCreationTime(); ts > 0 {
		createdAt = time.Unix(ts, 0).UTC()
	}
	return &interfaces.ProviderRoom{
		ID:        room.GetSid(),
		Name:      room.GetName(),
		URL:       p.cfg.WebRTC.PublicURL,
		Provider:  p.ProviderName(),
		CreatedAt: createdAt,
	}, nil
}

func (p *LiveKitProvider) ListRooms(ctx context.Context) ([]interfaces.ProviderRoom, error) {
	resp, err := p.roomClient.ListRooms(ctx, &livekit.ListRoomsRequest{})
	if err != nil {
		return nil, err
	}
	items := make([]interfaces.ProviderRoom, 0, len(resp.GetRooms()))
	for _, room := range resp.GetRooms() {
		createdAt := time.Now().UTC()
		if ts := room.GetCreationTime(); ts > 0 {
			createdAt = time.Unix(ts, 0).UTC()
		}
		items = append(items, interfaces.ProviderRoom{
			ID:        room.GetSid(),
			Name:      room.GetName(),
			URL:       p.cfg.WebRTC.PublicURL,
			Provider:  p.ProviderName(),
			CreatedAt: createdAt,
		})
	}
	return items, nil
}

func (p *LiveKitProvider) DeleteRoom(ctx context.Context, roomName string) error {
	_, err := p.roomClient.DeleteRoom(ctx, &livekit.DeleteRoomRequest{Room: roomName})
	return err
}

func (p *LiveKitProvider) CreateJoinToken(ctx context.Context, input interfaces.JoinTokenInput) (*interfaces.JoinToken, error) {
	_ = ctx
	canPublish := input.Permissions.CanPublishAudio || input.Permissions.CanPublishVideo || input.Permissions.CanPublishScreen
	grant := &lkauth.VideoGrant{
		RoomJoin:          input.Permissions.CanJoin,
		RoomAdmin:         input.Permissions.CanModerate,
		RoomRecord:        input.Permissions.CanRecord,
		Room:              input.RoomName,
		CanPublish:        boolPtr(canPublish),
		CanSubscribe:      boolPtr(input.Permissions.CanSubscribe),
		CanPublishData:    boolPtr(input.Permissions.CanJoin),
		CanPublishSources: input.Permissions.PublishSources,
	}
	token := lkauth.NewAccessToken(p.cfg.LiveKit.APIKey, p.cfg.LiveKit.APISecret).
		SetIdentity(input.ParticipantIdentity).
		SetName(input.ParticipantName).
		SetMetadata(input.Metadata).
		SetAttributes(input.Attributes).
		SetVideoGrant(grant).
		SetValidFor(input.TTL)

	jwt, err := token.ToJWT()
	if err != nil {
		return nil, err
	}
	return &interfaces.JoinToken{
		Token:               jwt,
		MeetingID:           input.MeetingID,
		SessionID:           input.SessionID,
		RoomName:            input.RoomName,
		ParticipantIdentity: input.ParticipantIdentity,
		SignalingURL:        p.cfg.WebRTC.PublicURL,
		ExpiresAt:           time.Now().UTC().Add(input.TTL),
		ICEServers:          buildICEServers(p.cfg),
	}, nil
}

func (p *LiveKitProvider) RemoveParticipant(ctx context.Context, roomName string, identity string) error {
	_, err := p.roomClient.RemoveParticipant(ctx, &livekit.RoomParticipantIdentity{Room: roomName, Identity: identity})
	return err
}

func (p *LiveKitProvider) MuteParticipantTrack(ctx context.Context, input interfaces.MuteTrackInput) error {
	_, err := p.roomClient.MutePublishedTrack(ctx, &livekit.MuteRoomTrackRequest{
		Room:     input.RoomName,
		Identity: input.Identity,
		TrackSid: input.TrackSID,
		Muted:    input.Muted,
	})
	return err
}

func (p *LiveKitProvider) ListParticipants(ctx context.Context, roomName string) ([]interfaces.ProviderParticipant, error) {
	resp, err := p.roomClient.ListParticipants(ctx, &livekit.ListParticipantsRequest{Room: roomName})
	if err != nil {
		return nil, err
	}
	items := make([]interfaces.ProviderParticipant, 0, len(resp.GetParticipants()))
	for _, participant := range resp.GetParticipants() {
		items = append(items, interfaces.ProviderParticipant{
			Identity: participant.GetIdentity(),
			Name:     participant.GetName(),
			State:    participant.GetState().String(),
			Metadata: participant.GetMetadata(),
		})
	}
	return items, nil
}

func (p *LiveKitProvider) Healthy(ctx context.Context) error {
	_, err := p.roomClient.ListRooms(ctx, &livekit.ListRoomsRequest{})
	return err
}

type StaticNodeSelector struct {
	nodes interfaces.WebRTCNodeRepository
	cfg   config.Config
}

func NewNodeSelector(nodes interfaces.WebRTCNodeRepository, cfg config.Config) interfaces.NodeSelector {
	return &StaticNodeSelector{nodes: nodes, cfg: cfg}
}

func (s *StaticNodeSelector) SelectNode(ctx context.Context, workspaceID string, region string) (*models.WebRTCNode, error) {
	_ = workspaceID
	items, err := s.nodes.ListHealthy(ctx, s.cfg.WebRTC.Provider)
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, utils.ErrMeetingSessionUnavailable
	}
	if region != "" {
		for _, item := range items {
			if strings.EqualFold(item.Region, region) {
				return &item, nil
			}
		}
	}
	return &items[0], nil
}

func buildICEServers(cfg config.Config) []models.ICEServer {
	servers := []models.ICEServer{{URLs: []string{"stun:stun.l.google.com:19302"}}}
	if cfg.WebRTC.TURN.Enabled && cfg.WebRTC.TURN.URL != "" {
		servers = append(servers, models.ICEServer{
			URLs:       []string{cfg.WebRTC.TURN.URL},
			Username:   cfg.WebRTC.TURN.Username,
			Credential: cfg.WebRTC.TURN.Password,
		})
	}
	return servers
}

func mustJSON(v any) string {
	body, err := json.Marshal(v)
	if err != nil || string(body) == "null" {
		return ""
	}
	return string(body)
}

func boolPtr(v bool) *bool { return &v }
