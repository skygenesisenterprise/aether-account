package services

import (
	"context"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type LocalStorage struct {
	root string
}

func NewObjectStorage(cfg config.StorageConfig) (interfaces.ObjectStorage, error) {
	if cfg.Driver != "local" {
		return nil, utils.NewError(500, "STORAGE_DRIVER_UNSUPPORTED", "Only local storage is currently supported.", nil)
	}
	if !utils.ValidateStoragePath(filepath.Clean(cfg.LocalPath)) {
		return nil, utils.NewError(500, "INVALID_STORAGE_PATH", "The configured storage path is invalid.", nil)
	}
	if err := os.MkdirAll(cfg.LocalPath, 0o755); err != nil {
		return nil, err
	}
	return &LocalStorage{root: cfg.LocalPath}, nil
}

func (s *LocalStorage) Put(ctx context.Context, object interfaces.Object) error {
	target, err := s.resolve(object.Key)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return err
	}
	file, err := os.Create(target)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = io.Copy(file, object.Body)
	return err
}

func (s *LocalStorage) Get(_ context.Context, key string) (io.ReadCloser, error) {
	target, err := s.resolve(key)
	if err != nil {
		return nil, err
	}
	return os.Open(target)
}

func (s *LocalStorage) Delete(_ context.Context, key string) error {
	target, err := s.resolve(key)
	if err != nil {
		return err
	}
	return os.Remove(target)
}

func (s *LocalStorage) SignedURL(_ context.Context, key string, _ time.Duration) (string, error) {
	target, err := s.resolve(key)
	if err != nil {
		return "", err
	}
	return "file://" + url.PathEscape(target), nil
}

func (s *LocalStorage) resolve(key string) (string, error) {
	clean := filepath.Clean(strings.TrimPrefix(key, "/"))
	target := filepath.Join(s.root, clean)
	if !strings.HasPrefix(target, filepath.Clean(s.root)+string(os.PathSeparator)) && filepath.Clean(target) != filepath.Clean(s.root) {
		return "", utils.NewError(400, "INVALID_STORAGE_KEY", "The storage key is invalid.", nil)
	}
	return target, nil
}
