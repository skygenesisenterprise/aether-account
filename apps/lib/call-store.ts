import { create } from "zustand";
import type { IncomingCallNotification } from "@/types/call";

interface CallStoreState {
  // Incoming call notifications
  incomingCalls: Map<string, IncomingCallNotification>;
  
  // Outgoing call invitations (waiting for acceptance)
  outgoingCallInvitations: Map<string, { 
    conversationId: string; 
    calleeId: string; 
    mode: "audio" | "video";
    createdAt: Date;
  }>;
  
  // Active call for current conversation
  activeCallConversationId: string | null;
  
  // Actions
  addIncomingCall: (notification: IncomingCallNotification) => void;
  removeIncomingCall: (callId: string) => void;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  addOutgoingCall: (conversationId: string, calleeId: string, mode: "audio" | "video") => void;
  removeOutgoingCall: (conversationId: string) => void;
  setActiveCall: (conversationId: string | null) => void;
  clearAllCalls: () => void;
  
  // Getters
  getIncomingCallForConversation: (conversationId: string) => IncomingCallNotification | null;
  hasIncomingCall: (conversationId: string) => boolean;
  hasOutgoingCall: (conversationId: string) => boolean;
  isInCall: (conversationId: string) => boolean;
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  incomingCalls: new Map(),
  outgoingCallInvitations: new Map(),
  activeCallConversationId: null,
  
  addIncomingCall: (notification) => {
    set((state) => {
      const next = new Map(state.incomingCalls);
      next.set(notification.id, notification);
      return { incomingCalls: next };
    });
  },
  
  removeIncomingCall: (callId) => {
    set((state) => {
      const next = new Map(state.incomingCalls);
      next.delete(callId);
      return { incomingCalls: next };
    });
  },
  
  acceptCall: (callId) => {
    const notification = get().incomingCalls.get(callId);
    if (notification) {
      set((state) => {
        const next = new Map(state.incomingCalls);
        next.delete(callId);
        return { 
          incomingCalls: next,
          activeCallConversationId: notification.conversationId,
        };
      });
    }
  },
  
  rejectCall: (callId) => {
    set((state) => {
      const next = new Map(state.incomingCalls);
      next.delete(callId);
      return { incomingCalls: next };
    });
  },
  
  addOutgoingCall: (conversationId, calleeId, mode) => {
    set((state) => {
      const next = new Map(state.outgoingCallInvitations);
      next.set(conversationId, { conversationId, calleeId, mode, createdAt: new Date() });
      return { outgoingCallInvitations: next };
    });
  },
  
  removeOutgoingCall: (conversationId) => {
    set((state) => {
      const next = new Map(state.outgoingCallInvitations);
      next.delete(conversationId);
      return { outgoingCallInvitations: next };
    });
  },
  
  setActiveCall: (conversationId) => {
    set({ activeCallConversationId: conversationId });
  },
  
  clearAllCalls: () => {
    set({
      incomingCalls: new Map(),
      outgoingCallInvitations: new Map(),
      activeCallConversationId: null,
    });
  },
  
  getIncomingCallForConversation: (conversationId) => {
    const calls = get().incomingCalls;
    for (const [, notification] of calls) {
      if (notification.conversationId === conversationId) {
        return notification;
      }
    }
    return null;
  },
  
  hasIncomingCall: (conversationId) => {
    return get().getIncomingCallForConversation(conversationId) !== null;
  },
  
  hasOutgoingCall: (conversationId) => {
    return get().outgoingCallInvitations.has(conversationId);
  },
  
  isInCall: (conversationId) => {
    return get().activeCallConversationId === conversationId;
  },
}));
