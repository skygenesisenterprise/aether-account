package services

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strconv"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"

	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type ConsumerConfig struct {
	Queue string
	Group string
}

type Worker struct {
	logger       *slog.Logger
	config       config.Config
	redis        *redisclient.Client
	queue        interfaces.JobQueue
	producer     interfaces.JobProducer
	registry     *JobRegistry
	consumers    []ConsumerConfig
	outbox       *OutboxService
	scheduler    *Scheduler
	inFlight     sync.WaitGroup
	metrics      *WorkerMetrics
	presence     *PresenceService
	integrations *IntegrationService
	meetings     *MeetingService
}

func NewWorker(logger *slog.Logger, cfg config.Config, redis *redisclient.Client, queue interfaces.JobQueue, producer interfaces.JobProducer, registry *JobRegistry, outbox *OutboxService, scheduler *Scheduler, presence *PresenceService, integrations *IntegrationService, meetings *MeetingService, metrics *WorkerMetrics) *Worker {
	return &Worker{
		logger:       logger,
		config:       cfg,
		redis:        redis,
		queue:        queue,
		producer:     producer,
		registry:     registry,
		outbox:       outbox,
		scheduler:    scheduler,
		presence:     presence,
		integrations: integrations,
		meetings:     meetings,
		metrics:      metrics,
		consumers: []ConsumerConfig{
			{Queue: "notifications", Group: "notifications"},
			{Queue: "integrations", Group: "integrations"},
			{Queue: "presence", Group: "presence"},
			{Queue: "meetings", Group: "meetings"},
			{Queue: "webrtc", Group: "webrtc"},
			{Queue: "attachments", Group: "attachments"},
			{Queue: "maintenance", Group: "maintenance"},
		},
	}
}

func (w *Worker) Run(ctx context.Context) error {
	return w.run(ctx, true, w.config.Worker.SchedulerEnabled, w.config.Outbox.Enabled, "worker")
}

func (w *Worker) RunConsumers(ctx context.Context) error {
	return w.run(ctx, true, false, w.config.Outbox.Enabled, "worker")
}

func (w *Worker) RunScheduler(ctx context.Context) error {
	return w.run(ctx, false, true, false, "scheduler")
}

func (w *Worker) RunAll(ctx context.Context) error {
	return w.run(ctx, true, true, w.config.Outbox.Enabled, "all")
}

func (w *Worker) run(ctx context.Context, runConsumers bool, runScheduler bool, runOutbox bool, serviceRole string) error {
	if w.queue == nil || w.registry == nil {
		return utils.ErrWorkerUnavailable
	}
	if runConsumers {
		if _, ok := w.queue.(*InMemoryJobQueue); ok {
			w.logger.Warn("worker running with in-memory queue only; jobs are not durable")
		}
	}
	if !runConsumers && !runScheduler && !runOutbox {
		<-ctx.Done()
		return nil
	}
	group, groupCtx := errgroup.WithContext(ctx)

	if runConsumers {
		group.Go(func() error { return w.runHeartbeat(groupCtx) })
	}
	if runScheduler && w.scheduler != nil {
		group.Go(func() error { return w.scheduler.Run(groupCtx) })
	}
	if runOutbox && w.outbox != nil && w.config.Outbox.Enabled {
		group.Go(func() error { return w.outbox.Run(groupCtx, w.config.Worker.ID) })
	}
	if runConsumers {
		for _, consumer := range w.consumers {
			consumer := consumer
			for i := 0; i < w.config.Worker.Concurrency; i++ {
				i := i
				group.Go(func() error {
					name := w.config.Worker.ID + "-" + consumer.Queue + "-" + strconv.Itoa(i)
					return w.queue.Consume(groupCtx, consumer.Queue, consumer.Group, name, w.wrapHandler(consumer))
				})
			}
		}
	}
	w.logger.Info("runtime started", "service", serviceRole, "worker_id", w.config.Worker.ID, "consumers", runConsumers, "scheduler", runScheduler, "outbox", runOutbox)
	err := group.Wait()
	if !runConsumers {
		if errors.Is(err, context.Canceled) {
			w.logger.Info("runtime stopped", "service", serviceRole, "worker_id", w.config.Worker.ID)
			return nil
		}
		return err
	}

	waitCtx, cancel := context.WithTimeout(context.Background(), w.config.Worker.ShutdownTimeout)
	defer cancel()
	done := make(chan struct{})
	go func() {
		w.inFlight.Wait()
		close(done)
	}()
	select {
	case <-done:
	case <-waitCtx.Done():
		w.logger.Warn("worker shutdown timed out", "worker_id", w.config.Worker.ID)
	}
	if errors.Is(err, context.Canceled) {
		w.logger.Info("runtime stopped", "service", serviceRole, "worker_id", w.config.Worker.ID)
		return nil
	}
	return err
}

