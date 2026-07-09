package services

import "sync/atomic"

type WorkerMetrics struct {
	enqueued     atomic.Int64
	processed    atomic.Int64
	failed       atomic.Int64
	retried      atomic.Int64
	deadLettered atomic.Int64
}

func (m *WorkerMetrics) Snapshot() map[string]int64 {
	return map[string]int64{
		"jobs_enqueued_total":      m.enqueued.Load(),
		"jobs_processed_total":     m.processed.Load(),
		"jobs_failed_total":        m.failed.Load(),
		"jobs_retried_total":       m.retried.Load(),
		"jobs_dead_lettered_total": m.deadLettered.Load(),
	}
}
