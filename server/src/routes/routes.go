package routes

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/middleware"
	"github.com/skygenesisenterprise/aether-account/server/src/services"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type Dependencies struct {
	Config              config.Config
	Logger              *slog.Logger
	RuntimeRole         string
	Database            interfaces.Database
	Redis               *redisclient.Client
	EventBus            interfaces.EventBus
	IdentityProvider    interfaces.IdentityProvider
	AuthService         *services.AuthService
	Hub                 *services.Hub
	UserService         *services.UserService
	NotificationService *services.NotificationService
	ProjectService      *services.ProjectService
	TaskService         *services.TaskService
	WorkspaceService    *services.WorkspaceService
	TeamService         *services.TeamService
	ChannelService      *services.ChannelService
	ConversationService *services.ConversationService
	MessageService      *services.MessageService
	MeetingService      *services.MeetingService
	WebRTCService       *services.WebRTCService
	IntegrationService  *services.IntegrationService
	AuditService        *services.AuditService
	WebRTCMetrics       *services.WebRTCMetrics
}

func SetupRoutes(router *gin.Engine, deps Dependencies) {
	handler := &apiHandler{deps: deps}

	router.GET("/health/live", handler.live)
	router.GET("/health/ready", handler.ready)
	router.GET("/metrics", handler.metrics)

	api := router.Group("/api/v1")
	api.GET("/health", handler.health)
	api.GET("/ready", handler.ready)
	api.POST("/internal/webrtc/livekit/webhook", handler.livekitWebhook)
	api.POST("/webhooks/:provider/:integrationId", handler.webhook)
	auth := api.Group("/auth")
	{
		auth.POST("/register", handler.register)
		auth.POST("/login", handler.login)
		auth.POST("/refresh", handler.refresh)
		auth.POST("/logout", handler.logout)
		auth.POST("/forgot-password", handler.forgotPassword)
		auth.POST("/reset-password", handler.resetPassword)
		auth.POST("/verify-email", handler.verifyEmail)
		auth.POST("/resend-verification", handler.resendVerification)
		authProtected := auth.Group("")
		authProtected.Use(middleware.Auth(deps.IdentityProvider))
		{
			authProtected.POST("/logout-all", handler.logoutAll)
			authProtected.POST("/change-password", handler.changePassword)
			authProtected.GET("/me", handler.authMe)
			authProtected.GET("/sessions", handler.listAuthSessions)
			authProtected.DELETE("/sessions/:sessionId", handler.deleteAuthSession)
		}
	}

	protected := api.Group("")
	protected.Use(middleware.Auth(deps.IdentityProvider))
	protected.Use(middleware.WorkspaceContext())
	{
		protected.GET("/me", handler.me)
		protected.PATCH("/me", handler.updateMe)

		protected.GET("/workspaces", handler.listWorkspaces)
		protected.POST("/workspaces", handler.createWorkspace)
		protected.GET("/workspaces/:workspaceId", handler.getWorkspace)
		protected.PATCH("/workspaces/:workspaceId", handler.updateWorkspace)
		protected.DELETE("/workspaces/:workspaceId", handler.deleteWorkspace)
		protected.GET("/workspaces/:workspaceId/sso", handler.getWorkspaceSSO)
		protected.PATCH("/workspaces/:workspaceId/sso", handler.updateWorkspaceSSO)

		protected.GET("/workspaces/:workspaceId/members", handler.listWorkspaceMembers)
		protected.POST("/workspaces/:workspaceId/members", handler.createWorkspaceMember)
		protected.POST("/workspaces/:workspaceId/members/provision", handler.provisionWorkspaceUser)
		protected.PATCH("/workspaces/:workspaceId/members/:userId", handler.updateWorkspaceMember)
		protected.DELETE("/workspaces/:workspaceId/members/:userId", handler.deleteWorkspaceMember)

		protected.GET("/workspaces/:workspaceId/teams", handler.listTeams)
		protected.POST("/workspaces/:workspaceId/teams", handler.createTeam)
		protected.GET("/teams/:teamId", handler.getTeam)
		protected.PATCH("/teams/:teamId", handler.updateTeam)
		protected.DELETE("/teams/:teamId", handler.deleteTeam)

		protected.GET("/workspaces/:workspaceId/channels", handler.listChannels)
		protected.POST("/workspaces/:workspaceId/channels", handler.createChannel)
		protected.GET("/channels/:channelId", handler.getChannel)
		protected.PATCH("/channels/:channelId", handler.updateChannel)
		protected.DELETE("/channels/:channelId", handler.deleteChannel)

		protected.GET("/workspaces/:workspaceId/conversations", handler.listConversations)
		protected.POST("/workspaces/:workspaceId/conversations", handler.createConversation)
		protected.GET("/conversations/:conversationId", handler.getConversation)
		protected.PATCH("/conversations/:conversationId", handler.updateConversation)
		protected.DELETE("/conversations/:conversationId", handler.deleteConversation)

		protected.GET("/conversations/:conversationId/messages", handler.listMessages)
		protected.POST("/conversations/:conversationId/messages", handler.createMessage)
		protected.POST("/conversations/:conversationId/read", handler.markRead)
		protected.GET("/messages/:messageId", handler.getMessage)
		protected.PATCH("/messages/:messageId", handler.updateMessage)
		protected.DELETE("/messages/:messageId", handler.deleteMessage)
		protected.POST("/messages/:messageId/reactions", handler.createReaction)
		protected.DELETE("/messages/:messageId/reactions/:emoji", handler.deleteReaction)

		protected.GET("/workspaces/:workspaceId/meetings", handler.listMeetings)
		protected.POST("/workspaces/:workspaceId/meetings", handler.createMeeting)
		protected.GET("/meetings/:meetingId", handler.getMeeting)
		protected.POST("/meetings/:meetingId/start", handler.startMeeting)
		protected.POST("/meetings/:meetingId/end", handler.endMeeting)
		protected.POST("/meetings/:meetingId/cancel", handler.cancelMeeting)
		protected.GET("/meetings/:meetingId/participants", handler.listMeetingParticipants)
		protected.POST("/meetings/:meetingId/participants", handler.addMeetingParticipant)
		protected.POST("/meetings/:meetingId/join-token", handler.meetingJoinToken)

		protected.GET("/workspaces/:workspaceId/applications", handler.listApplications)
		protected.POST("/workspaces/:workspaceId/applications", handler.createApplication)
		protected.GET("/applications/:applicationId", handler.getApplication)
		protected.PATCH("/applications/:applicationId", handler.updateApplication)
		protected.DELETE("/applications/:applicationId", handler.deleteApplication)

		protected.GET("/workspaces/:workspaceId/audit-logs", handler.listAuditLogs)

		protected.GET("/notifications", handler.listNotifications)
		protected.GET("/notifications/unread-count", handler.notificationsUnreadCount)
		protected.POST("/notifications/:notificationId/read", handler.markNotificationRead)
		protected.POST("/notifications/read-all", handler.markAllNotificationsRead)
		protected.GET("/me/notification-preferences", handler.getNotificationPreferences)
		protected.PATCH("/me/notification-preferences", handler.updateNotificationPreferences)
		protected.GET("/me/preferences", handler.getPreferences)
		protected.PATCH("/me/preferences", handler.updatePreferences)

		protected.GET("/workspaces/:workspaceId/contacts", handler.listContacts)
		protected.POST("/workspaces/:workspaceId/contacts", handler.createContact)
		protected.GET("/contacts/:contactId", handler.getContact)
		protected.PATCH("/contacts/:contactId", handler.updateContact)
		protected.DELETE("/contacts/:contactId", handler.deleteContact)
		protected.GET("/workspaces/:workspaceId/contact-groups", handler.listContactGroups)
		protected.POST("/workspaces/:workspaceId/contact-groups", handler.createContactGroup)
		protected.GET("/contact-groups/:groupId", handler.getContactGroup)
		protected.PATCH("/contact-groups/:groupId", handler.updateContactGroup)
		protected.DELETE("/contact-groups/:groupId", handler.deleteContactGroup)

		protected.GET("/workspaces/:workspaceId/tasks", handler.listTasks)
		protected.POST("/workspaces/:workspaceId/tasks", handler.createTask)
		protected.GET("/tasks/:taskId", handler.getTask)
		protected.PATCH("/tasks/:taskId", handler.updateTask)
		protected.DELETE("/tasks/:taskId", handler.deleteTask)
		protected.GET("/tasks/:taskId/comments", handler.listTaskComments)
		protected.POST("/tasks/:taskId/comments", handler.createTaskComment)
		protected.PATCH("/tasks/:taskId/order", handler.updateTaskOrder)

		// Routes pour les appels en temps réel
		SetupCallRoutes(router)

		protected.GET("/workspaces/:workspaceId/projects", handler.listProjects)
		protected.POST("/workspaces/:workspaceId/projects", handler.createProject)
		protected.GET("/projects/:projectId", handler.getProject)
		protected.PATCH("/projects/:projectId", handler.updateProject)
		protected.DELETE("/projects/:projectId", handler.deleteProject)
		protected.GET("/projects/:projectId/members", handler.listProjectMembers)
		protected.PUT("/projects/:projectId/members", handler.replaceProjectMembers)

		protected.GET("/workspaces/:workspaceId/files", handler.listFiles)
		protected.POST("/workspaces/:workspaceId/files/uploads", handler.initializeFileUpload)
		protected.GET("/files/:fileId", handler.getFile)
		protected.POST("/files/:fileId/complete", handler.completeFileUpload)
		protected.GET("/files/:fileId/download-url", handler.fileDownloadURL)
		protected.DELETE("/files/:fileId", handler.deleteFile)

		protected.GET("/workspaces/:workspaceId/documents", handler.listDocuments)
		protected.POST("/workspaces/:workspaceId/documents", handler.createDocument)
		protected.GET("/documents/:documentId", handler.getDocument)
		protected.PATCH("/documents/:documentId", handler.updateDocument)
		protected.DELETE("/documents/:documentId", handler.deleteDocument)
		protected.GET("/workspaces/:workspaceId/resources", handler.listResources)
		protected.POST("/workspaces/:workspaceId/resources", handler.createResource)
		protected.GET("/resources/:resourceId", handler.getResource)
		protected.PATCH("/resources/:resourceId", handler.updateResource)
		protected.DELETE("/resources/:resourceId", handler.deleteResource)

		protected.GET("/workspaces/:workspaceId/calls/history", handler.listCallHistory)
		protected.GET("/calls/:callId", handler.getCall)
		protected.GET("/calls/:callId/voicemail", handler.getVoicemail)

		protected.GET("/realtime/ws", handler.realtime)
	}
}

