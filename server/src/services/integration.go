package services

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type GenericWebhookProvider struct{}

func (p *GenericWebhookProvider) Name() string { return "webhook" }
func (p *GenericWebhookProvider) ValidateConfiguration(_ context.Context, _ map[string]any) error {
	return nil
}
func (p *GenericWebhookProvider) HandleWebhook(_ context.Context, integration models.Integration, payload []byte, _ http.Header) ([]interfaces.Event, error) {
	var data map[string]any
	if len(payload) > 0 {
		_ = json.Unmarshal(payload, &data)
	}
	targetConversationID := ""
	title := "Webhook event"
	body := "A webhook event was received."
	severity := "info"
	externalURL := ""
	if len(integration.Configuration) > 0 {
		var cfg map[string]any
		if err := json.Unmarshal(integration.Configuration, &cfg); err == nil {
			targetConversationID = stringify(cfg["conversationId"])
			title = coalesceString(stringify(cfg["title"]), title)
			body = coalesceString(stringify(cfg["body"]), body)
			severity = coalesceString(stringify(cfg["severity"]), severity)
			externalURL = stringify(cfg["externalUrl"])
		}
	}
	return []interfaces.Event{{
		ID:             utils.NewID(),
		Topic:          "workspace." + integration.WorkspaceID,
		Type:           "integration.event",
		WorkspaceID:    integration.WorkspaceID,
		ConversationID: targetConversationID,
		Timestamp:      time.Now().UTC().Format(time.RFC3339),
		Payload: map[string]any{
			"integrationId": integration.ID,
			"provider":      integration.Provider,
			"title":         title,
			"body":          body,
			"severity":      severity,
			"externalUrl":   externalURL,
			"metadata":      data,
		},
	}}, nil
}

type IntegrationService struct {
	integrations interfaces.IntegrationRepository
	workspaces   *WorkspaceService
	bus          interfaces.EventBus
	providers    map[string]interfaces.IntegrationProvider
	messages     interfaces.MessageRepository
	producer     interfaces.JobProducer
}

func NewIntegrationService(integrations interfaces.IntegrationRepository, workspaces *WorkspaceService, bus interfaces.EventBus, messages interfaces.MessageRepository, producer interfaces.JobProducer) *IntegrationService {
	return &IntegrationService{
		integrations: integrations,
		workspaces:   workspaces,
		bus:          bus,
		messages:     messages,
		producer:     producer,
		providers: map[string]interfaces.IntegrationProvider{
			"webhook": &GenericWebhookProvider{},
		},
	}
}

func (s *IntegrationService) List(ctx context.Context, principal interfaces.Principal, workspaceID string) ([]models.Integration, error) {
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID); err != nil {
		return nil, err
	}
	return s.integrations.ListByWorkspace(ctx, workspaceID)
}

func (s *IntegrationService) Create(ctx context.Context, principal interfaces.Principal, workspaceID, provider, name string, config map[string]any) (*models.Integration, error) {
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, workspaceID)
	if err != nil {
		return nil, err
	}
	if !isAdminRole(member.Role) || !utils.ValidProvider(provider) {
		return nil, utils.ErrForbidden
	}
	cfgBytes, _ := json.Marshal(config)
	now := time.Now().UTC()
	item := &models.Integration{
		Common:      models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		WorkspaceID: workspaceID, Provider: provider, Name: strings.TrimSpace(name),
		Status: "active", Configuration: cfgBytes, CreatedBy: principal.UserID,
	}
	return item, s.integrations.Create(ctx, item)
}

func (s *IntegrationService) Get(ctx context.Context, principal interfaces.Principal, id string) (*models.Integration, error) {
	item, err := s.integrations.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if _, err := s.workspaces.AuthorizeWorkspace(ctx, principal, item.WorkspaceID); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *IntegrationService) Update(ctx context.Context, principal interfaces.Principal, id, name, status string) (*models.Integration, error) {
	item, err := s.Get(ctx, principal, id)
	if err != nil {
		return nil, err
	}
	item.Name = strings.TrimSpace(name)
	if status != "" {
		item.Status = status
	}
	item.UpdatedAt = time.Now().UTC()
	return item, s.integrations.Update(ctx, item)
}

