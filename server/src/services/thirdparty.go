package services

import (
	"fmt"
)

type ThirdPartyService struct {
	db *DatabaseService
}

func NewThirdPartyService(db *DatabaseService) *ThirdPartyService {
	return &ThirdPartyService{db: db}
}

type ThirdPartyAppData struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	AccessLevel string `json:"access_level"`
	ConnectedAt string `json:"connected_at,omitempty"`
}

type ThirdPartyResponse struct {
	Success bool                `json:"success"`
	Data    []ThirdPartyAppData `json:"data,omitempty"`
	Error   string              `json:"error,omitempty"`
}

func (s *ThirdPartyService) ListApps(userID string) ([]ThirdPartyAppData, error) {
	apps, err := s.db.GetThirdPartyApps(userID)
	if err != nil {
		return nil, err
	}

	result := make([]ThirdPartyAppData, len(apps))
	for i, app := range apps {
		result[i] = ThirdPartyAppData{
			ID:          app.ID,
			Name:        app.Name,
			AccessLevel: app.AccessLevel,
			ConnectedAt: app.CreatedAt.Format("2006-01-02"),
		}
	}

	return result, nil
}

func (s *ThirdPartyService) ConnectApp(userID, appName, accessLevel string) (*ThirdPartyAppData, error) {
	app, err := s.db.CreateThirdPartyApp(userID, appName, accessLevel)
	if err != nil {
		return nil, err
	}

	s.recordActivity(userID, "app_connected", "Application connectée", appName)

	return &ThirdPartyAppData{
		ID:          app.ID,
		Name:        app.Name,
		AccessLevel: app.AccessLevel,
		ConnectedAt: app.CreatedAt.Format("2006-01-02"),
	}, nil
}

func (s *ThirdPartyService) RevokeApp(appID, userID string) error {
	app, err := s.getAppByID(appID, userID)
	if err != nil {
		return err
	}

	if err := s.db.DeleteThirdPartyApp(appID, userID); err != nil {
		return err
	}

	s.recordActivity(userID, "app_revoked", "Accès révoqué", app.Name)

	return nil
}

func (s *ThirdPartyService) UpdateAppAccess(appID, userID, accessLevel string) error {
	return fmt.Errorf("not implemented")
}

func (s *ThirdPartyService) GetAppPermissions(appID, userID string) (string, error) {
	app, err := s.getAppByID(appID, userID)
	if err != nil {
		return "", err
	}

	return app.AccessLevel, nil
}

func (s *ThirdPartyService) getAppByID(appID, userID string) (*ThirdPartyApp, error) {
	apps, err := s.db.GetThirdPartyApps(userID)
	if err != nil {
		return nil, err
	}

	for _, app := range apps {
		if app.ID == appID {
			return &app, nil
		}
	}

	return nil, fmt.Errorf("app not found")
}

func (s *ThirdPartyService) recordActivity(userID, activityType, title, description string) {
	s.db.CreateSecurityActivity(userID, activityType, title, description, "", "")
}

type ConnectAppRequest struct {
	AppName  string `json:"app_name" binding:"required"`
	AuthCode string `json:"auth_code" binding:"required"`
}

type RevokeAppRequest struct {
	AppID string `json:"app_id" binding:"required"`
}

func NewThirdPartyServiceError(message string) error {
	return fmt.Errorf("third-party service error: %s", message)
}