type apiHandler struct {
	deps Dependencies
}

func (h *apiHandler) principal(c *gin.Context) (interfaces.Principal, bool) {
	return middleware.PrincipalFromGin(c)
}

func (h *apiHandler) live(c *gin.Context) {
	utils.Success(c, http.StatusOK, gin.H{
		"status":  "alive",
		"role":    h.runtimeRole(),
		"version": h.deps.Config.App.Version,
	})
}

func (h *apiHandler) runtimeRole() string {
	if h.deps.RuntimeRole == "" {
		return "api"
	}
	return h.deps.RuntimeRole
}

func (h *apiHandler) health(c *gin.Context) {
	status := "healthy"
	redisStatus := "disabled"
	workerStatus := "disabled"
	if err := h.deps.Database.Ping(c.Request.Context()); err != nil {
		status = "degraded"
	}
	if h.deps.Redis != nil {
		redisHealth := h.deps.Redis.Health(c.Request.Context())
		redisStatus = string(redisHealth.Status)
		if redisHealth.Status != redisclient.StatusHealthy {
			status = "degraded"
		}
	}
	if h.runtimeRole() == "all" {
		workerStatus = "healthy"
	} else if h.deps.Config.Worker.Enabled && h.deps.Redis != nil && h.deps.Redis.Raw != nil {
		workerStatus = "unavailable"
		pattern := h.deps.Redis.Keys.Cache("worker-heartbeat", "*")
		keys, err := h.deps.Redis.Raw.Keys(c.Request.Context(), pattern).Result()
		if err == nil && len(keys) > 0 {
			workerStatus = "healthy"
		}
	}
	realtimeStatus := "healthy"
	if !h.deps.Config.Realtime.Enabled {
		realtimeStatus = "disabled"
	}
	utils.Success(c, http.StatusOK, gin.H{
		"status":   status,
		"database": "healthy",
		"redis":    redisStatus,
		"worker":   workerStatus,
		"realtime": realtimeStatus,
		"role":     h.runtimeRole(),
		"version":  h.deps.Config.App.Version,
	})
}

