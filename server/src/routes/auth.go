package routes

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skygenesisenterprise/aether-account/server/src/services"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

func (h *apiHandler) register(c *gin.Context) {
	if h.deps.AuthService == nil {
		utils.Error(c, utils.ErrDependencyUnavailable)
		return
	}
	var req struct {
		Email         string `json:"email"`
		Password      string `json:"password"`
		DisplayName   string `json:"displayName"`
		WorkspaceName string `json:"workspaceName"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	result, err := h.deps.AuthService.Register(c.Request.Context(), services.RegisterInput{
		Email:         req.Email,
		Password:      req.Password,
		DisplayName:   req.DisplayName,
		WorkspaceName: req.WorkspaceName,
	}, requestMetadata(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	h.deps.AuthService.SetRefreshCookie(c, result.RefreshToken)
	utils.Success(c, http.StatusCreated, result)
}

func (h *apiHandler) login(c *gin.Context) {
	if h.deps.AuthService == nil {
		utils.Error(c, utils.ErrDependencyUnavailable)
		return
	}
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	result, err := h.deps.AuthService.Login(c.Request.Context(), services.LoginInput{Email: req.Email, Password: req.Password}, requestMetadata(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	h.deps.AuthService.SetRefreshCookie(c, result.RefreshToken)
	utils.Success(c, http.StatusOK, result)
}

func (h *apiHandler) refresh(c *gin.Context) {
	if !h.validateCSRFCookieOrigin(c) {
		return
	}
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	_ = c.ShouldBindJSON(&body)
	refreshToken := strings.TrimSpace(body.RefreshToken)
	if refreshToken == "" {
		cookieToken, err := c.Cookie(h.deps.Config.Auth.RefreshCookieName)
		if err != nil {
			utils.Error(c, utils.ErrUnauthorized)
			return
		}
		refreshToken = cookieToken
	}
	result, err := h.deps.AuthService.Refresh(c.Request.Context(), refreshToken, requestMetadata(c))
	if err != nil {
		utils.Error(c, err)
		return
	}
	h.deps.AuthService.SetRefreshCookie(c, result.RefreshToken)
	utils.Success(c, http.StatusOK, result)
}

func (h *apiHandler) logout(c *gin.Context) {
	if !h.validateCSRFCookieOrigin(c) {
		return
	}
	if header := c.GetHeader("Authorization"); strings.HasPrefix(header, "Bearer ") {
		if principal, err := h.deps.IdentityProvider.Authenticate(c.Request.Context(), strings.TrimPrefix(header, "Bearer ")); err == nil {
			_ = h.deps.AuthService.Logout(c.Request.Context(), principal.SessionID)
		}
	}
	h.deps.AuthService.ClearRefreshCookie(c)
	utils.Success(c, http.StatusOK, gin.H{"loggedOut": true})
}

func (h *apiHandler) logoutAll(c *gin.Context) {
	if !h.validateCSRFCookieOrigin(c) {
		return
	}
	principal, _ := h.principal(c)
	var req struct {
		ExceptCurrent bool `json:"exceptCurrent"`
	}
	_ = c.ShouldBindJSON(&req)
	if err := h.deps.AuthService.LogoutAll(c.Request.Context(), principal.UserID, req.ExceptCurrent, principal.SessionID); err != nil {
		utils.Error(c, err)
		return
	}
	if !req.ExceptCurrent {
		h.deps.AuthService.ClearRefreshCookie(c)
	}
	utils.Success(c, http.StatusOK, gin.H{"loggedOut": true})
}

func (h *apiHandler) authMe(c *gin.Context) {
	principal, _ := h.principal(c)
	user, err := h.deps.AuthService.CurrentUser(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, user)
}

func (h *apiHandler) changePassword(c *gin.Context) {
	principal, _ := h.principal(c)
	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	if err := h.deps.AuthService.ChangePassword(c.Request.Context(), principal, req.CurrentPassword, req.NewPassword, requestMetadata(c)); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"updated": true})
}

func (h *apiHandler) listAuthSessions(c *gin.Context) {
	principal, _ := h.principal(c)
	items, err := h.deps.AuthService.ListSessions(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, "", false)
}

func (h *apiHandler) deleteAuthSession(c *gin.Context) {
	principal, _ := h.principal(c)
	if err := h.deps.AuthService.RevokeSession(c.Request.Context(), principal, c.Param("sessionId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *apiHandler) forgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	if err := h.deps.AuthService.RequestPasswordReset(c.Request.Context(), req.Email); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"accepted": true})
}

func (h *apiHandler) resetPassword(c *gin.Context) {
	utils.Success(c, http.StatusNotImplemented, gin.H{"accepted": false})
}

func (h *apiHandler) verifyEmail(c *gin.Context) {
	utils.Success(c, http.StatusNotImplemented, gin.H{"accepted": false})
}

func (h *apiHandler) resendVerification(c *gin.Context) {
	utils.Success(c, http.StatusAccepted, gin.H{"accepted": true})
}

func requestMetadata(c *gin.Context) services.RequestMetadata {
	return services.RequestMetadata{
		UserAgent: strings.TrimSpace(c.GetHeader("User-Agent")),
		IPAddress: strings.TrimSpace(c.ClientIP()),
	}
}

func (h *apiHandler) validateCSRFCookieOrigin(c *gin.Context) bool {
	origin := strings.TrimSpace(c.GetHeader("Origin"))
	if origin == "" {
		return true
	}
	parsed, err := url.Parse(origin)
	if err != nil {
		utils.Error(c, utils.ErrForbidden)
		return false
	}
	for _, allowed := range h.deps.Config.CORS.AllowedOrigins {
		if allowed == "" {
			continue
		}
		if allowed == origin {
			return true
		}
		allowedURL, parseErr := url.Parse(allowed)
		if parseErr == nil && allowedURL.Scheme == parsed.Scheme && allowedURL.Host == parsed.Host {
			return true
		}
	}
	utils.Error(c, utils.ErrForbidden)
	return false
}
