package routes

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CallInvitation représente une invitation d'appel
type CallInvitation struct {
	ID             string    `json:"id"`
	FromUserID     string    `json:"fromUserId"`
	FromUserName   string    `json:"fromUserName"`
	ToUserID       string    `json:"toUserId"`
	ConversationID string    `json:"conversationId"`
	Mode           string    `json:"mode"` // "audio" or "video"
	MeetingID      string    `json:"meetingId"`
	Token          string    `json:"token"`
	SignalingURL   string    `json:"signalingUrl"`
	CreatedAt      time.Time `json:"createdAt"`
	Status         string    `json:"status"` // "pending", "accepted", "rejected", "cancelled"
}

// In-memory storage for call invitations and SSE clients
var (
	callInvitations     = make(map[string]CallInvitation)
	callInvitationsMutex = &sync.RWMutex{}
	
	// SSE clients: userID -> http.ResponseWriter
	sseClients     = make(map[string]http.ResponseWriter)
	sseClientsMutex = &sync.RWMutex{}
)

// SetupCallRoutes configure les routes pour les appels
func SetupCallRoutes(router *gin.Engine) {
	router.GET("/api/v1/calls/events", handleSSE)
	router.POST("/api/v1/calls/invite", handleSendCallInvite)
	router.POST("/api/v1/calls/:id/accept", handleAcceptCall)
	router.POST("/api/v1/calls/:id/reject", handleRejectCall)
	router.POST("/api/v1/calls/:id/cancel", handleCancelCall)
	router.GET("/api/v1/calls/pending", handleGetPendingCalls)
}

// handleSSE gère les connexions Server-Sent Events
func handleSSE(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	// Configurer les headers pour SSE
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Headers", "Cache-Control")

	// Récupérer le ResponseWriter
	w := c.Writer

	// Enregistrer le client
	sseClientsMutex.Lock()
	sseClients[userID] = w
	sseClientsMutex.Unlock()

	// Envoyer un événement de connexion
	fmt.Fprintf(w, "data: {\"type\":\"connected\"}\n\n")
	w.Flush()

	// Garder la connexion ouverte
	<-c.Request.Context().Done()

	// Nettoyer à la déconnexion
	sseClientsMutex.Lock()
	delete(sseClients, userID)
	sseClientsMutex.Unlock()
}

// sendSSEEvent envoie un événement à un utilisateur spécifique
func sendSSEEvent(toUserID string, eventType string, data interface{}) {
	sseClientsMutex.RLock()
	writer, exists := sseClients[toUserID]
	sseClientsMutex.RUnlock()

	if !exists {
		log.Printf("User %s not connected via SSE", toUserID)
		return
	}

	// Créer l'événement
	event := map[string]interface{}{
		"type":    eventType,
		"data":    data,
		"time":    time.Now().Format(time.RFC3339),
	}

	// Envoyer l'événement
	jsonData, err := json.Marshal(event)
	if err != nil {
		log.Printf("Failed to marshal event: %v", err)
		return
	}

	fmt.Fprintf(writer, "data: %s\n\n", jsonData)
	
	// Flush pour s'assurer que l'événement est envoyé immédiatement
	if f, ok := writer.(http.Flusher); ok {
		f.Flush()
	}
}

// handleSendCallInvite gère l'envoi d'une invitation d'appel
func handleSendCallInvite(c *gin.Context) {
	var req struct {
		ToUserID       string `json:"toUserId"`
		FromUserID     string `json:"fromUserId"`
		FromUserName   string `json:"fromUserName"`
		ConversationID string `json:"conversationId"`
		Mode           string `json:"mode"`
		MeetingID      string `json:"meetingId"`
		Token          string `json:"token"`
		SignalingURL   string `json:"signalingUrl"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Créer une nouvelle invitation
	invitation := CallInvitation{
		ID:             uuid.New().String(),
		FromUserID:     req.FromUserID,
		FromUserName:   req.FromUserName,
		ToUserID:       req.ToUserID,
		ConversationID: req.ConversationID,
		Mode:           req.Mode,
		MeetingID:      req.MeetingID,
		Token:          req.Token,
		SignalingURL:   req.SignalingURL,
		CreatedAt:      time.Now(),
		Status:         "pending",
	}

	// Stocker l'invitation
	callInvitationsMutex.Lock()
	callInvitations[invitation.ID] = invitation
	callInvitationsMutex.Unlock()

	// Envoyer l'événement au destinataire
	sendSSEEvent(req.ToUserID, "call_invitation", invitation)

	// Répondre avec l'invitation créée
	c.JSON(http.StatusOK, invitation)
}

// handleAcceptCall gère l'acceptation d'un appel
func handleAcceptCall(c *gin.Context) {
	callID := c.Param("id")

	callInvitationsMutex.Lock()
	invitation, exists := callInvitations[callID]
	if !exists {
		callInvitationsMutex.Unlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "Call invitation not found"})
		return
	}

	// Mettre à jour le statut
	invitation.Status = "accepted"
	callInvitations[callID] = invitation
	callInvitationsMutex.Unlock()

	// Notifier l'appelant que l'appel a été accepté
	sendSSEEvent(invitation.FromUserID, "call_accepted", map[string]string{
		"callId":        callID,
		"conversationId": invitation.ConversationID,
	})

	c.JSON(http.StatusOK, invitation)
}

// handleRejectCall gère le refus d'un appel
func handleRejectCall(c *gin.Context) {
	callID := c.Param("id")

	callInvitationsMutex.Lock()
	invitation, exists := callInvitations[callID]
	if !exists {
		callInvitationsMutex.Unlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "Call invitation not found"})
		return
	}

	// Mettre à jour le statut
	invitation.Status = "rejected"
	callInvitations[callID] = invitation
	callInvitationsMutex.Unlock()

	// Notifier l'appelant que l'appel a été refusé
	sendSSEEvent(invitation.FromUserID, "call_rejected", map[string]string{
		"callId":        callID,
		"conversationId": invitation.ConversationID,
	})

	c.JSON(http.StatusOK, invitation)
}

// handleCancelCall gère l'annulation d'un appel
func handleCancelCall(c *gin.Context) {
	callID := c.Param("id")

	callInvitationsMutex.Lock()
	invitation, exists := callInvitations[callID]
	if !exists {
		callInvitationsMutex.Unlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "Call invitation not found"})
		return
	}

	// Mettre à jour le statut
	invitation.Status = "cancelled"
	callInvitations[callID] = invitation
	callInvitationsMutex.Unlock()

	// Notifier le destinataire que l'appel a été annulé
	sendSSEEvent(invitation.ToUserID, "call_cancelled", map[string]string{
		"callId":        callID,
		"conversationId": invitation.ConversationID,
	})

	c.JSON(http.StatusOK, invitation)
}

// handleGetPendingCalls retourne les appels en attente pour un utilisateur
func handleGetPendingCalls(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	callInvitationsMutex.RLock()
	var pendingCalls []CallInvitation
	for _, invitation := range callInvitations {
		if invitation.ToUserID == userID && invitation.Status == "pending" {
			pendingCalls = append(pendingCalls, invitation)
		}
	}
	callInvitationsMutex.RUnlock()

	c.JSON(http.StatusOK, pendingCalls)
}