func (h *apiHandler) ready(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()
	result := gin.H{"database": "healthy", "redis": "disabled", "realtime": "healthy", "worker": "disabled", "webrtc": "disabled"}
	if err := h.deps.Database.Ping(ctx); err != nil {
		result["database"] = "unhealthy"
		utils.Error(c, utils.ErrDependencyUnavailable)
		return
	}
	if h.deps.Config.Redis.Enabled {
		if h.deps.Redis == nil || !h.deps.Redis.IsAvailable() {
			if h.deps.Config.Redis.Required {
				result["redis"] = "unhealthy"
				utils.Error(c, utils.ErrDependencyUnavailable)
				return
			}
			result["redis"] = "unavailable"
		} else {
			result["redis"] = "healthy"
		}
	}
	if h.deps.Config.Realtime.Enabled {
		if err := h.deps.EventBus.Healthy(ctx); err != nil {
			result["realtime"] = "unhealthy"
			utils.Error(c, utils.ErrDependencyUnavailable)
			return
		}
	}
	if h.runtimeRole() == "all" {
		result["worker"] = "healthy"
	} else if h.deps.Config.Worker.Enabled && h.deps.Redis != nil && h.deps.Redis.Raw != nil {
		pattern := h.deps.Redis.Keys.Cache("worker-heartbeat", "*")
		keys, err := h.deps.Redis.Raw.Keys(ctx, pattern).Result()
		if err != nil || len(keys) == 0 {
			result["worker"] = "unavailable"
		} else {
			result["worker"] = "healthy"
		}
	}
	if h.deps.WebRTCService != nil && h.deps.Config.WebRTC.Provider == "livekit" {
		if err := h.deps.WebRTCService.Ready(ctx); err != nil {
			result["webrtc"] = "unhealthy"
			utils.Error(c, utils.ErrDependencyUnavailable)
			return
		}
		result["webrtc"] = "healthy"
	}
	utils.Success(c, http.StatusOK, gin.H{
		"status":   "ready",
		"database": result["database"],
		"redis":    result["redis"],
		"worker":   result["worker"],
		"realtime": result["realtime"],
		"webrtc":   result["webrtc"],
		"role":     h.runtimeRole(),
		"version":  h.deps.Config.App.Version,
	})
}

func (h *apiHandler) me(c *gin.Context) {
	principal, _ := h.principal(c)
	user, err := h.deps.UserService.GetMe(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{
		"id":                user.ID,
		"email":             user.Email,
		"displayName":       user.DisplayName,
		"avatarUrl":         user.AvatarURL,
		"status":            user.Status,
		"presenceStatus":    user.PresenceStatus,
		"roles":             principal.Roles,
		"permissions":       principal.Permissions,
		"workspaceId":       principal.WorkspaceID,
		"createdAt":         user.CreatedAt,
		"updatedAt":         user.UpdatedAt,
		"lastSeenAt":        user.LastSeenAt,
		"disabledAt":        user.DisabledAt,
		"emailVerifiedAt":   user.EmailVerifiedAt,
		"passwordChangedAt": user.PasswordChangedAt,
	})
}