func (w *Worker) wrapHandler(consumer ConsumerConfig) interfaces.JobHandler {
	return func(ctx context.Context, job models.Job) error {
		w.inFlight.Add(1)
		defer w.inFlight.Done()
		err := w.registry.Handle(ctx, job)
		if appErr := utils.AsAppError(err); appErr != nil && err != nil {
			w.logger.Warn("job handler finished", "job_id", job.ID, "job_type", job.Type, "queue", consumer.Queue, "error_code", appErr.Code)
		}
		return err
	}
}

func (w *Worker) runHeartbeat(ctx context.Context) error {
	if w.redis == nil || w.redis.Raw == nil {
		<-ctx.Done()
		return nil
	}
	ticker := time.NewTicker(w.config.Worker.HeartbeatInterval)
	defer ticker.Stop()
	key := w.redis.Keys.Cache("worker-heartbeat", w.config.Worker.ID)
	for {
		payload, _ := json.Marshal(map[string]any{
			"worker_id":         w.config.Worker.ID,
			"started_at":        time.Now().UTC().Format(time.RFC3339),
			"last_heartbeat_at": time.Now().UTC().Format(time.RFC3339),
			"active_consumers":  len(w.consumers) * w.config.Worker.Concurrency,
			"version":           w.config.App.Version,
			"metrics":           w.metrics.Snapshot(),
		})
		if err := w.redis.Raw.Set(ctx, key, payload, w.config.Worker.HeartbeatTTL).Err(); err != nil && ctx.Err() == nil {
			w.logger.Warn("worker heartbeat failed", "worker_id", w.config.Worker.ID, "error", err)
		}
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
		}
	}
}

