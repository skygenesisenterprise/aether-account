package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type InMemoryEventBus struct {
	mu       sync.RWMutex
	handlers map[string][]interfaces.EventHandler
}

func NewInMemoryEventBus() *InMemoryEventBus {
	return &InMemoryEventBus{handlers: map[string][]interfaces.EventHandler{}}
}

func (b *InMemoryEventBus) Publish(ctx context.Context, event interfaces.Event) error {
	b.mu.RLock()
	handlers := append([]interfaces.EventHandler{}, b.handlers[event.Topic]...)
	handlers = append(handlers, b.handlers["*"]...)
	b.mu.RUnlock()
	for _, handler := range handlers {
		if err := handler(ctx, event); err != nil {
			return err
		}
	}
	return nil
}

func (b *InMemoryEventBus) Subscribe(ctx context.Context, topic string, handler interfaces.EventHandler) error {
	b.mu.Lock()
	b.handlers[topic] = append(b.handlers[topic], handler)
	b.mu.Unlock()
	go func() {
		<-ctx.Done()
		b.mu.Lock()
		defer b.mu.Unlock()
		handlers := b.handlers[topic]
		for i, item := range handlers {
			if fmt.Sprintf("%p", item) == fmt.Sprintf("%p", handler) {
				b.handlers[topic] = append(handlers[:i], handlers[i+1:]...)
				break
			}
		}
	}()
	return nil
}

func (b *InMemoryEventBus) Close() error                  { return nil }
func (b *InMemoryEventBus) Healthy(context.Context) error { return nil }

type RedisEventBus struct {
	redis  *redisclient.Client
	prefix string
	pubsub sync.Map
}

func NewRedisEventBus(redis *redisclient.Client, prefix string) *RedisEventBus {
	return &RedisEventBus{redis: redis, prefix: prefix}
}

func (b *RedisEventBus) Publish(ctx context.Context, event interfaces.Event) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return b.redis.Raw.Publish(ctx, b.channel(event.Topic), payload).Err()
}

func (b *RedisEventBus) Subscribe(ctx context.Context, topic string, handler interfaces.EventHandler) error {
	pattern := b.channel(topic)
	pubsub := b.redis.Raw.PSubscribe(ctx, pattern)
	go func() {
		defer b.pubsub.Delete(pattern)
		go func() {
			<-ctx.Done()
			_ = pubsub.Close()
		}()
		ch := pubsub.Channel()
		for message := range ch {
			var event interfaces.Event
			if err := json.Unmarshal([]byte(message.Payload), &event); err == nil {
				_ = handler(ctx, event)
			}
		}
	}()
	b.pubsub.Store(pattern, pubsub)
	return nil
}

func (b *RedisEventBus) Close() error {
	b.pubsub.Range(func(_, value any) bool {
		if pubsub, ok := value.(redisclientPubSubShim); ok {
			_ = pubsub.Close()
		}
		return true
	})
	return nil
}

func (b *RedisEventBus) Healthy(ctx context.Context) error {
	return b.redis.Raw.Ping(ctx).Err()
}

func (b *RedisEventBus) channel(topic string) string {
	if topic == "" || topic == "*" {
		return b.prefix + ":events:*"
	}
	return b.prefix + ":events:" + topic
}

type redisclientPubSubShim interface{ Close() error }

type Hub struct {
	logger           *slog.Logger
	upgrader         websocket.Upgrader
	clients          map[*client]struct{}
	mu               sync.RWMutex
	bus              interfaces.EventBus
	presence         *PresenceService
	workspaceService *WorkspaceService
	conversations    *ConversationService
	heartbeat        time.Duration
	timeout          time.Duration
	origins          map[string]struct{}
	cancel           context.CancelFunc
}

type client struct {
	conn          *websocket.Conn
	send          chan []byte
	principal     interfaces.Principal
	workspaces    map[string]struct{}
	conversations map[string]struct{}
	closeOnce     sync.Once
}

type RealtimeCommand struct {
	Type           string         `json:"type"`
	WorkspaceID    string         `json:"workspaceId,omitempty"`
	ConversationID string         `json:"conversationId,omitempty"`
	Data           map[string]any `json:"data,omitempty"`
}

func NewEventBus(cfg config.Config, redis *redisclient.Client) interfaces.EventBus {
	if redis != nil && redis.Raw != nil {
		return NewRedisEventBus(redis, cfg.Redis.KeyPrefix)
	}
	return NewInMemoryEventBus()
}

func NewHub(ctx context.Context, logger *slog.Logger, cfg config.RealtimeConfig, origins []string, bus interfaces.EventBus, presence *PresenceService, workspaces *WorkspaceService, conversations *ConversationService) *Hub {
	subCtx, cancel := context.WithCancel(ctx)
	allowedOrigins := map[string]struct{}{}
	for _, origin := range origins {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			allowedOrigins[origin] = struct{}{}
		}
	}
	h := &Hub{
		logger:   logger,
		upgrader: websocket.Upgrader{
			CheckOrigin:  func(r *http.Request) bool { return isAllowedOrigin(allowedOrigins, r) },
			Subprotocols: []string{"bearer"},
		},
		clients:  map[*client]struct{}{},
		bus:      bus, presence: presence, workspaceService: workspaces, conversations: conversations,
		heartbeat: cfg.HeartbeatInterval, timeout: cfg.ClientTimeout,
		origins: allowedOrigins, cancel: cancel,
	}
	_ = bus.Subscribe(subCtx, "*", h.handleEvent)
	return h
}