func (s *IntegrationService) Delete(ctx context.Context, principal interfaces.Principal, id string) error {
	item, err := s.Get(ctx, principal, id)
	if err != nil {
		return err
	}
	member, err := s.workspaces.AuthorizeWorkspace(ctx, principal, item.WorkspaceID)
	if err != nil {
		return err
	}
	if !isAdminRole(member.Role) {
		return utils.ErrForbidden
	}
	return s.integrations.Delete(ctx, id)
}

func (s *IntegrationService) HandleWebhook(ctx context.Context, provider, integrationID string, payload []byte, headers http.Header) error {
	integration, err := s.integrations.GetByID(ctx, integrationID)
	if err != nil {
		return err
	}
	handler, ok := s.providers[provider]
	if !ok {
		return utils.ErrIntegrationNotConfigured
	}
	if s.producer == nil {
		return utils.ErrWorkerUnavailable
	}
	_, _ = handler, headers
	_, err = s.producer.EnqueueJob(ctx, "integrations", "integration.webhook.process", payload, interfaces.JobOptions{
		WorkspaceID: integration.WorkspaceID,
		ActorID:     integration.CreatedBy,
		Payload:     mustMarshalWebhookPayload(provider, integrationID, payload, headers),
	})
	return err
}

func (s *IntegrationService) ProcessWebhook(ctx context.Context, provider, integrationID string, payload []byte, headers http.Header) error {
	integration, err := s.integrations.GetByID(ctx, integrationID)
	if err != nil {
		return Permanent(err)
	}
	handler, ok := s.providers[provider]
	if !ok {
		return Permanent(utils.ErrIntegrationNotConfigured)
	}
	events, err := handler.HandleWebhook(ctx, *integration, payload, headers)
	if err != nil {
		return Retryable(err)
	}
	for _, event := range events {
		if event.Type == "" {
			continue
		}
		if s.messages != nil && event.ConversationID != "" {
			metadata, _ := json.Marshal(event.Payload)
			message := &models.Message{
				Common:         models.Common{ID: utils.NewID(), CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()},
				WorkspaceID:    integration.WorkspaceID,
				ConversationID: event.ConversationID,
				AuthorID:       integration.CreatedBy,
				Type:           "integration",
				Content:        stringify(event.Payload["title"]),
				Metadata:       metadata,
			}
			if createErr := s.messages.Create(ctx, message); createErr != nil {
				return Retryable(createErr)
			}
		}
		if err := s.bus.Publish(ctx, event); err != nil {
			return Retryable(err)
		}
	}
	return nil
}

type webhookJobPayload struct {
	Provider      string      `json:"provider"`
	IntegrationID string      `json:"integrationId"`
	Payload       []byte      `json:"payload"`
	Headers       http.Header `json:"headers"`
}

func mustMarshalWebhookPayload(provider, integrationID string, payload []byte, headers http.Header) json.RawMessage {
	body, _ := json.Marshal(webhookJobPayload{
		Provider:      provider,
		IntegrationID: integrationID,
		Payload:       payload,
		Headers:       sanitizeHeaders(headers),
	})
	return body
}

func sanitizeHeaders(headers http.Header) http.Header {
	out := http.Header{}
	for key, values := range headers {
		if strings.EqualFold(key, "Authorization") {
			continue
		}
		cloned := make([]string, len(values))
		copy(cloned, values)
		out[key] = cloned
	}
	return out
}

func stringify(value any) string {
	if value == nil {
		return ""
	}
	switch item := value.(type) {
	case string:
		return item
	default:
		return ""
	}
}

func coalesceString(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}
