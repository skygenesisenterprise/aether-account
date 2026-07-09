package services

import (
	"context"
	"errors"
	"testing"

	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

func TestJobRegistryUnknownJobType(t *testing.T) {
	t.Parallel()

	registry := NewJobRegistry()
	err := registry.Handle(context.Background(), models.Job{Type: "missing.handler"})
	if err == nil {
		t.Fatal("expected error")
	}

	var retryable RetryableError
	if !errors.As(err, &retryable) {
		t.Fatal("expected retryable wrapper")
	}
	if retryable.Retryable() {
		t.Fatal("expected unknown job type to be permanent")
	}
	if utils.AsAppError(err).Code != utils.ErrUnknownJobType.Code {
		t.Fatalf("unexpected app error code: %s", utils.AsAppError(err).Code)
	}
}
