package models

import (
	"encoding/json"
	"time"
)

type Job struct {
	ID             string          `json:"id"`
	Type           string          `json:"type"`
	Queue          string          `json:"queue"`
	WorkspaceID    string          `json:"workspaceId,omitempty"`
	ActorID        string          `json:"actorId,omitempty"`
	Payload        json.RawMessage `json:"payload"`
	Attempts       int             `json:"attempts"`
	MaxAttempts    int             `json:"maxAttempts"`
	AvailableAt    time.Time       `json:"availableAt"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
	IdempotencyKey string          `json:"idempotencyKey,omitempty"`
	LastError      string          `json:"lastError,omitempty"`
}