func (h *Hub) Healthy(context.Context) error { return nil }

func (h *Hub) Close() error {
	h.cancel()
	h.mu.Lock()
	clients := make([]*client, 0, len(h.clients))
	for client := range h.clients {
		clients = append(clients, client)
		delete(h.clients, client)
	}
	h.mu.Unlock()
	for _, client := range clients {
		client.close()
	}
	return nil
}

func (h *Hub) Handle(c *gin.Context, principal interfaces.Principal) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	cl := &client{
		conn:          conn,
		send:          make(chan []byte, 32),
		principal:     principal,
		workspaces:    map[string]struct{}{},
		conversations: map[string]struct{}{},
	}
	h.mu.Lock()
	h.clients[cl] = struct{}{}
	h.mu.Unlock()

	go h.writeLoop(cl)
	h.readLoop(c.Request.Context(), cl)
}

func (h *Hub) readLoop(ctx context.Context, cl *client) {
	defer func() {
		h.removeClient(cl)
		for workspaceID := range cl.workspaces {
			_ = h.presence.SetSessionState(ctx, workspaceID, cl.principal.UserID, false, 0)
		}
	}()
	_ = cl.conn.SetReadDeadline(time.Now().Add(h.timeout))
	cl.conn.SetPongHandler(func(string) error {
		return cl.conn.SetReadDeadline(time.Now().Add(h.timeout))
	})
	for {
		var cmd RealtimeCommand
		if err := cl.conn.ReadJSON(&cmd); err != nil {
			return
		}
		switch strings.ToLower(cmd.Type) {
		case "subscribe":
			if cmd.WorkspaceID != "" {
				if _, err := h.workspaceService.AuthorizeWorkspace(ctx, cl.principal, cmd.WorkspaceID); err == nil {
					cl.workspaces[cmd.WorkspaceID] = struct{}{}
					_ = h.presence.SetSessionState(ctx, cmd.WorkspaceID, cl.principal.UserID, true, 1)
				}
			}
			if cmd.ConversationID != "" {
				if _, err := h.conversations.Get(ctx, cl.principal, cmd.ConversationID); err == nil {
					cl.conversations[cmd.ConversationID] = struct{}{}
				}
			}
		case "typing.started", "typing.stopped":
			if cmd.ConversationID == "" || cmd.WorkspaceID == "" {
				continue
			}
			if _, ok := cl.workspaces[cmd.WorkspaceID]; !ok {
				continue
			}
			_ = h.bus.Publish(ctx, interfaces.Event{
				ID:             utils.NewID(),
				Topic:          "workspace." + cmd.WorkspaceID,
				Type:           cmd.Type,
				WorkspaceID:    cmd.WorkspaceID,
				ConversationID: cmd.ConversationID,
				ActorID:        cl.principal.UserID,
				Timestamp:      time.Now().UTC().Format(time.RFC3339),
			})
		case "call_invitation":
			if cmd.ConversationID == "" || cmd.WorkspaceID == "" {
				continue
			}
			if _, ok := cl.workspaces[cmd.WorkspaceID]; !ok {
				continue
			}
			_ = h.bus.Publish(ctx, interfaces.Event{
				ID:             utils.NewID(),
				Topic:          "workspace." + cmd.WorkspaceID,
				Type:           cmd.Type,
				WorkspaceID:    cmd.WorkspaceID,
				ConversationID: cmd.ConversationID,
				ActorID:        cl.principal.UserID,
				Timestamp:      time.Now().UTC().Format(time.RFC3339),
				Payload:        cmd.Data,
			})
		}
	}
}

func (h *Hub) writeLoop(cl *client) {
	ticker := time.NewTicker(h.heartbeat)
	defer ticker.Stop()
	for {
		select {
		case payload, ok := <-cl.send:
			if !ok {
				return
			}
			_ = cl.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if err := cl.conn.WriteMessage(websocket.TextMessage, payload); err != nil {
				h.removeClient(cl)
				return
			}
		case <-ticker.C:
			for workspaceID := range cl.workspaces {
				_ = h.presence.SetSessionState(context.Background(), workspaceID, cl.principal.UserID, true, 1)
			}
			_ = cl.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if err := cl.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				h.removeClient(cl)
				return
			}
		}
	}
}

func (h *Hub) handleEvent(_ context.Context, event interfaces.Event) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	var slow []*client
	h.mu.RLock()
	for cl := range h.clients {
		if _, ok := cl.workspaces[event.WorkspaceID]; !ok && event.WorkspaceID != "" {
			if _, ok := cl.conversations[event.ConversationID]; !ok || event.ConversationID == "" {
				continue
			}
		}
		select {
		case cl.send <- payload:
		default:
			slow = append(slow, cl)
		}
	}
	h.mu.RUnlock()
	for _, cl := range slow {
		h.removeClient(cl)
	}
	return nil
}

func (h *Hub) removeClient(cl *client) {
	h.mu.Lock()
	delete(h.clients, cl)
	h.mu.Unlock()
	cl.close()
}

func (c *client) close() {
	c.closeOnce.Do(func() {
		close(c.send)
		_ = c.conn.Close()
	})
}

func isAllowedOrigin(allowed map[string]struct{}, r *http.Request) bool {
	if len(allowed) == 0 {
		return false
	}
	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin == "" {
		return false
	}
	if _, ok := allowed["*"]; ok {
		return true
	}
	if _, ok := allowed[origin]; ok {
		return true
	}
	parsed, err := url.Parse(origin)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return false
	}
	return false
}
