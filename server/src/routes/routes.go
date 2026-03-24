package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/middleware"
	"github.com/skygenesisenterprise/aether-account/server/src/models"
	"github.com/skygenesisenterprise/aether-account/server/src/services"
)

func SetupRoutes(router *gin.Engine, jwtService *services.JWTService) {
	authMiddleware := middleware.NewAuthMiddleware(jwtService)

	api := router.Group("/api/v1")
	{
		authHandler := NewAuthHandler(jwtService)
		passwordHandler := NewPasswordHandler()
		securityHandler := NewSecurityHandler()
		thirdPartyHandler := NewThirdPartyHandler()
		contactHandler := NewContactHandler()
		privacyHandler := NewPrivacyHandler()
		profileHandler := NewProfileHandler()

		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/change-password", authMiddleware.RequireAuth(), authHandler.ChangePassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
		}

		account := api.Group("/account")
		{
			account.GET("/me", authMiddleware.RequireAuth(), authHandler.GetAccount)
		}

		profile := api.Group("/profile")
		profile.Use(authMiddleware.RequireAuth())
		{
			profile.GET("/", profileHandler.GetProfile)
			profile.PUT("/", profileHandler.UpdateProfile)
			profile.POST("/avatar", profileHandler.UploadAvatar)
		}

		passwords := api.Group("/passwords")
		passwords.Use(authMiddleware.RequireAuth())
		{
			passwords.GET("/", passwordHandler.ListPasswords)
			passwords.POST("/", passwordHandler.CreatePassword)
			passwords.GET("/:id", passwordHandler.GetPassword)
			passwords.PUT("/:id", passwordHandler.UpdatePassword)
			passwords.DELETE("/:id", passwordHandler.DeletePassword)
		}

		security := api.Group("/security")
		security.Use(authMiddleware.RequireAuth())
		{
			security.GET("/", securityHandler.GetSecurityInfo)
			security.GET("/devices", securityHandler.GetDevices)
			security.GET("/sessions", securityHandler.GetSessions)
			security.GET("/activities", securityHandler.GetActivities)
			security.POST("/devices/:id/trust", securityHandler.TrustDevice)
			security.DELETE("/devices/:id", securityHandler.RevokeDevice)
			security.DELETE("/sessions/:id", securityHandler.RevokeSession)
			security.POST("/2fa/enable", securityHandler.EnableTwoFactor)
			security.POST("/2fa/disable", securityHandler.DisableTwoFactor)
			security.POST("/2fa/verify", securityHandler.VerifyTwoFactor)
		}

		thirdParty := api.Group("/third-party")
		thirdParty.Use(authMiddleware.RequireAuth())
		{
			thirdParty.GET("/", thirdPartyHandler.ListApps)
			thirdParty.POST("/", thirdPartyHandler.ConnectApp)
			thirdParty.DELETE("/:id", thirdPartyHandler.RevokeApp)
		}

		contacts := api.Group("/contacts")
		contacts.Use(authMiddleware.RequireAuth())
		{
			contacts.GET("/", contactHandler.ListContacts)
			contacts.POST("/", contactHandler.CreateContact)
			contacts.GET("/:id", contactHandler.GetContact)
			contacts.PUT("/:id", contactHandler.UpdateContact)
			contacts.DELETE("/:id", contactHandler.DeleteContact)
			contacts.GET("/groups", contactHandler.ListGroups)
			contacts.POST("/groups", contactHandler.CreateGroup)
		}

		privacy := api.Group("/privacy")
		privacy.Use(authMiddleware.RequireAuth())
		{
			privacy.GET("/", privacyHandler.GetPrivacySettings)
			privacy.PUT("/", privacyHandler.UpdatePrivacySettings)
			privacy.POST("/export", privacyHandler.ExportData)
			privacy.POST("/delete", privacyHandler.DeleteAccount)
		}
	}
}

// AuthHandler handles authentication endpoints

type AuthHandler struct {
	jwtService *services.JWTService
}

