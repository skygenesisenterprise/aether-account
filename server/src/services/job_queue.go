package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	redis "github.com/redis/go-redis/v9"
	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

const (
	streamJobField   = "job"
	defaultClaimPage = 25
)

type QueueProducer struct {
	logger   *slog.Logger
	queue    interfaces.JobQueue
	metrics  *WorkerMetrics
	maxTries int
}

func NewQueueProducer(logger *slog.Logger, queue interfaces.JobQueue, maxAttempts int, metrics *WorkerMetrics) *QueueProducer {
	return &QueueProducer{logger: logger, queue: queue, maxTries: maxAttempts, metrics: metrics}
}

func (p *QueueProducer) EnqueueJob(ctx context.Context, queueName string, jobType string, payload any, options interfaces.JobOptions) (models.Job, error) {
	raw := options.Payload
	if len(raw) == 0 && payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return models.Job{}, err
		}
		raw = encoded
	}
	now := time.Now().UTC()
	if options.MaxAttempts <= 0 {
		options.MaxAttempts = p.maxTries
	}
	if options.AvailableAt.IsZero() {
		options.AvailableAt = now
	}
	job := models.Job{
		ID:             utils.NewID(),
		Type:           jobType,
		Queue:          queueName,
		WorkspaceID:    options.WorkspaceID,
		ActorID:        options.ActorID,
		Payload:        raw,
		Attempts:       0,
		MaxAttempts:    options.MaxAttempts,
		AvailableAt:    options.AvailableAt.UTC(),
		CreatedAt:      now,
		UpdatedAt:      now,
		IdempotencyKey: options.IdempotencyKey,
	}
	if err := p.queue.Enqueue(ctx, queueName, job); err != nil {
		return models.Job{}, err
	}
	if p.metrics != nil {
		p.metrics.enqueued.Add(1)
	}
	p.logger.Info("job enqueued", "job_id", job.ID, "job_type", job.Type, "queue", job.Queue)
	return job, nil
}

type RedisStreamJobQueue struct {
	logger    *slog.Logger
	client    *redisclient.Client
	cfg       config.WorkerConfig
	prefix    string
	metrics   *WorkerMetrics
	closeOnce sync.Once
}

func NewJobQueue(logger *slog.Logger, cfg config.Config, client *redisclient.Client, metrics *WorkerMetrics) interfaces.JobQueue {
	if client != nil && client.Raw != nil {
		return &RedisStreamJobQueue{
			logger:  logger,
			client:  client,
			cfg:     cfg.Worker,
			prefix:  cfg.Redis.KeyPrefix,
			metrics: metrics,
		}
	}
	return NewInMemoryJobQueue(logger, metrics)
}

func (q *RedisStreamJobQueue) Enqueue(ctx context.Context, queue string, job models.Job) error {
	payload, err := json.Marshal(job)
	if err != nil {
		return err
	}
	return q.client.Raw.XAdd(ctx, &redis.XAddArgs{
		Stream: q.stream(queue),
		Values: map[string]any{streamJobField: payload},
	}).Err()
}

func (q *RedisStreamJobQueue) Consume(ctx context.Context, queue string, consumerGroup string, consumerName string, handler interfaces.JobHandler) error {
	stream := q.stream(queue)
	if err := q.ensureGroup(ctx, stream, consumerGroup); err != nil {
		return err
	}
	lastClaim := time.Time{}
	for {
		if ctx.Err() != nil {
			return nil
		}
		if lastClaim.IsZero() || time.Since(lastClaim) >= q.cfg.ClaimIdleTimeout/2 {
			if err := q.claimPending(ctx, stream, consumerGroup, consumerName, handler); err != nil && !errors.Is(err, context.Canceled) {
				q.logger.Warn("job claim failed", "queue", queue, "consumer_group", consumerGroup, "consumer_name", consumerName, "error", err)
			}
			lastClaim = time.Now()
		}

		res, err := q.client.Raw.XReadGroup(ctx, &redis.XReadGroupArgs{
			Group:    consumerGroup,
			Consumer: consumerName,
			Streams:  []string{stream, ">"},
			Count:    1,
			Block:    q.cfg.BlockTimeout,
		}).Result()
		if err != nil {
			if errors.Is(err, redis.Nil) || errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
				continue
			}
			return err
		}
		for _, result := range res {
			for _, message := range result.Messages {
				if err := q.processMessage(ctx, queue, stream, consumerGroup, message, handler); err != nil {
					return err
				}
			}
		}
	}
}

func (q *RedisStreamJobQueue) Retry(ctx context.Context, queue string, job models.Job, delay time.Duration, cause error) error {
	job.Attempts++
	job.UpdatedAt = time.Now().UTC()
	job.AvailableAt = job.UpdatedAt.Add(delay)
	job.LastError = sanitizeJobError(cause)
	if q.metrics != nil {
		q.metrics.retried.Add(1)
	}
	return q.Enqueue(ctx, queue, job)
}