func (h *apiHandler) updateMe(c *gin.Context) {
	var req struct {
		DisplayName string `json:"displayName"`
		AvatarURL   string `json:"avatarUrl"`
		Status      string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	user, err := h.deps.UserService.UpdateMe(c.Request.Context(), principal, req.DisplayName, req.AvatarURL, req.Status)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{
		"id":                user.ID,
		"email":             user.Email,
		"displayName":       user.DisplayName,
		"avatarUrl":         user.AvatarURL,
		"status":            user.Status,
		"presenceStatus":    user.PresenceStatus,
		"roles":             principal.Roles,
		"permissions":       principal.Permissions,
		"workspaceId":       principal.WorkspaceID,
		"createdAt":         user.CreatedAt,
		"updatedAt":         user.UpdatedAt,
		"lastSeenAt":        user.LastSeenAt,
		"disabledAt":        user.DisabledAt,
		"emailVerifiedAt":   user.EmailVerifiedAt,
		"passwordChangedAt": user.PasswordChangedAt,
	})
}

func (h *apiHandler) listWorkspaces(c *gin.Context) {
	principal, _ := h.principal(c)
	items, err := h.deps.WorkspaceService.List(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, "", false)
}

func (h *apiHandler) createWorkspace(c *gin.Context) {
	var req struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	item, err := h.deps.WorkspaceService.Create(c.Request.Context(), principal, req.Name, req.Slug, req.Description)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, item)
}

func (h *apiHandler) getWorkspace(c *gin.Context)    { h.workspaceResource(c, "get") }
func (h *apiHandler) updateWorkspace(c *gin.Context) { h.workspaceResource(c, "update") }
func (h *apiHandler) deleteWorkspace(c *gin.Context) { h.workspaceResource(c, "delete") }
func (h *apiHandler) getWorkspaceSSO(c *gin.Context) { h.workspaceSSOResource(c, "get") }
func (h *apiHandler) updateWorkspaceSSO(c *gin.Context) {
	h.workspaceSSOResource(c, "update")
}

func (h *apiHandler) workspaceResource(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	id := c.Param("workspaceId")
	switch action {
	case "get":
		item, err := h.deps.WorkspaceService.Get(c.Request.Context(), principal, id)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "update":
		var req struct{ Name, Description string }
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.WorkspaceService.Update(c.Request.Context(), principal, id, req.Name, req.Description)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "delete":
		if err := h.deps.WorkspaceService.Archive(c.Request.Context(), principal, id); err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, gin.H{"deleted": true})
	}
}

func (h *apiHandler) workspaceSSOResource(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	workspaceID := c.Param("workspaceId")
	switch action {
	case "get":
		item, err := h.deps.WorkspaceService.GetSSOConfig(c.Request.Context(), principal, workspaceID)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "update":
		var req struct {
			Provider           string            `json:"provider"`
			Enabled            bool              `json:"enabled"`
			EnforceSSO         bool              `json:"enforceSso"`
			AllowPasswordAuth  bool              `json:"allowPasswordAuth"`
			AllowAutoProvision bool              `json:"allowAutoProvision"`
			AllowIDPInitiated  bool              `json:"allowIdpInitiated"`
			DomainHint         string            `json:"domainHint"`
			IssuerURL          string            `json:"issuerUrl"`
			SSOURL             string            `json:"ssoUrl"`
			EntityID           string            `json:"entityId"`
			ClientID           string            `json:"clientId"`
			ClientSecret       *string           `json:"clientSecret"`
			ClearClientSecret  bool              `json:"clearClientSecret"`
			Certificate        string            `json:"certificate"`
			AllowedDomains     []string          `json:"allowedDomains"`
			DefaultRole        string            `json:"defaultRole"`
			AttributeMapping   map[string]string `json:"attributeMapping"`
		}
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.WorkspaceService.UpdateSSOConfig(c.Request.Context(), principal, workspaceID, services.UpdateWorkspaceSSOInput{
			Provider:           req.Provider,
			Enabled:            req.Enabled,
			EnforceSSO:         req.EnforceSSO,
			AllowPasswordAuth:  req.AllowPasswordAuth,
			AllowAutoProvision: req.AllowAutoProvision,
			AllowIDPInitiated:  req.AllowIDPInitiated,
			DomainHint:         req.DomainHint,
			IssuerURL:          req.IssuerURL,
			SSOURL:             req.SSOURL,
			EntityID:           req.EntityID,
			ClientID:           req.ClientID,
			ClientSecret:       req.ClientSecret,
			ClearClientSecret:  req.ClearClientSecret,
			Certificate:        req.Certificate,
			AllowedDomains:     req.AllowedDomains,
			DefaultRole:        req.DefaultRole,
			AttributeMapping:   req.AttributeMapping,
		}, requestMetadata(c))
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	}
}

func (h *apiHandler) listWorkspaceMembers(c *gin.Context)   { h.membersResource(c, "list") }
func (h *apiHandler) createWorkspaceMember(c *gin.Context)  { h.membersResource(c, "create") }
func (h *apiHandler) provisionWorkspaceUser(c *gin.Context) { h.membersResource(c, "provision") }
func (h *apiHandler) updateWorkspaceMember(c *gin.Context)  { h.membersResource(c, "update") }
func (h *apiHandler) deleteWorkspaceMember(c *gin.Context)  { h.membersResource(c, "delete") }