func NewAuthHandler(jwt *services.JWTService) *AuthHandler {
	return &AuthHandler{jwtService: jwt}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.AuthResponse{Success: false, Error: "Invalid request: " + err.Error()})
		return
	}

	token, err := h.jwtService.GenerateToken("user-123", "account-123", req.Email, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.AuthResponse{Success: false, Error: "Failed to generate token"})
		return
	}

	refreshToken, err := h.jwtService.GenerateRefreshToken("user-123")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.AuthResponse{Success: false, Error: "Failed to generate refresh token"})
		return
	}

	user := &models.User{ID: "user-123", Email: req.Email, Active: true}
	c.JSON(http.StatusOK, models.AuthResponse{
		Success: true,
		Data: &models.TokenResponse{
			AccessToken: token, RefreshToken: refreshToken, TokenType: "Bearer",
			ExpiresIn: h.jwtService.GetExpirySeconds(), User: user,
		},
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, models.AuthResponse{Success: true, Message: "Logged out successfully"})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.AuthResponse{Success: false, Error: "Invalid request"})
		return
	}

	userID, err := h.jwtService.ValidateRefreshToken(req.RefreshToken)
	if err != nil || userID == "" {
		c.JSON(http.StatusUnauthorized, models.AuthResponse{Success: false, Error: "Invalid or expired refresh token"})
		return
	}

	token, _ := h.jwtService.GenerateToken(userID, "account-123", "user@example.com", "user")
	refreshToken, _ := h.jwtService.GenerateRefreshToken(userID)

	c.JSON(http.StatusOK, models.AuthResponse{
		Success: true,
		Data: &models.TokenResponse{
			AccessToken: token, RefreshToken: refreshToken, TokenType: "Bearer",
			ExpiresIn: h.jwtService.GetExpirySeconds(),
		},
	})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.AuthResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.AuthResponse{Success: true, Message: "Password changed successfully"})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req models.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.AuthResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.AuthResponse{Success: true, Message: "Password reset email sent"})
}

func (h *AuthHandler) GetAccount(c *gin.Context) {
	userID := c.GetString("userID")
	user := &models.User{
		ID:     userID,
		Active: true,
	}
	c.JSON(http.StatusOK, models.AuthResponse{
		Success: true,
		Data:    &models.TokenResponse{User: user},
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.AuthResponse{Success: false, Error: "Invalid request: " + err.Error()})
		return
	}

	user := &models.User{
		ID:     "new-user-id",
		Email:  req.Email,
		Active: true,
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Success: true,
		Data:    &models.TokenResponse{User: user},
		Message: "Registration successful",
	})
}

// ProfileHandler handles profile endpoints

type ProfileHandler struct{}

func NewProfileHandler() *ProfileHandler { return &ProfileHandler{} }

type ProfileResponse struct {
	Success bool         `json:"success"`
	Data    *ProfileData `json:"data,omitempty"`
	Error   string       `json:"error,omitempty"`
}

