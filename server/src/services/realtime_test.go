package services

import (
	"net/http/httptest"
	"testing"
)

func TestIsAllowedOrigin(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		allowed map[string]struct{}
		origin  string
		want    bool
	}{
		{name: "exact match", allowed: map[string]struct{}{"http://localhost:3000": {}}, origin: "http://localhost:3000", want: true},
		{name: "wildcard", allowed: map[string]struct{}{"*": {}}, origin: "https://example.com", want: true},
		{name: "missing origin", allowed: map[string]struct{}{"http://localhost:3000": {}}, origin: "", want: false},
		{name: "not allowed", allowed: map[string]struct{}{"http://localhost:3000": {}}, origin: "https://example.com", want: false},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			req := httptest.NewRequest("GET", "http://example.com/api/v1/realtime/ws", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			if got := isAllowedOrigin(tt.allowed, req); got != tt.want {
				t.Fatalf("isAllowedOrigin() = %v, want %v", got, tt.want)
			}
		})
	}
}
