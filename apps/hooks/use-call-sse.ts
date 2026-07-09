"use client";

import { useEffect, useRef } from "react";
import { useCallStore } from "@/lib/call-store";
import { usePlatform } from "@/context/PlatformContext";
import { getSharedRealtimeClient } from "@/lib/api/realtime/client";

export interface CallInvitationEvent {
  type: "call_invitation";
  data: {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    conversationId: string;
    mode: "audio" | "video";
    meetingId: string;
    token: string;
    signalingUrl: string;
    createdAt: string;
    status: string;
  };
  time: string;
}

export interface CallAcceptedEvent {
  type: "call_accepted";
  data: {
    callId: string;
    conversationId: string;
  };
  time: string;
}

export interface CallRejectedEvent {
  type: "call_rejected";
  data: {
    callId: string;
    conversationId: string;
  };
  time: string;
}

export interface CallCancelledEvent {
  type: "call_cancelled";
  data: {
    callId: string;
    conversationId?: string;
  };
  time: string;
}

export interface SSEConnectedEvent {
  type: "connected";
  data?: never;
  time: string;
}

export type CallSSEEvent = 
  | CallInvitationEvent 
  | CallAcceptedEvent 
  | CallRejectedEvent 
  | CallCancelledEvent
  | SSEConnectedEvent;

export function useCallSSE() {
  const { currentUser } = usePlatform();
  const { addIncomingCall, removeIncomingCall, removeOutgoingCall } = useCallStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const intentionalCloseRef = useRef(false);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    intentionalCloseRef.current = false;

    // Construire l'URL SSE
    const sseUrl = `${window.location.origin}/api/v1/calls/events?userId=${currentUser.id}`;

    // Créer la connexion EventSource
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connected for calls");
    };

    // Gérer les différents types d'événements
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        
        // Vérifier que c'est un objet avec un type
        if (!parsedData || typeof parsedData !== "object" || !parsedData.type) {
          console.error("Invalid SSE event: missing type");
          return;
        }

        const eventType = parsedData.type as string;
        const eventData = parsedData.data;

        switch (eventType) {
          case "call_invitation":
            // Recevoir une invitation d'appel
            const invitation = eventData as CallInvitationEvent["data"];
            addIncomingCall({
              id: invitation.id,
              callerId: invitation.fromUserId,
              callerName: invitation.fromUserName,
              callerAvatar: undefined,
              conversationId: invitation.conversationId,
              conversationName: "Conversation", // À améliorer
              mode: invitation.mode as "audio" | "video",
              meetingId: invitation.meetingId,
              token: invitation.token,
              signalingUrl: invitation.signalingUrl,
              createdAt: new Date(invitation.createdAt),
            });
            break;

          case "call_accepted":
            // L'appel a été accepté par le destinataire
            const acceptedData = eventData as CallAcceptedEvent["data"];
            removeOutgoingCall(acceptedData.conversationId);
            break;

          case "call_rejected":
            // L'appel a été refusé par le destinataire
            const rejectedData = eventData as CallRejectedEvent["data"];
            removeOutgoingCall(rejectedData.conversationId);
            break;

          case "call_cancelled":
            // L'appel a été annulé par l'appelant
            const cancelledData = eventData as CallCancelledEvent["data"];
            removeIncomingCall(cancelledData.callId);
            break;

          case "connected":
            // Handshake SSE reçu
            break;

          default:
            console.log("Unknown SSE event type:", eventType);
        }
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    };

    eventSource.onerror = (error) => {
      if (intentionalCloseRef.current) {
        return;
      }

      // EventSource gère lui-meme la reconnexion. En dev, un close/reconnect
      // transitoire ne doit pas polluer la console comme une erreur applicative.
      if (eventSource.readyState === EventSource.CONNECTING) {
        console.warn("SSE reconnecting for calls");
        return;
      }

      console.warn("SSE closed for calls", error);
    };

    // Nettoyer à la déconnexion
    return () => {
      intentionalCloseRef.current = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [currentUser?.id, addIncomingCall, removeIncomingCall, removeOutgoingCall]);

  // Fallback: écouter aussi les événements d'appel via le WebSocket Realtime
  useEffect(() => {
    const realtime = getSharedRealtimeClient();
    const subscription = realtime.subscribe((event) => {
      if (event.type !== "call_invitation" || !currentUser?.id) return;

      const data = (event as any).data as CallInvitationEvent["data"] | undefined;
      if (!data || data.toUserId !== currentUser.id) return;

      addIncomingCall({
        id: data.id,
        callerId: data.fromUserId,
        callerName: data.fromUserName,
        callerAvatar: undefined,
        conversationId: data.conversationId,
        conversationName: "Conversation",
        mode: data.mode as "audio" | "video",
        meetingId: data.meetingId,
        token: data.token,
        signalingUrl: data.signalingUrl,
        createdAt: new Date(data.createdAt),
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id, addIncomingCall]);

  return {
    isConnected: eventSourceRef.current !== null,
  };
}
