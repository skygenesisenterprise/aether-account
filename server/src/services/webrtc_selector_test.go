package services

import (
	"context"
	"testing"

	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
)

type nodeRepoStub struct {
	items []models.WebRTCNode
}

func (s nodeRepoStub) Upsert(context.Context, *models.WebRTCNode) error { return nil }
func (s nodeRepoStub) GetByID(context.Context, string) (*models.WebRTCNode, error) {
	return nil, nil
}
func (s nodeRepoStub) ListHealthy(context.Context, string) ([]models.WebRTCNode, error) {
	return s.items, nil
}
func (s nodeRepoStub) Update(context.Context, *models.WebRTCNode) error { return nil }

func TestStaticNodeSelectorPrefersRegion(t *testing.T) {
	t.Parallel()

	selector := NewNodeSelector(nodeRepoStub{items: []models.WebRTCNode{
		{Common: models.Common{ID: "node-a"}, Region: "us-east", Provider: "livekit", Status: "healthy"},
		{Common: models.Common{ID: "node-b"}, Region: "eu-west", Provider: "livekit", Status: "healthy"},
	}}, config.Config{WebRTC: config.WebRTCConfig{Provider: "livekit"}})

	node, err := selector.SelectNode(context.Background(), "workspace-1", "eu-west")
	if err != nil {
		t.Fatalf("SelectNode returned error: %v", err)
	}
	if node.ID != "node-b" {
		t.Fatalf("expected node-b, got %s", node.ID)
	}
}
