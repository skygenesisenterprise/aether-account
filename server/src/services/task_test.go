package services

import (
	"context"
	"testing"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type taskTestDatabase struct {
	db *gorm.DB
}

func (d taskTestDatabase) Gorm() *gorm.DB {
	return d.db
}

func (taskTestDatabase) Ping(context.Context) error {
	return nil
}

func (taskTestDatabase) Close() error {
	return nil
}

func (d taskTestDatabase) Transaction(ctx context.Context, fn func(*gorm.DB) error) error {
	return d.db.WithContext(ctx).Transaction(fn)
}

func TestTaskServiceCreate(t *testing.T) {
	t.Parallel()

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.Workspace{}, &models.WorkspaceMember{}, &models.Task{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	now := time.Now().UTC()
	user := &models.User{
		Common:          models.Common{ID: "u1", CreatedAt: now, UpdatedAt: now},
		Email:           "owner@example.com",
		EmailNormalized: "owner@example.com",
		DisplayName:     "Owner",
		Status:          "active",
		PresenceStatus:  "offline",
	}
	workspace := &models.Workspace{
		Common:      models.Common{ID: "ws1", CreatedAt: now, UpdatedAt: now},
		Name:        "Workspace",
		Slug:        "workspace",
		Visibility:  "private",
		OwnerID:     "u1",
		Description: "",
	}
	member := &models.WorkspaceMember{
		Common:      models.Common{ID: "wm1", CreatedAt: now, UpdatedAt: now},
		WorkspaceID: "ws1",
		UserID:      "u1",
		Role:        "member",
		JoinedAt:    now,
	}
	if err := db.Create(user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	if err := db.Create(workspace).Error; err != nil {
		t.Fatalf("create workspace: %v", err)
	}
	if err := db.Create(member).Error; err != nil {
		t.Fatalf("create workspace member: %v", err)
	}

	repos := NewRepositories(db)
	workspaceService := NewWorkspaceService(taskTestDatabase{db: db}, config.AuthConfig{}, repos.Users(), repos, nil, nil, nil)
	service := NewTaskService(repos.Tasks(), repos.Users(), workspaceService)

	item, err := service.Create(
		context.Background(),
		interfaces.Principal{UserID: "u1"},
		"ws1",
		"  Finaliser le cadrage  ",
		"  notes  ",
		"done",
		"high",
		"  Projet Atlas  ",
		nil,
	)
	if err != nil {
		t.Fatalf("create task: %v", err)
	}
	if item == nil {
		t.Fatal("expected dto")
	}
	if item.Title != "Finaliser le cadrage" {
		t.Fatalf("unexpected title: %q", item.Title)
	}
	if item.Status != "done" {
		t.Fatalf("unexpected status: %q", item.Status)
	}
	if item.Priority != "high" {
		t.Fatalf("unexpected priority: %q", item.Priority)
	}
	if item.Project != "Projet Atlas" {
		t.Fatalf("unexpected project: %q", item.Project)
	}
	if item.CompletedAt == nil {
		t.Fatal("expected completedAt to be set for done tasks")
	}
}
