package services

import (
	"fmt"
)

type SecurityService struct {
	db *DatabaseService
}

func NewSecurityService(db *DatabaseService) *SecurityService {
	return &SecurityService{db: db}
}

type SecurityData struct {
	Devices          []Device           `json:"devices"`
	Sessions         []Session          `json:"sessions"`
	Activities       []SecurityActivity `json:"activities"`
	TwoFactor        TwoFactorConfig    `json:"two_factor"`
	PasskeyEnabled   bool               `json:"passkey_enabled"`
	SecureNavigation bool               `json:"secure_navigation"`
}

type TwoFactorConfig struct {
	Enabled bool   `json:"enabled"`
	Method  string `json:"method,omitempty"`
}

type SecurityResponse struct {
	Success bool          `json:"success"`
	Data    *SecurityData `json:"data,omitempty"`
	Error   string        `json:"error,omitempty"`
}

type DevicesResponse struct {
	Success bool     `json:"success"`
	Data    []Device `json:"data,omitempty"`
	Error   string   `json:"error,omitempty"`
}

type SessionsResponse struct {
	Success bool      `json:"success"`
	Data    []Session `json:"data,omitempty"`
	Error   string    `json:"error,omitempty"`
}

type ActivitiesResponse struct {
	Success bool               `json:"success"`
	Data    []SecurityActivity `json:"data,omitempty"`
	Error   string             `json:"error,omitempty"`
}

func (s *SecurityService) GetSecurityInfo(userID string) (*SecurityData, error) {
	user, err := s.db.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	devices, err := s.db.GetDevices(userID)
	if err != nil {
		devices = []Device{}
	}

	sessions, err := s.db.GetSessions(userID)
	if err != nil {
		sessions = []Session{}
	}

	activities, err := s.db.GetSecurityActivities(userID, 20)
	if err != nil {
		activities = []SecurityActivity{}
	}

	var twoFactorEnabled bool
	var passkeyEnabled bool
	var secureNavigation bool

	if user != nil {
		twoFactorEnabled = user.TwoFactorEnabled
		passkeyEnabled = user.PasskeyEnabled
		secureNavigation = user.SecureNavigation
	}

	return &SecurityData{
		Devices:          devices,
		Sessions:         sessions,
		Activities:       activities,
		TwoFactor:        TwoFactorConfig{Enabled: twoFactorEnabled},
		PasskeyEnabled:   passkeyEnabled,
		SecureNavigation: secureNavigation,
	}, nil
}

func (s *SecurityService) GetDevices(userID string) ([]Device, error) {
	return s.db.GetDevices(userID)
}

func (s *SecurityService) GetSessions(userID string) ([]Session, error) {
	return s.db.GetSessions(userID)
}

func (s *SecurityService) GetActivities(userID string) ([]SecurityActivity, error) {
	return s.db.GetSecurityActivities(userID, 50)
}

func (s *SecurityService) TrustDevice(deviceID, userID string) error {
	device, err := s.db.GetDeviceByID(deviceID, userID)
	if err != nil {
		return fmt.Errorf("device not found")
	}

	return s.db.TrustDevice(device.ID)
}

func (s *SecurityService) RevokeDevice(deviceID, userID string) error {
	return s.db.DeleteDevice(deviceID, userID)
}

func (s *SecurityService) RevokeSession(sessionID string) error {
	return s.db.DeleteSession(sessionID)
}

func (s *SecurityService) RevokeAllSessions(userID string) error {
	return s.db.DeleteAllUserSessions(userID)
}

func (s *SecurityService) EnableTwoFactor(userID string) error {
	return s.db.UpdateUser(userID, map[string]interface{}{
		"two_factor_enabled": true,
	})
}

func (s *SecurityService) DisableTwoFactor(userID string) error {
	return s.db.UpdateUser(userID, map[string]interface{}{
		"two_factor_enabled": false,
	})
}

func (s *SecurityService) EnablePasskey(userID string) error {
	return s.db.UpdateUser(userID, map[string]interface{}{
		"passkey_enabled": true,
	})
}

func (s *SecurityService) DisablePasskey(userID string) error {
	return s.db.UpdateUser(userID, map[string]interface{}{
		"passkey_enabled": false,
	})
}

func (s *SecurityService) EnableSecureNavigation(userID string) error {
	return s.db.UpdateUser(userID, map[string]interface{}{
		"secure_navigation": true,
	})
}

func (s *SecurityService) DisableSecureNavigation(userID string) error {
	return s.db.UpdateUser(userID, map[string]interface{}{
		"secure_navigation": false,
	})
}

func (s *SecurityService) RecordActivity(userID, activityType, title, description, device, ipAddress string) error {
	_, err := s.db.CreateSecurityActivity(userID, activityType, title, description, device, ipAddress)
	return err
}

func (s *SecurityService) CreateDevice(userID, name, deviceType, os, browser string) (*Device, error) {
	device, err := s.db.CreateDevice(userID, name, deviceType, os, browser)
	if err != nil {
		return nil, err
	}

	s.RecordActivity(userID, "device_added", "Nouvel appareil ajouté", name, browser, "")

	return device, nil
}

func (s *SecurityService) CreateSession(userID, token, ipAddress, userAgent string) (*Session, error) {
	session, err := s.db.CreateSession(userID, token, ipAddress, userAgent)
	if err != nil {
		return nil, err
	}

	s.RecordActivity(userID, "login", "Nouvelle connexion", "Session créée", userAgent, ipAddress)

	return session, nil
}

func (s *SecurityService) Logout(sessionID, userID, ipAddress, userAgent string) error {
	if err := s.db.DeleteSession(sessionID); err != nil {
		return err
	}

	s.RecordActivity(userID, "logout", "Déconnexion", "Session fermée", userAgent, ipAddress)

	return nil
}

func (s *SecurityService) GetDeviceStats(userID string) (map[string]int, error) {
	devices, err := s.db.GetDevices(userID)
	if err != nil {
		return nil, err
	}

	stats := make(map[string]int)
	for _, d := range devices {
		stats[d.Type]++
	}

	return stats, nil
}

func (s *SecurityService) GetRecentActivity(userID string, days int) ([]SecurityActivity, error) {
	return s.db.GetSecurityActivities(userID, 100)
}

type TrustDeviceRequest struct {
	DeviceID string `json:"device_id" binding:"required"`
}

type RevokeSessionRequest struct {
	SessionID string `json:"session_id" binding:"required"`
}

type EnableTwoFactorRequest struct {
	Method string `json:"method" binding:"required"`
	Code   string `json:"code" binding:"required"`
}

type VerifyTwoFactorRequest struct {
	Code string `json:"code" binding:"required"`
}

func NewSecurityServiceError(message string) error {
	return fmt.Errorf("security service error: %s", message)
}