func (h *apiHandler) membersResource(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	workspaceID := c.Param("workspaceId")
	switch action {
	case "list":
		items, err := h.deps.WorkspaceService.ListMembers(c.Request.Context(), principal, workspaceID)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.List(c, items, "", false)
	case "create":
		var req struct {
			UserID string `json:"userId"`
			Email  string `json:"email"`
			Role   string `json:"role"`
		}
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.WorkspaceService.AddMember(c.Request.Context(), principal, workspaceID, req.UserID, req.Email, req.Role)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusCreated, item)
	case "provision":
		var req struct {
			Email             string `json:"email"`
			DisplayName       string `json:"displayName"`
			Role              string `json:"role"`
			TemporaryPassword string `json:"temporaryPassword"`
		}
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.WorkspaceService.ProvisionWorkspaceUser(
			c.Request.Context(),
			principal,
			workspaceID,
			services.ProvisionWorkspaceUserInput{
				Email:             req.Email,
				DisplayName:       req.DisplayName,
				Role:              req.Role,
				TemporaryPassword: req.TemporaryPassword,
			},
			requestMetadata(c),
		)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusCreated, item)
	case "update":
		var req struct{ Role string }
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.WorkspaceService.UpdateMember(c.Request.Context(), principal, workspaceID, c.Param("userId"), req.Role)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "delete":
		if err := h.deps.WorkspaceService.RemoveMember(c.Request.Context(), principal, workspaceID, c.Param("userId")); err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, gin.H{"deleted": true})
	}
}

func (h *apiHandler) listTeams(c *gin.Context)          { h.teamCollection(c, "list") }
func (h *apiHandler) createTeam(c *gin.Context)         { h.teamCollection(c, "create") }
func (h *apiHandler) getTeam(c *gin.Context)            { h.teamItem(c, "get") }
func (h *apiHandler) updateTeam(c *gin.Context)         { h.teamItem(c, "update") }
func (h *apiHandler) deleteTeam(c *gin.Context)         { h.teamItem(c, "delete") }
func (h *apiHandler) listChannels(c *gin.Context)       { h.channelCollection(c, "list") }
func (h *apiHandler) createChannel(c *gin.Context)      { h.channelCollection(c, "create") }
func (h *apiHandler) getChannel(c *gin.Context)         { h.channelItem(c, "get") }
func (h *apiHandler) updateChannel(c *gin.Context)      { h.channelItem(c, "update") }
func (h *apiHandler) deleteChannel(c *gin.Context)      { h.channelItem(c, "delete") }
func (h *apiHandler) listConversations(c *gin.Context)  { h.conversationCollection(c, "list") }
func (h *apiHandler) createConversation(c *gin.Context) { h.conversationCollection(c, "create") }
func (h *apiHandler) getConversation(c *gin.Context)    { h.conversationItem(c, "get") }
func (h *apiHandler) updateConversation(c *gin.Context) { h.conversationItem(c, "update") }
func (h *apiHandler) deleteConversation(c *gin.Context) { h.conversationItem(c, "delete") }

func (h *apiHandler) teamCollection(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	workspaceID := c.Param("workspaceId")
	switch action {
	case "list":
		items, err := h.deps.TeamService.List(c.Request.Context(), principal, workspaceID)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.List(c, items, "", false)
	case "create":
		var req struct{ Name, Description string }
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.TeamService.Create(c.Request.Context(), principal, workspaceID, req.Name, req.Description)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusCreated, item)
	}
}

func (h *apiHandler) teamItem(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	id := c.Param("teamId")
	switch action {
	case "get":
		item, err := h.deps.TeamService.Get(c.Request.Context(), principal, id)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "update":
		var req struct{ Name, Description string }
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.TeamService.Update(c.Request.Context(), principal, id, req.Name, req.Description)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "delete":
		if err := h.deps.TeamService.Delete(c.Request.Context(), principal, id); err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, gin.H{"deleted": true})
	}
}

func (h *apiHandler) channelCollection(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	workspaceID := c.Param("workspaceId")
	switch action {
	case "list":
		items, err := h.deps.ChannelService.List(c.Request.Context(), principal, workspaceID)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.List(c, items, "", false)
	case "create":
		var req struct {
			TeamID      *string `json:"teamId"`
			Name        string  `json:"name"`
			Slug        string  `json:"slug"`
			Description string  `json:"description"`
			Type        string  `json:"type"`
			Visibility  string  `json:"visibility"`
		}
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.ChannelService.Create(c.Request.Context(), principal, workspaceID, req.TeamID, req.Name, req.Slug, req.Description, req.Type, req.Visibility)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusCreated, item)
	}
}

func (h *apiHandler) channelItem(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	id := c.Param("channelId")
	switch action {
	case "get":
		item, err := h.deps.ChannelService.Get(c.Request.Context(), principal, id)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "update":
		var req struct{ Name, Description, Visibility string }
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.ChannelService.Update(c.Request.Context(), principal, id, req.Name, req.Description, req.Visibility)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "delete":
		if err := h.deps.ChannelService.Delete(c.Request.Context(), principal, id); err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, gin.H{"deleted": true})
	}
}

func (h *apiHandler) conversationCollection(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	workspaceID := c.Param("workspaceId")
	switch action {
	case "list":
		items, err := h.deps.ConversationService.ListWithMembers(c.Request.Context(), principal, workspaceID)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.List(c, items, "", false)
	case "create":
		var req struct {
			Type      string   `json:"type"`
			Name      string   `json:"name"`
			MemberIDs []string `json:"memberIds"`
		}
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.ConversationService.CreateWithMembers(c.Request.Context(), principal, workspaceID, req.Type, req.Name, req.MemberIDs)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusCreated, item)
	}
}