type ProfileData struct {
	ID          string    `json:"id"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Email       string    `json:"email"`
	Gender      string    `json:"gender"`
	Phone       string    `json:"phone"`
	BirthDate   string    `json:"birth_date"`
	Language    string    `json:"language"`
	AvatarURL   string    `json:"avatar_url"`
	AetherID    string    `json:"aether_id"`
	AccountType string    `json:"account_type"`
	Addresses   []Address `json:"addresses"`
	CreatedAt   string    `json:"created_at"`
}

type Address struct {
	ID        string `json:"id"`
	Label     string `json:"label"`
	Value     string `json:"value"`
	IsPrimary bool   `json:"is_primary"`
}

type UpdateProfileRequest struct {
	FirstName string    `json:"first_name,omitempty"`
	LastName  string    `json:"last_name,omitempty"`
	Gender    string    `json:"gender,omitempty"`
	Phone     string    `json:"phone,omitempty"`
	BirthDate string    `json:"birth_date,omitempty"`
	Language  string    `json:"language,omitempty"`
	Addresses []Address `json:"addresses,omitempty"`
}

func (h *ProfileHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("userID")

	profile := ProfileData{
		ID:        userID,
		Addresses: []Address{},
	}
	c.JSON(http.StatusOK, ProfileResponse{Success: true, Data: &profile})
}

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ProfileResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, ProfileResponse{Success: true})
}

func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
	c.JSON(http.StatusOK, ProfileResponse{Success: true})
}

// PasswordHandler handles password vault endpoints

type PasswordHandler struct{}

func NewPasswordHandler() *PasswordHandler { return &PasswordHandler{} }

func (h *PasswordHandler) ListPasswords(c *gin.Context) {
	c.JSON(http.StatusOK, models.PasswordListResponse{Success: true, Data: []models.Password{}})
}

func (h *PasswordHandler) GetPassword(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.PasswordResponse{Success: false, Error: "Password ID required"})
		return
	}
	c.JSON(http.StatusOK, models.PasswordResponse{Success: true, Data: models.Password{ID: id}})
}

func (h *PasswordHandler) CreatePassword(c *gin.Context) {
	var req models.CreatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.PasswordResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusCreated, models.PasswordResponse{Success: true, Data: models.Password{ID: "new-id", Name: req.Name}})
}

func (h *PasswordHandler) UpdatePassword(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.PasswordResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.PasswordResponse{Success: true, Data: models.Password{ID: id}})
}

func (h *PasswordHandler) DeletePassword(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.PasswordResponse{Success: false, Error: "Password ID required"})
		return
	}
	c.JSON(http.StatusOK, models.PasswordResponse{Success: true})
}

// SecurityHandler handles security endpoints

type SecurityHandler struct{}

func NewSecurityHandler() *SecurityHandler { return &SecurityHandler{} }

func (h *SecurityHandler) GetSecurityInfo(c *gin.Context) {
	data := models.SecurityData{
		Devices:          []models.Device{},
		Sessions:         []models.Session{},
		Activities:       []models.SecurityActivity{},
		TwoFactor:        models.TwoFactorConfig{Enabled: false},
		PasskeyEnabled:   false,
		SecureNavigation: false,
	}
	c.JSON(http.StatusOK, models.SecurityResponse{Success: true, Data: &data})
}

func (h *SecurityHandler) GetDevices(c *gin.Context) {
	c.JSON(http.StatusOK, models.DevicesResponse{Success: true, Data: []models.Device{}})
}

func (h *SecurityHandler) GetSessions(c *gin.Context) {
	c.JSON(http.StatusOK, models.SessionsResponse{Success: true, Data: []models.Session{}})
}

func (h *SecurityHandler) GetActivities(c *gin.Context) {
	c.JSON(http.StatusOK, models.ActivitiesResponse{Success: true, Data: []models.SecurityActivity{}})
}

func (h *SecurityHandler) TrustDevice(c *gin.Context) {
	deviceID := c.Param("id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, models.DevicesResponse{Success: false, Error: "Device ID required"})
		return
	}
	c.JSON(http.StatusOK, models.DevicesResponse{Success: true})
}

func (h *SecurityHandler) RevokeDevice(c *gin.Context) {
	deviceID := c.Param("id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, models.DevicesResponse{Success: false, Error: "Device ID required"})
		return
	}
	c.JSON(http.StatusOK, models.DevicesResponse{Success: true})
}

func (h *SecurityHandler) RevokeSession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, models.SessionsResponse{Success: false, Error: "Session ID required"})
		return
	}
	c.JSON(http.StatusOK, models.SessionsResponse{Success: true})
}

func (h *SecurityHandler) EnableTwoFactor(c *gin.Context) {
	var req models.EnableTwoFactorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.SecurityResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.SecurityResponse{Success: true, Data: &models.SecurityData{TwoFactor: models.TwoFactorConfig{Enabled: true, Method: req.Method}}})
}

func (h *SecurityHandler) DisableTwoFactor(c *gin.Context) {
	var req models.VerifyTwoFactorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.SecurityResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.SecurityResponse{Success: true, Data: &models.SecurityData{TwoFactor: models.TwoFactorConfig{Enabled: false}}})
}

func (h *SecurityHandler) VerifyTwoFactor(c *gin.Context) {
	var req models.VerifyTwoFactorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.SecurityResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.SecurityResponse{Success: true})
}

// ThirdPartyHandler handles third-party app endpoints

type ThirdPartyHandler struct{}

func NewThirdPartyHandler() *ThirdPartyHandler { return &ThirdPartyHandler{} }

func (h *ThirdPartyHandler) ListApps(c *gin.Context) {
	c.JSON(http.StatusOK, models.ThirdPartyResponse{Success: true, Data: []models.ThirdPartyApp{}})
}

func (h *ThirdPartyHandler) ConnectApp(c *gin.Context) {
	var req models.ConnectAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ThirdPartyResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusCreated, models.ThirdPartyResponse{Success: true, Data: []models.ThirdPartyApp{{ID: "new-id", Name: req.AppName, AccessLevel: "Full"}}})
}

func (h *ThirdPartyHandler) RevokeApp(c *gin.Context) {
	appID := c.Param("id")
	if appID == "" {
		c.JSON(http.StatusBadRequest, models.ThirdPartyResponse{Success: false, Error: "App ID required"})
		return
	}
	c.JSON(http.StatusOK, models.ThirdPartyResponse{Success: true})
}

// ContactHandler handles contact endpoints

type ContactHandler struct{}

func NewContactHandler() *ContactHandler { return &ContactHandler{} }

type ContactsListResponse struct {
	Success bool                `json:"success"`
	Data    *models.ContactList `json:"data,omitempty"`
	Error   string              `json:"error,omitempty"`
}

func (h *ContactHandler) ListContacts(c *gin.Context) {
	contacts := &models.ContactList{
		AccountID:     "account-123",
		Contacts:      []*models.Contact{},
		TotalContacts: 0,
		HasMore:       false,
		Offset:        0,
		Limit:         50,
	}
	c.JSON(http.StatusOK, ContactsListResponse{Success: true, Data: contacts})
}

func (h *ContactHandler) GetContact(c *gin.Context) {
	contactID := c.Param("id")
	if contactID == "" {
		c.JSON(http.StatusBadRequest, models.ContactResponse{Success: false, Error: "Contact ID required"})
		return
	}
	c.JSON(http.StatusOK, models.ContactResponse{Success: true, Data: &models.Contact{ID: contactID}})
}

func (h *ContactHandler) CreateContact(c *gin.Context) {
	var req models.CreateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ContactResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusCreated, models.ContactResponse{Success: true, Data: &models.Contact{ID: "new-id", Name: req.Name, Email: req.Email}})
}

func (h *ContactHandler) UpdateContact(c *gin.Context) {
	contactID := c.Param("id")
	var req models.UpdateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ContactResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.ContactResponse{Success: true, Data: &models.Contact{ID: contactID}})
}

func (h *ContactHandler) DeleteContact(c *gin.Context) {
	contactID := c.Param("id")
	if contactID == "" {
		c.JSON(http.StatusBadRequest, models.ContactResponse{Success: false, Error: "Contact ID required"})
		return
	}
	c.JSON(http.StatusOK, models.ContactResponse{Success: true})
}

func (h *ContactHandler) ListGroups(c *gin.Context) {
	groups := &models.GroupList{
		AccountID: "account-123",
		Groups:    []*models.ContactGroup{},
		Total:     0,
	}
	c.JSON(http.StatusOK, models.GroupListResponse{Success: true, Data: groups})
}

func (h *ContactHandler) CreateGroup(c *gin.Context) {
	var req models.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.GroupResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusCreated, models.GroupResponse{Success: true, Data: &models.ContactGroup{ID: "new-id", Name: req.Name}})
}

// PrivacyHandler handles privacy endpoints

type PrivacyHandler struct{}

func NewPrivacyHandler() *PrivacyHandler { return &PrivacyHandler{} }

func (h *PrivacyHandler) GetPrivacySettings(c *gin.Context) {
	settings := models.AccountPrivacySettings{
		ProfileVisibility: "private",
		ShowEmail:         false,
		ShowPhone:         false,
		ShowActivity:      false,
		DataCollection:    false,
		PersonalizedAds:   false,
		Analytics:         false,
		LocationTracking:  false,
	}
	c.JSON(http.StatusOK, models.PrivacyResponse{Success: true, Data: &settings})
}

func (h *PrivacyHandler) UpdatePrivacySettings(c *gin.Context) {
	var req models.UpdatePrivacyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.PrivacyResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.PrivacyResponse{Success: true})
}

func (h *PrivacyHandler) ExportData(c *gin.Context) {
	var req models.DataExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.DataExportResponse{Success: false, Error: "Invalid request"})
		return
	}
	c.JSON(http.StatusOK, models.DataExportResponse{Success: true, Message: "Data export started"})
}

func (h *PrivacyHandler) DeleteAccount(c *gin.Context) {
	var req models.DeleteAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.AuthResponse{Success: false, Error: "Invalid request"})
		return
	}
	if !req.Confirm {
		c.JSON(http.StatusBadRequest, models.AuthResponse{Success: false, Error: "Confirmation required"})
		return
	}
	c.JSON(http.StatusOK, models.AuthResponse{Success: true, Message: "Account deletion scheduled"})
}
