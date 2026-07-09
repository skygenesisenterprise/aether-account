package services

import (
	"context"
	"testing"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type notificationRepoStub struct {
	items map[string]*models.Notification
}

func (s *notificationRepoStub) Create(_ context.Context, notification *models.Notification) error {
	s.items[notification.IdempotencyKey] = notification
	return nil
}
func (s *notificationRepoStub) GetByIdempotencyKey(_ context.Context, key string) (*models.Notification, error) {
	if item, ok := s.items[key]; ok {
		return item, nil
	}
	return nil, utils.NewError(404, "NOTIFICATION_NOT_FOUND", "not found", nil)
}
func (s *notificationRepoStub) ListByUser(context.Context, string, *time.Time, string, int) ([]models.Notification, error) {
	return nil, nil
}
func (s *notificationRepoStub) CountUnreadByUser(context.Context, string) (int64, error) {
	return 0, nil
}
func (s *notificationRepoStub) MarkRead(context.Context, string, string, time.Time) (bool, error) {
	return false, nil
}
func (s *notificationRepoStub) MarkAllRead(context.Context, string, time.Time) (bool, error) {
	return false, nil
}
func (s *notificationRepoStub) ListBefore(context.Context, time.Time, int) ([]models.Notification, error) {
	return nil, nil
}
func (s *notificationRepoStub) DeleteByIDs(context.Context, []string) error { return nil }

type eventBusStub struct {
	events []interfaces.Event
}

func (s *eventBusStub) Publish(_ context.Context, event interfaces.Event) error {
	s.events = append(s.events, event)
	return nil
}
func (s *eventBusStub) Subscribe(context.Context, string, interfaces.EventHandler) error { return nil }
func (s *eventBusStub) Close() error                                                     { return nil }
func (s *eventBusStub) Healthy(context.Context) error                                    { return nil }

func TestNotificationServiceIdempotency(t *testing.T) {
	t.Parallel()

	repo := &notificationRepoStub{items: map[string]*models.Notification{}}
	bus := &eventBusStub{}
	service := NewNotificationService(repo, bus)

	notification := &models.Notification{
		Common:         models.Common{ID: "n1", CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()},
		WorkspaceID:    "ws1",
		UserID:         "u1",
		Type:           "message.created",
		Title:          "New message",
		Body:           "body",
		IdempotencyKey: "dup-key",
	}

	if err := service.Create(context.Background(), notification); err != nil {
		t.Fatalf("create first: %v", err)
	}
	if err := service.Create(context.Background(), notification); err != nil {
		t.Fatalf("create second: %v", err)
	}
	if len(repo.items) != 1 {
		t.Fatalf("expected 1 stored notification, got %d", len(repo.items))
	}
	if len(bus.events) != 1 {
		t.Fatalf("expected 1 published event, got %d", len(bus.events))
	}
}