func (q *RedisStreamJobQueue) DeadLetter(ctx context.Context, queue string, job models.Job, cause error) error {
	job.UpdatedAt = time.Now().UTC()
	job.LastError = sanitizeJobError(cause)
	payload, err := json.Marshal(job)
	if err != nil {
		return err
	}
	if q.metrics != nil {
		q.metrics.deadLettered.Add(1)
	}
	return q.client.Raw.XAdd(ctx, &redis.XAddArgs{
		Stream: q.deadStream(queue),
		Values: map[string]any{streamJobField: payload},
	}).Err()
}

func (q *RedisStreamJobQueue) ListDeadLetters(ctx context.Context, queue string, limit int) ([]models.Job, error) {
	if limit <= 0 {
		limit = 50
	}
	entries, err := q.client.Raw.XRevRangeN(ctx, q.deadStream(queue), "+", "-", int64(limit)).Result()
	if err != nil {
		return nil, err
	}
	out := make([]models.Job, 0, len(entries))
	for _, entry := range entries {
		job, err := decodeStreamJob(entry.Values)
		if err == nil {
			out = append(out, job)
		}
	}
	return out, nil
}

func (q *RedisStreamJobQueue) Close() error {
	q.closeOnce.Do(func() {})
	return nil
}

func (q *RedisStreamJobQueue) Healthy(ctx context.Context) error {
	return q.client.Raw.Ping(ctx).Err()
}

func (q *RedisStreamJobQueue) ensureGroup(ctx context.Context, stream string, group string) error {
	err := q.client.Raw.XGroupCreateMkStream(ctx, stream, group, "0").Err()
	if err == nil || strings.Contains(err.Error(), "BUSYGROUP") {
		return nil
	}
	return err
}

func (q *RedisStreamJobQueue) processMessage(ctx context.Context, queue string, stream string, consumerGroup string, message redis.XMessage, handler interfaces.JobHandler) error {
	job, err := decodeStreamJob(message.Values)
	if err != nil {
		_ = q.client.Raw.XAck(ctx, stream, consumerGroup, message.ID).Err()
		return nil
	}
	if wait := time.Until(job.AvailableAt); wait > 0 {
		timer := time.NewTimer(wait)
		defer timer.Stop()
		select {
		case <-ctx.Done():
			return nil
		case <-timer.C:
		}
	}
	started := time.Now()
	err = handler(ctx, job)
	if err == nil {
		if q.metrics != nil {
			q.metrics.processed.Add(1)
		}
		q.logger.Info("job processed", "job_id", job.ID, "job_type", job.Type, "queue", queue, "attempt", job.Attempts+1, "duration_ms", time.Since(started).Milliseconds(), "status", "processed")
		return q.client.Raw.XAck(ctx, stream, consumerGroup, message.ID).Err()
	}
	if q.metrics != nil {
		q.metrics.failed.Add(1)
	}
	if !IsRetryableError(err) || job.Attempts+1 >= job.MaxAttempts {
		if deadErr := q.DeadLetter(ctx, queue, job, err); deadErr != nil {
			return deadErr
		}
		_ = q.client.Raw.XAck(ctx, stream, consumerGroup, message.ID).Err()
		q.logger.Error("job dead-lettered", "job_id", job.ID, "job_type", job.Type, "queue", queue, "attempt", job.Attempts+1, "duration_ms", time.Since(started).Milliseconds(), "status", "dead_lettered", "error", sanitizeJobError(err))
		return nil
	}
	delay := retryDelay(job.Attempts+1, q.cfg.RetryBaseDelay)
	if retryErr := q.Retry(ctx, queue, job, delay, err); retryErr != nil {
		return retryErr
	}
	_ = q.client.Raw.XAck(ctx, stream, consumerGroup, message.ID).Err()
	q.logger.Warn("job retried", "job_id", job.ID, "job_type", job.Type, "queue", queue, "attempt", job.Attempts+1, "duration_ms", time.Since(started).Milliseconds(), "status", "retrying", "error", sanitizeJobError(err))
	return nil
}

func (q *RedisStreamJobQueue) claimPending(ctx context.Context, stream string, consumerGroup string, consumerName string, handler interfaces.JobHandler) error {
	start := "0-0"
	for {
		result, next, err := q.client.Raw.XAutoClaim(ctx, &redis.XAutoClaimArgs{
			Stream:   stream,
			Group:    consumerGroup,
			Consumer: consumerName,
			MinIdle:  q.cfg.ClaimIdleTimeout,
			Start:    start,
			Count:    defaultClaimPage,
		}).Result()
		if err != nil {
			if errors.Is(err, redis.Nil) {
				return nil
			}
			return err
		}
		for _, message := range result {
			if err := q.processMessage(ctx, streamNameToQueue(stream), stream, consumerGroup, message, handler); err != nil {
				return err
			}
		}
		if next == "0-0" || len(result) == 0 {
			return nil
		}
		start = next
	}
}