func (h *apiHandler) conversationItem(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	id := c.Param("conversationId")
	switch action {
	case "get":
		item, err := h.deps.ConversationService.GetWithMembers(c.Request.Context(), principal, id)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "update":
		var req struct{ Name string }
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.ConversationService.UpdateWithMembers(c.Request.Context(), principal, id, req.Name)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "delete":
		if err := h.deps.ConversationService.Delete(c.Request.Context(), principal, id); err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, gin.H{"deleted": true})
	}
}

func (h *apiHandler) listMessages(c *gin.Context) {
	principal, _ := h.principal(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	items, next, hasMore, err := h.deps.MessageService.List(c.Request.Context(), principal, c.Param("conversationId"), c.Query("cursor"), limit)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, next, hasMore)
}

func (h *apiHandler) createMessage(c *gin.Context) {
	var req struct {
		Type     string         `json:"type"`
		Content  string         `json:"content"`
		Metadata map[string]any `json:"metadata"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	item, err := h.deps.MessageService.Create(c.Request.Context(), principal, c.Param("conversationId"), req.Type, req.Content, c.GetHeader("Idempotency-Key"), req.Metadata)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, item)
}

func (h *apiHandler) getMessage(c *gin.Context) {
	principal, _ := h.principal(c)
	item, err := h.deps.MessageService.Get(c.Request.Context(), principal, c.Param("messageId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, item)
}

func (h *apiHandler) updateMessage(c *gin.Context) {
	var req struct{ Content string }
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	item, err := h.deps.MessageService.Update(c.Request.Context(), principal, c.Param("messageId"), req.Content)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, item)
}

func (h *apiHandler) deleteMessage(c *gin.Context) {
	principal, _ := h.principal(c)
	if err := h.deps.MessageService.Delete(c.Request.Context(), principal, c.Param("messageId")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *apiHandler) createReaction(c *gin.Context) {
	var req struct {
		Emoji string `json:"emoji"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	item, err := h.deps.MessageService.AddReaction(c.Request.Context(), principal, c.Param("messageId"), req.Emoji)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, item)
}

func (h *apiHandler) deleteReaction(c *gin.Context) {
	principal, _ := h.principal(c)
	if err := h.deps.MessageService.RemoveReaction(c.Request.Context(), principal, c.Param("messageId"), c.Param("emoji")); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"deleted": true})
}

func (h *apiHandler) markRead(c *gin.Context) {
	var req struct {
		MessageID string `json:"messageId"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	if err := h.deps.MessageService.MarkRead(c.Request.Context(), principal, c.Param("conversationId"), req.MessageID); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"updated": true})
}

func (h *apiHandler) listMeetings(c *gin.Context) {
	principal, _ := h.principal(c)
	items, err := h.deps.MeetingService.List(c.Request.Context(), principal, c.Param("workspaceId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, "", false)
}

func (h *apiHandler) createMeeting(c *gin.Context) {
	var req struct {
		Title          string  `json:"title"`
		ConversationID *string `json:"conversationId"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	item, err := h.deps.MeetingService.Create(c.Request.Context(), principal, c.Param("workspaceId"), req.Title, req.ConversationID)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, item)
}

func (h *apiHandler) getMeeting(c *gin.Context)   { h.meetingAction(c, "get") }
func (h *apiHandler) startMeeting(c *gin.Context) { h.meetingAction(c, "start") }
func (h *apiHandler) endMeeting(c *gin.Context)   { h.meetingAction(c, "end") }
func (h *apiHandler) cancelMeeting(c *gin.Context) {
	principal, _ := h.principal(c)
	item, err := h.deps.MeetingService.Cancel(c.Request.Context(), principal, c.Param("meetingId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, item)
}
func (h *apiHandler) listMeetingParticipants(c *gin.Context) {
	principal, _ := h.principal(c)
	items, err := h.deps.MeetingService.ListParticipants(c.Request.Context(), principal, c.Param("meetingId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, "", false)
}
func (h *apiHandler) addMeetingParticipant(c *gin.Context) {
	var req struct {
		UserID string `json:"userId"`
		Role   string `json:"role"`
	}
	if c.ShouldBindJSON(&req) != nil || req.UserID == "" {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	item, err := h.deps.MeetingService.AddParticipant(c.Request.Context(), principal, c.Param("meetingId"), req.UserID, req.Role)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, item)
}

func (h *apiHandler) meetingAction(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	id := c.Param("meetingId")
	switch action {
	case "get":
		item, err := h.deps.MeetingService.Get(c.Request.Context(), principal, id)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "start":
		item, err := h.deps.MeetingService.Start(c.Request.Context(), principal, id)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	case "end":
		item, err := h.deps.MeetingService.End(c.Request.Context(), principal, id)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, item)
	}
}

func (h *apiHandler) meetingJoinToken(c *gin.Context) {
	principal, _ := h.principal(c)
	token, err := h.deps.MeetingService.JoinToken(c.Request.Context(), principal, c.Param("meetingId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, token)
}

func (h *apiHandler) livekitWebhook(c *gin.Context) {
	if h.deps.WebRTCService == nil {
		utils.Error(c, utils.ErrMeetingProviderUnavailable)
		return
	}
	if err := h.deps.WebRTCService.HandleLiveKitWebhook(c.Request.Context(), c.Request); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"status": "accepted"})
}

func (h *apiHandler) metrics(c *gin.Context) {
	if h.deps.WebRTCMetrics == nil {
		c.String(http.StatusOK, "")
		return
	}
	c.Header("Content-Type", "text/plain; version=0.0.4")
	c.String(http.StatusOK, h.deps.WebRTCMetrics.RenderPrometheus())
}

func (h *apiHandler) listApplications(c *gin.Context)  { h.applicationCollection(c, "list") }
func (h *apiHandler) createApplication(c *gin.Context) { h.applicationCollection(c, "create") }
func (h *apiHandler) getApplication(c *gin.Context)    { h.applicationItem(c, "get") }
func (h *apiHandler) updateApplication(c *gin.Context) { h.applicationItem(c, "update") }
func (h *apiHandler) deleteApplication(c *gin.Context) { h.applicationItem(c, "delete") }

func (h *apiHandler) applicationCollection(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	workspaceID := c.Param("workspaceId")
	switch action {
	case "list":
		items, err := h.deps.IntegrationService.List(c.Request.Context(), principal, workspaceID)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.List(c, items, "", false)
	case "create":
		var req struct {
			Provider      string         `json:"provider"`
			Name          string         `json:"name"`
			Configuration map[string]any `json:"configuration"`
		}
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.IntegrationService.Create(c.Request.Context(), principal, workspaceID, req.Provider, req.Name, req.Configuration)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusCreated, item)
	}
}

func (h *apiHandler) applicationItem(c *gin.Context, action string) {
	principal, _ := h.principal(c)
	id := c.Param("applicationId")
	switch action {
	case "get":
		item, err := h.deps.IntegrationService.Get(c.Request.Context(), principal, id)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, sanitizeIntegration(item))
	case "update":
		var req struct{ Name, Status string }
		if c.ShouldBindJSON(&req) != nil {
			utils.Error(c, utils.ErrValidationFailed)
			return
		}
		item, err := h.deps.IntegrationService.Update(c.Request.Context(), principal, id, req.Name, req.Status)
		if err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, sanitizeIntegration(item))
	case "delete":
		if err := h.deps.IntegrationService.Delete(c.Request.Context(), principal, id); err != nil {
			utils.Error(c, err)
			return
		}
		utils.Success(c, http.StatusOK, gin.H{"deleted": true})
	}
}

