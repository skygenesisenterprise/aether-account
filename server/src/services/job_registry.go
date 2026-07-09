package services

import (
	"context"
	"sync"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type JobRegistry struct {
	mu       sync.RWMutex
	handlers map[string]interfaces.JobHandler
}

func NewJobRegistry() *JobRegistry {
	return &JobRegistry{handlers: map[string]interfaces.JobHandler{}}
}

func (r *JobRegistry) Register(jobType string, handler interfaces.JobHandler) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.handlers[jobType] = handler
}

func (r *JobRegistry) Handle(ctx context.Context, job models.Job) error {
	r.mu.RLock()
	handler, ok := r.handlers[job.Type]
	r.mu.RUnlock()
	if !ok {
		return Permanent(utils.ErrUnknownJobType)
	}
	return handler(ctx, job)
}
