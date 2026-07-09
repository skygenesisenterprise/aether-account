package services

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type OutboxService struct {
	logger   *slog.Logger
	cfg      config.OutboxConfig
	repo     interfaces.OutboxRepository
	producer interfaces.JobProducer
}

func NewOutboxService(logger *slog.Logger, cfg config.OutboxConfig, repo interfaces.OutboxRepository, producer interfaces.JobProducer) *OutboxService {
	return &OutboxService{logger: logger, cfg: cfg, repo: repo, producer: producer}
}

func (s *OutboxService) Add(ctx context.Context, repo interfaces.OutboxRepository, eventType string, aggregateType string, aggregateID string, workspaceID string, payload any) error {
	if repo == nil {
		repo = s.repo
	}
	if repo == nil {
		return nil
	}
	encoded, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	return repo.Create(ctx, &models.OutboxEvent{
		Common:        models.Common{ID: utils.NewID(), CreatedAt: now, UpdatedAt: now},
		EventType:     eventType,
		AggregateType: aggregateType,
		AggregateID:   aggregateID,
		WorkspaceID:   workspaceID,
		Payload:       encoded,
	})
}

func (s *OutboxService) Run(ctx context.Context, workerID string) error {
	if !s.cfg.Enabled || s.producer == nil || s.repo == nil {
		<-ctx.Done()
		return nil
	}
	ticker := time.NewTicker(s.cfg.PollInterval)
	defer ticker.Stop()
	for {
		if err := s.flush(ctx, workerID); err != nil && ctx.Err() == nil {
			s.logger.Error("outbox flush failed", "error", err)
		}
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
		}
	}
}

func (s *OutboxService) flush(ctx context.Context, workerID string) error {
	items, err := s.repo.ClaimUnpublished(ctx, workerID, s.cfg.BatchSize, s.cfg.MaxAttempts)
	if err != nil {
		return err
	}
	for _, item := range items {
		if err := s.dispatch(ctx, item); err != nil {
			_ = s.repo.MarkFailed(ctx, item.ID, item.Attempts+1, sanitizeJobError(err))
			continue
		}
		_ = s.repo.MarkPublished(ctx, item.ID, time.Now().UTC())
	}
	return nil
}

func (s *OutboxService) dispatch(ctx context.Context, item models.OutboxEvent) error {
	switch item.EventType {
	case "message.created":
		_, err := s.producer.EnqueueJob(ctx, "notifications", "notification.message.created", nil, interfaces.JobOptions{
			WorkspaceID: item.WorkspaceID,
			Payload:     item.Payload,
		})
		return err
	case "meeting.created":
		_, err := s.producer.EnqueueJob(ctx, "meetings", "meeting.reminder", nil, interfaces.JobOptions{
			WorkspaceID: item.WorkspaceID,
			Payload:     item.Payload,
		})
		return err
	case "integration.webhook.accepted":
		_, err := s.producer.EnqueueJob(ctx, "integrations", "integration.webhook.process", nil, interfaces.JobOptions{
			WorkspaceID: item.WorkspaceID,
			Payload:     item.Payload,
		})
		return err
	case "auth.email_verification.requested":
		_, err := s.producer.EnqueueJob(ctx, "maintenance", "auth.email_verification.requested", nil, interfaces.JobOptions{
			WorkspaceID: item.WorkspaceID,
			Payload:     item.Payload,
		})
		return err
	case "auth.password_reset.requested":
		_, err := s.producer.EnqueueJob(ctx, "maintenance", "auth.password_reset.requested", nil, interfaces.JobOptions{
			WorkspaceID: item.WorkspaceID,
			Payload:     item.Payload,
		})
		return err
	case "auth.session.revoked":
		_, err := s.producer.EnqueueJob(ctx, "maintenance", "auth.session.revoked", nil, interfaces.JobOptions{
			WorkspaceID: item.WorkspaceID,
			Payload:     item.Payload,
		})
		return err
	case "auth.audit.persist":
		_, err := s.producer.EnqueueJob(ctx, "maintenance", "auth.audit.persist", nil, interfaces.JobOptions{
			WorkspaceID: item.WorkspaceID,
			Payload:     item.Payload,
		})
		return err
	case "meeting.started", "meeting.ended", "meeting.cancelled",
		"meeting.session.created", "meeting.session.started", "meeting.session.ended",
		"meeting.participant.joined", "meeting.participant.left",
		"meeting.track.published", "meeting.track.unpublished",
		"webrtc.node.unhealthy":
		return nil
	default:
		return Permanent(utils.ErrUnknownJobType)
	}
}