func (h *apiHandler) webhook(c *gin.Context) {
	payload, _ := io.ReadAll(io.LimitReader(c.Request.Body, 1<<20))
	if err := h.deps.IntegrationService.HandleWebhook(c.Request.Context(), c.Param("provider"), c.Param("integrationId"), payload, c.Request.Header); err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusAccepted, gin.H{"accepted": true})
}

func (h *apiHandler) listAuditLogs(c *gin.Context) {
	principal, _ := h.principal(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	items, err := h.deps.AuditService.List(c.Request.Context(), principal, c.Param("workspaceId"), limit)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, "", false)
}

func (h *apiHandler) realtime(c *gin.Context) {
	principal, ok := h.principal(c)
	if !ok {
		utils.Error(c, utils.ErrUnauthorized)
		return
	}
	h.deps.Hub.Handle(c, principal)
}

func (h *apiHandler) listNotifications(c *gin.Context) {
	principal, _ := h.principal(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	items, next, hasMore, err := h.deps.NotificationService.List(c.Request.Context(), principal, c.Query("cursor"), limit)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, next, hasMore)
}
func (h *apiHandler) notificationsUnreadCount(c *gin.Context) {
	principal, _ := h.principal(c)
	count, err := h.deps.NotificationService.UnreadCount(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"count": count})
}
func (h *apiHandler) markNotificationRead(c *gin.Context) {
	principal, _ := h.principal(c)
	updated, err := h.deps.NotificationService.MarkRead(c.Request.Context(), principal, c.Param("notificationId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"updated": updated})
}
func (h *apiHandler) markAllNotificationsRead(c *gin.Context) {
	principal, _ := h.principal(c)
	updated, err := h.deps.NotificationService.MarkAllRead(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, gin.H{"updated": updated})
}
func (h *apiHandler) getNotificationPreferences(c *gin.Context) {
	principal, _ := h.principal(c)
	item, err := h.deps.UserService.GetNotificationPreferences(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, item)
}
func (h *apiHandler) updateNotificationPreferences(c *gin.Context) {
	principal, _ := h.principal(c)
	var req services.NotificationPreferencesDTO
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	item, err := h.deps.UserService.UpdateNotificationPreferences(c.Request.Context(), principal, req)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, item)
}
func (h *apiHandler) getPreferences(c *gin.Context) {
	principal, _ := h.principal(c)
	item, err := h.deps.UserService.GetPreferences(c.Request.Context(), principal)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, item)
}
func (h *apiHandler) updatePreferences(c *gin.Context) {
	principal, _ := h.principal(c)
	var req services.UserPreferencesDTO
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	item, err := h.deps.UserService.UpdatePreferences(c.Request.Context(), principal, req)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusOK, item)
}

func (h *apiHandler) listContacts(c *gin.Context)      { h.notImplemented(c, "contacts listing") }
func (h *apiHandler) createContact(c *gin.Context)     { h.notImplemented(c, "contact creation") }
func (h *apiHandler) getContact(c *gin.Context)        { h.notImplemented(c, "contact retrieval") }
func (h *apiHandler) updateContact(c *gin.Context)     { h.notImplemented(c, "contact update") }
func (h *apiHandler) deleteContact(c *gin.Context)     { h.notImplemented(c, "contact deletion") }
func (h *apiHandler) listContactGroups(c *gin.Context) { h.notImplemented(c, "contact group listing") }
func (h *apiHandler) createContactGroup(c *gin.Context) {
	h.notImplemented(c, "contact group creation")
}
func (h *apiHandler) getContactGroup(c *gin.Context)    { h.notImplemented(c, "contact group retrieval") }
func (h *apiHandler) updateContactGroup(c *gin.Context) { h.notImplemented(c, "contact group update") }
func (h *apiHandler) deleteContactGroup(c *gin.Context) {
	h.notImplemented(c, "contact group deletion")
}

