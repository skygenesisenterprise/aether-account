package services

import (
	"fmt"
	"strings"
	"sync/atomic"
	"time"
)

type WebRTCMetrics struct {
	nodes                   atomic.Int64
	activeRooms             atomic.Int64
	activeParticipants      atomic.Int64
	joinTokensIssued        atomic.Int64
	joinTokenFailures       atomic.Int64
	webhookEvents           atomic.Int64
	webhookFailures         atomic.Int64
	providerErrors          atomic.Int64
	roomCreateDurationNanos atomic.Int64
	roomCreateCount         atomic.Int64
}

func (m *WebRTCMetrics) SetNodes(v int64)              { m.nodes.Store(v) }
func (m *WebRTCMetrics) SetActiveRooms(v int64)        { m.activeRooms.Store(v) }
func (m *WebRTCMetrics) SetActiveParticipants(v int64) { m.activeParticipants.Store(v) }
func (m *WebRTCMetrics) IncJoinTokensIssued()          { m.joinTokensIssued.Add(1) }
func (m *WebRTCMetrics) IncJoinTokenFailures()         { m.joinTokenFailures.Add(1) }
func (m *WebRTCMetrics) IncWebhookEvents()             { m.webhookEvents.Add(1) }
func (m *WebRTCMetrics) IncWebhookFailures()           { m.webhookFailures.Add(1) }
func (m *WebRTCMetrics) IncProviderErrors()            { m.providerErrors.Add(1) }

func (m *WebRTCMetrics) ObserveRoomCreateDuration(d time.Duration) {
	m.roomCreateDurationNanos.Add(d.Nanoseconds())
	m.roomCreateCount.Add(1)
}

func (m *WebRTCMetrics) RenderPrometheus() string {
	var b strings.Builder
	writeGauge := func(name string, value int64) {
		fmt.Fprintf(&b, "# TYPE %s gauge\n%s %d\n", name, name, value)
	}
	writeCounter := func(name string, value int64) {
		fmt.Fprintf(&b, "# TYPE %s counter\n%s %d\n", name, name, value)
	}

	writeGauge("aether_meet_webrtc_nodes", m.nodes.Load())
	writeGauge("aether_meet_webrtc_rooms_active", m.activeRooms.Load())
	writeGauge("aether_meet_webrtc_participants_active", m.activeParticipants.Load())
	writeCounter("aether_meet_webrtc_join_tokens_issued_total", m.joinTokensIssued.Load())
	writeCounter("aether_meet_webrtc_join_token_failures_total", m.joinTokenFailures.Load())
	writeCounter("aether_meet_webrtc_webhook_events_total", m.webhookEvents.Load())
	writeCounter("aether_meet_webrtc_webhook_failures_total", m.webhookFailures.Load())
	writeCounter("aether_meet_webrtc_provider_errors_total", m.providerErrors.Load())

	total := m.roomCreateDurationNanos.Load()
	count := m.roomCreateCount.Load()
	avg := 0.0
	if count > 0 {
		avg = float64(total) / float64(count) / float64(time.Second)
	}
	fmt.Fprintf(&b, "# TYPE %s gauge\n%s %.6f\n", "aether_meet_webrtc_room_create_duration_seconds", "aether_meet_webrtc_room_create_duration_seconds", avg)
	return b.String()
}
