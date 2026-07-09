package services

import (
	"context"
	"errors"
	"log/slog"
	"testing"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/models"
)

func TestInMemoryJobQueueConsumeSuccess(t *testing.T) {
	t.Parallel()

	queue := NewInMemoryJobQueue(slog.Default(), &WorkerMetrics{})
	job := models.Job{
		ID:          "job-1",
		Type:        "test.success",
		Queue:       "notifications",
		MaxAttempts: 3,
		AvailableAt: time.Now().UTC(),
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan struct{})
	go func() {
		_ = queue.Consume(ctx, "notifications", "group", "consumer", func(_ context.Context, got models.Job) error {
			if got.ID != job.ID {
				t.Errorf("unexpected job id: %s", got.ID)
			}
			close(done)
			cancel()
			return nil
		})
	}()

	if err := queue.Enqueue(ctx, "notifications", job); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for job consumption")
	}
}

func TestInMemoryJobQueueDeadLetterOnPermanentError(t *testing.T) {
	t.Parallel()

	queue := NewInMemoryJobQueue(slog.Default(), &WorkerMetrics{})
	job := models.Job{
		ID:          "job-2",
		Type:        "test.failure",
		Queue:       "notifications",
		MaxAttempts: 2,
		AvailableAt: time.Now().UTC(),
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		_ = queue.Consume(ctx, "notifications", "group", "consumer", func(context.Context, models.Job) error {
			cancel()
			return Permanent(errors.New("boom"))
		})
	}()

	if err := queue.Enqueue(ctx, "notifications", job); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	time.Sleep(100 * time.Millisecond)
	items, err := queue.ListDeadLetters(context.Background(), "notifications", 10)
	if err != nil {
		t.Fatalf("list dead letters: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("expected 1 dead-lettered job, got %d", len(items))
	}
	if items[0].LastError != "boom" {
		t.Fatalf("unexpected dead-letter error: %s", items[0].LastError)
	}
}