func (q *RedisStreamJobQueue) stream(queue string) string {
	return fmt.Sprintf("%s:jobs:%s", q.prefix, queue)
}

func (q *RedisStreamJobQueue) deadStream(queue string) string {
	return fmt.Sprintf("%s:dead:%s", q.prefix, queue)
}

type inMemoryQueuedJob struct {
	job models.Job
}

type InMemoryJobQueue struct {
	logger  *slog.Logger
	metrics *WorkerMetrics
	mu      sync.RWMutex
	queues  map[string]chan inMemoryQueuedJob
	dead    map[string][]models.Job
	closed  bool
}

func NewInMemoryJobQueue(logger *slog.Logger, metrics *WorkerMetrics) *InMemoryJobQueue {
	return &InMemoryJobQueue{
		logger:  logger,
		metrics: metrics,
		queues:  map[string]chan inMemoryQueuedJob{},
		dead:    map[string][]models.Job{},
	}
}

func (q *InMemoryJobQueue) Enqueue(_ context.Context, queue string, job models.Job) error {
	ch := q.queue(queue)
	ch <- inMemoryQueuedJob{job: job}
	return nil
}

func (q *InMemoryJobQueue) Consume(ctx context.Context, queue string, _ string, _ string, handler interfaces.JobHandler) error {
	ch := q.queue(queue)
	for {
		select {
		case <-ctx.Done():
			return nil
		case queued := <-ch:
			if wait := time.Until(queued.job.AvailableAt); wait > 0 {
				timer := time.NewTimer(wait)
				select {
				case <-ctx.Done():
					timer.Stop()
					return nil
				case <-timer.C:
				}
			}
			if err := handler(ctx, queued.job); err != nil {
				if IsRetryableError(err) && queued.job.Attempts+1 < queued.job.MaxAttempts {
					_ = q.Retry(ctx, queue, queued.job, retryDelay(queued.job.Attempts+1, 5*time.Second), err)
					continue
				}
				_ = q.DeadLetter(ctx, queue, queued.job, err)
			}
		}
	}
}

func (q *InMemoryJobQueue) Retry(ctx context.Context, queue string, job models.Job, delay time.Duration, cause error) error {
	job.Attempts++
	job.AvailableAt = time.Now().UTC().Add(delay)
	job.LastError = sanitizeJobError(cause)
	return q.Enqueue(ctx, queue, job)
}

func (q *InMemoryJobQueue) DeadLetter(_ context.Context, queue string, job models.Job, cause error) error {
	q.mu.Lock()
	defer q.mu.Unlock()
	job.LastError = sanitizeJobError(cause)
	q.dead[queue] = append(q.dead[queue], job)
	return nil
}

func (q *InMemoryJobQueue) ListDeadLetters(_ context.Context, queue string, limit int) ([]models.Job, error) {
	q.mu.RLock()
	defer q.mu.RUnlock()
	items := q.dead[queue]
	if limit <= 0 || limit > len(items) {
		limit = len(items)
	}
	out := make([]models.Job, limit)
	copy(out, items[:limit])
	return out, nil
}

func (q *InMemoryJobQueue) Close() error {
	q.mu.Lock()
	defer q.mu.Unlock()
	if q.closed {
		return nil
	}
	q.closed = true
	for _, ch := range q.queues {
		close(ch)
	}
	return nil
}

func (q *InMemoryJobQueue) Healthy(context.Context) error { return nil }

func (q *InMemoryJobQueue) queue(name string) chan inMemoryQueuedJob {
	q.mu.Lock()
	defer q.mu.Unlock()
	if ch, ok := q.queues[name]; ok {
		return ch
	}
	ch := make(chan inMemoryQueuedJob, 256)
	q.queues[name] = ch
	return ch
}

func decodeStreamJob(values map[string]any) (models.Job, error) {
	raw, ok := values[streamJobField]
	if !ok {
		return models.Job{}, errors.New("missing job payload")
	}
	switch payload := raw.(type) {
	case string:
		var job models.Job
		return job, json.Unmarshal([]byte(payload), &job)
	case []byte:
		var job models.Job
		return job, json.Unmarshal(payload, &job)
	default:
		return models.Job{}, errors.New("unexpected job payload type")
	}
}

func retryDelay(attempt int, base time.Duration) time.Duration {
	switch attempt {
	case 1:
		return 0
	case 2:
		return 5 * time.Second
	case 3:
		return 30 * time.Second
	case 4:
		return 2 * time.Minute
	default:
		return 10 * time.Minute
	}
}

func sanitizeJobError(err error) string {
	if err == nil {
		return ""
	}
	message := err.Error()
	if len(message) > 256 {
		return message[:256]
	}
	return message
}

func streamNameToQueue(stream string) string {
	idx := strings.LastIndex(stream, ":jobs:")
	if idx >= 0 {
		return stream[idx+6:]
	}
	return stream
}