func (h *apiHandler) listTasks(c *gin.Context) {
	principal, _ := h.principal(c)
	items, err := h.deps.TaskService.List(c.Request.Context(), principal, c.Param("workspaceId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, "", false)
}
func (h *apiHandler) createTask(c *gin.Context) {
	var req struct {
		Title       string     `json:"title"`
		Description string     `json:"description"`
		Status      string     `json:"status"`
		Priority    string     `json:"priority"`
		Project     string     `json:"project"`
		DueAt       *time.Time `json:"dueAt"`
	}
	if c.ShouldBindJSON(&req) != nil {
		utils.Error(c, utils.ErrValidationFailed)
		return
	}
	principal, _ := h.principal(c)
	item, err := h.deps.TaskService.Create(
		c.Request.Context(),
		principal,
		c.Param("workspaceId"),
		req.Title,
		req.Description,
		req.Status,
		req.Priority,
		req.Project,
		req.DueAt,
	)
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.Success(c, http.StatusCreated, item)
}
func (h *apiHandler) getTask(c *gin.Context)           { h.notImplemented(c, "task retrieval") }
func (h *apiHandler) updateTask(c *gin.Context)        { h.notImplemented(c, "task update") }
func (h *apiHandler) deleteTask(c *gin.Context)        { h.notImplemented(c, "task deletion") }
func (h *apiHandler) listTaskComments(c *gin.Context)  { h.notImplemented(c, "task comment listing") }
func (h *apiHandler) createTaskComment(c *gin.Context) { h.notImplemented(c, "task comment creation") }
func (h *apiHandler) updateTaskOrder(c *gin.Context)   { h.notImplemented(c, "task ordering") }

func (h *apiHandler) listProjects(c *gin.Context) {
	principal, _ := h.principal(c)
	items, err := h.deps.ProjectService.List(c.Request.Context(), principal, c.Param("workspaceId"))
	if err != nil {
		utils.Error(c, err)
		return
	}
	utils.List(c, items, "", false)
}
func (h *apiHandler) createProject(c *gin.Context) { h.notImplemented(c, "project creation") }
func (h *apiHandler) getProject(c *gin.Context)    { h.notImplemented(c, "project retrieval") }
func (h *apiHandler) updateProject(c *gin.Context) { h.notImplemented(c, "project update") }
func (h *apiHandler) deleteProject(c *gin.Context) { h.notImplemented(c, "project deletion") }
func (h *apiHandler) listProjectMembers(c *gin.Context) {
	h.notImplemented(c, "project member listing")
}
func (h *apiHandler) replaceProjectMembers(c *gin.Context) {
	h.notImplemented(c, "project member management")
}

func (h *apiHandler) listFiles(c *gin.Context) { h.notImplemented(c, "file listing") }
func (h *apiHandler) initializeFileUpload(c *gin.Context) {
	h.notImplemented(c, "file upload initialization")
}
func (h *apiHandler) getFile(c *gin.Context) { h.notImplemented(c, "file retrieval") }
func (h *apiHandler) completeFileUpload(c *gin.Context) {
	h.notImplemented(c, "file upload completion")
}
func (h *apiHandler) fileDownloadURL(c *gin.Context) { h.notImplemented(c, "file download url") }
func (h *apiHandler) deleteFile(c *gin.Context)      { h.notImplemented(c, "file deletion") }

func (h *apiHandler) listDocuments(c *gin.Context)  { h.notImplemented(c, "document listing") }
func (h *apiHandler) createDocument(c *gin.Context) { h.notImplemented(c, "document creation") }
func (h *apiHandler) getDocument(c *gin.Context)    { h.notImplemented(c, "document retrieval") }
func (h *apiHandler) updateDocument(c *gin.Context) { h.notImplemented(c, "document update") }
func (h *apiHandler) deleteDocument(c *gin.Context) { h.notImplemented(c, "document deletion") }
func (h *apiHandler) listResources(c *gin.Context)  { h.notImplemented(c, "resource listing") }
func (h *apiHandler) createResource(c *gin.Context) { h.notImplemented(c, "resource creation") }
func (h *apiHandler) getResource(c *gin.Context)    { h.notImplemented(c, "resource retrieval") }
func (h *apiHandler) updateResource(c *gin.Context) { h.notImplemented(c, "resource update") }
func (h *apiHandler) deleteResource(c *gin.Context) { h.notImplemented(c, "resource deletion") }

func (h *apiHandler) listCallHistory(c *gin.Context) { h.notImplemented(c, "call history") }
func (h *apiHandler) getCall(c *gin.Context)         { h.notImplemented(c, "call retrieval") }
func (h *apiHandler) getVoicemail(c *gin.Context)    { h.notImplemented(c, "voicemail retrieval") }

func (h *apiHandler) notImplemented(c *gin.Context, capability string) {
	utils.Error(c, utils.NewError(http.StatusNotImplemented, "NOT_IMPLEMENTED", capability+" is not implemented yet.", nil))
}

func sanitizeIntegration(item any) any {
	return item
}