func RegisterWorkerHandlers(registry *JobRegistry, notifications map[string]interfaces.JobHandler, presence *PresenceService, integrations *IntegrationService, meetings *MeetingService, auth *AuthService) {
	for jobType, handler := range notifications {
		registry.Register(jobType, handler)
	}
	registry.Register("presence.expire_stale", func(ctx context.Context, job models.Job) error {
		_ = job
		if presence == nil {
			return nil
		}
		return classifyRetry(presence.ExpireStale(ctx, 100))
	})
	registry.Register("presence.persist_last_seen", func(ctx context.Context, job models.Job) error {
		_ = job
		if presence == nil {
			return nil
		}
		return classifyRetry(presence.PersistLastSeen(ctx))
	})
	registry.Register("session.cleanup", func(ctx context.Context, job models.Job) error {
		_ = job
		if auth == nil {
			return nil
		}
		return classifyRetry(auth.CleanupExpired(ctx))
	})
	registry.Register("integration.webhook.process", func(ctx context.Context, job models.Job) error {
		if integrations == nil {
			return nil
		}
		var payload webhookJobPayload
		if err := json.Unmarshal(job.Payload, &payload); err != nil {
			return Permanent(err)
		}
		return integrations.ProcessWebhook(ctx, payload.Provider, payload.IntegrationID, payload.Payload, payload.Headers)
	})
	registry.Register("meeting.reminder", func(ctx context.Context, job models.Job) error {
		if meetings == nil {
			return nil
		}
		return classifyRetry(meetings.EnqueueDueReminders(ctx))
	})
	registry.Register("meeting.expire", func(ctx context.Context, job models.Job) error {
		if meetings == nil {
			return nil
		}
		return classifyRetry(meetings.ExpireStale(ctx))
	})
	registry.Register("meeting.auto_end", func(ctx context.Context, job models.Job) error {
		if meetings == nil {
			return nil
		}
		return classifyRetry(meetings.AutoEndAbandoned(ctx))
	})
	registry.Register("meeting.cleanup", func(context.Context, models.Job) error { return nil })
	registry.Register("webrtc.room.create", func(context.Context, models.Job) error { return nil })
	registry.Register("webrtc.room.close", func(ctx context.Context, job models.Job) error {
		if meetings == nil || meetings.webrtc == nil {
			return nil
		}
		var payload struct {
			SessionID string `json:"sessionId"`
			RoomName  string `json:"roomName"`
		}
		if len(job.Payload) > 0 {
			if err := json.Unmarshal(job.Payload, &payload); err != nil {
				return Permanent(err)
			}
		}
		return classifyRetry(meetings.webrtc.CloseRoom(ctx, payload.SessionID, payload.RoomName))
	})
	registry.Register("webrtc.room.reconcile", func(ctx context.Context, job models.Job) error {
		_ = job
		if meetings == nil || meetings.webrtc == nil {
			return nil
		}
		return classifyRetry(meetings.webrtc.ReconcileRooms(ctx))
	})
	registry.Register("webrtc.participant.cleanup", func(ctx context.Context, job models.Job) error {
		if meetings == nil || meetings.webrtc == nil {
			return nil
		}
		if len(job.Payload) == 0 {
			return classifyRetry(meetings.webrtc.CleanupStaleParticipants(ctx))
		}
		var payload struct {
			SessionID string `json:"sessionId"`
		}
		if err := json.Unmarshal(job.Payload, &payload); err != nil {
			return Permanent(err)
		}
		return classifyRetry(meetings.webrtc.CleanupParticipants(ctx, payload.SessionID))
	})
	registry.Register("webrtc.node.heartbeat", func(ctx context.Context, job models.Job) error {
		_ = job
		if meetings == nil || meetings.webrtc == nil {
			return nil
		}
		return classifyRetry(meetings.webrtc.refreshNodeHeartbeat(ctx))
	})
	registry.Register("webrtc.node.healthcheck", func(ctx context.Context, job models.Job) error {
		_ = job
		if meetings == nil || meetings.webrtc == nil {
			return nil
		}
		return classifyRetry(meetings.webrtc.Ready(ctx))
	})
	registry.Register("webrtc.session.expire", func(ctx context.Context, job models.Job) error {
		_ = job
		if meetings == nil || meetings.webrtc == nil {
			return nil
		}
		return classifyRetry(meetings.webrtc.ExpireAbandonedSessions(ctx))
	})
	registry.Register("attachment.process", func(context.Context, models.Job) error { return nil })
	registry.Register("attachment.metadata", func(context.Context, models.Job) error { return nil })
	registry.Register("attachment.cleanup", func(context.Context, models.Job) error { return nil })
	registry.Register("maintenance.expired_sessions", func(ctx context.Context, job models.Job) error {
		_ = job
		if auth == nil {
			return nil
		}
		return classifyRetry(auth.CleanupExpired(ctx))
	})
	registry.Register("maintenance.orphaned_uploads", func(context.Context, models.Job) error { return nil })
	registry.Register("maintenance.old_notifications", func(context.Context, models.Job) error { return nil })
	registry.Register("auth.email_verification.requested", func(context.Context, models.Job) error { return nil })
	registry.Register("auth.password_reset.requested", func(context.Context, models.Job) error { return nil })
	registry.Register("auth.session.revoked", func(context.Context, models.Job) error { return nil })
	registry.Register("auth.session.cleanup", func(ctx context.Context, job models.Job) error {
		_ = job
		if auth == nil {
			return nil
		}
		return classifyRetry(auth.CleanupExpired(ctx))
	})
	registry.Register("auth.audit.persist", func(context.Context, models.Job) error { return nil })
}

func classifyRetry(err error) error {
	if err == nil {
		return nil
	}
	if utils.AsAppError(err).Status >= 400 && utils.AsAppError(err).Status < 500 {
		return Permanent(err)
	}
	return Retryable(err)
}
