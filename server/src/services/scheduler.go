package services

import (
	"context"
	"time"

	redis "github.com/redis/go-redis/v9"

	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
)

type ScheduledJob struct {
	Queue    string
	Type     string
	Every    time.Duration
	LockName string
}

type Scheduler struct {
	redis    *redisclient.Client
	producer interfaces.JobProducer
	jobs     []ScheduledJob
}

func NewScheduler(redis *redisclient.Client, producer interfaces.JobProducer) *Scheduler {
	return &Scheduler{
		redis:    redis,
		producer: producer,
		jobs: []ScheduledJob{
			{Queue: "presence", Type: "presence.expire_stale", Every: 30 * time.Second, LockName: "presence-expire"},
			{Queue: "presence", Type: "presence.persist_last_seen", Every: 2 * time.Minute, LockName: "presence-persist"},
			{Queue: "meetings", Type: "meeting.reminder", Every: time.Minute, LockName: "meeting-reminder"},
			{Queue: "meetings", Type: "meeting.expire", Every: 5 * time.Minute, LockName: "meeting-expire"},
			{Queue: "webrtc", Type: "webrtc.room.reconcile", Every: time.Minute, LockName: "webrtc-room-reconcile"},
			{Queue: "webrtc", Type: "webrtc.participant.cleanup", Every: 2 * time.Minute, LockName: "webrtc-participant-cleanup"},
			{Queue: "webrtc", Type: "webrtc.node.heartbeat", Every: 30 * time.Second, LockName: "webrtc-node-heartbeat"},
			{Queue: "webrtc", Type: "webrtc.node.healthcheck", Every: time.Minute, LockName: "webrtc-node-healthcheck"},
			{Queue: "webrtc", Type: "webrtc.session.expire", Every: 2 * time.Minute, LockName: "webrtc-session-expire"},
			{Queue: "maintenance", Type: "maintenance.expired_sessions", Every: 15 * time.Minute, LockName: "session-retention"},
			{Queue: "maintenance", Type: "auth.session.cleanup", Every: time.Hour, LockName: "auth-session-cleanup"},
			{Queue: "maintenance", Type: "maintenance.orphaned_uploads", Every: time.Hour, LockName: "upload-retention"},
		},
	}
}

func (s *Scheduler) Run(ctx context.Context) error {
	if s.producer == nil {
		<-ctx.Done()
		return nil
	}
	tickers := make([]*time.Ticker, 0, len(s.jobs))
	for _, job := range s.jobs {
		ticker := time.NewTicker(job.Every)
		tickers = append(tickers, ticker)
		go func(job ScheduledJob, ticker *time.Ticker) {
			defer ticker.Stop()
			for {
				if err := s.enqueueIfLeader(ctx, job); err != nil && ctx.Err() == nil {
				}
				select {
				case <-ctx.Done():
					return
				case <-ticker.C:
				}
			}
		}(job, ticker)
	}
	<-ctx.Done()
	return nil
}

func (s *Scheduler) enqueueIfLeader(ctx context.Context, job ScheduledJob) error {
	if s.redis != nil && s.redis.Raw != nil {
		lockKey := s.redis.Keys.Lock("scheduler", job.LockName)
		ok, err := s.redis.Raw.SetNX(ctx, lockKey, "1", job.Every/2).Result()
		if err != nil {
			return err
		}
		if !ok {
			return nil
		}
	}
	_, err := s.producer.EnqueueJob(ctx, job.Queue, job.Type, nil, interfaces.JobOptions{})
	if err == redis.Nil {
		return nil
	}
	return err
}
