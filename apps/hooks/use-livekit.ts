"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Room, RoomEvent, ConnectionState, Track, type LocalParticipant, type RemoteParticipant, type TrackPublication } from "livekit-client";
import { useToast } from "./use-toast";

export interface LiveKitRoomOptions {
  roomName: string;
  token: string;
  signalingUrl: string;
  participantName?: string;
  participantIdentity?: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  screenSharingEnabled?: boolean;
}

export interface LiveKitRoomState {
  room: Room | null;
  isConnecting: boolean;
  isConnected: boolean;
  isDisconnected: boolean;
  error: Error | null;
  localParticipant: LocalParticipant | null;
  remoteParticipants: Map<string, RemoteParticipant>;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
}

export interface LiveKitRoomControls {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenSharing: () => Promise<void>;
}

export function useLiveKitRoom(options: LiveKitRoomOptions): LiveKitRoomState & LiveKitRoomControls {
  const router = useRouter();
  const { toast } = useToast();
  
  const [room, setRoom] = React.useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isDisconnected, setIsDisconnected] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [localParticipant, setLocalParticipant] = React.useState<LocalParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = React.useState<Map<string, RemoteParticipant>>(new Map());
  const [isAudioMuted, setIsAudioMuted] = React.useState(true);
  const [isVideoMuted, setIsVideoMuted] = React.useState(false);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (room) {
        const cleanup = async () => {
          try {
            await room.disconnect();
          } catch (err) {
            console.error("Error disconnecting room:", err);
          }
        };
        cleanup();
      }
    };
  }, [room]);

  // Handle room events
  const handleRoomEvents = React.useCallback((room: Room) => {
    const handleParticipantConnected = (participant: RemoteParticipant) => {
      // Auto-subscribe to all tracks from this participant
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          publication.setSubscribed(true);
        }
      });

      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        next.set(participant.identity, participant);
        return next;
      });
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        next.delete(participant.identity);
        return next;
      });
    };

    const handleTrackSubscribed = (
      track: Track,
      publication: TrackPublication,
      participant: RemoteParticipant
    ) => {
      // Track is now subscribed and ready to use
      console.log("Track subscribed:", track.kind, "from", participant.identity);
    };

    const handleTrackUnsubscribed = (
      track: Track,
      publication: TrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log("Track unsubscribed:", track.kind, "from", participant.identity);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setIsDisconnected(true);
      setIsConnecting(false);
      toast({
        title: "Déconnecté",
        description: "Vous avez été déconnecté de la réunion",
        variant: "destructive",
      });
    };

    const handleConnectionStateChanged = (state: ConnectionState) => {
      if (state === ConnectionState.Connected) {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      } else if (state === ConnectionState.Connecting || state === ConnectionState.Reconnecting) {
        setIsConnecting(true);
      } else if (state === ConnectionState.Disconnected) {
        handleDisconnected();
      }
    };

    // Subscribe to room events
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    // Initial setup
    setLocalParticipant(room.localParticipant);
    
    // Set initial mute states
    const lp = room.localParticipant;
    setIsAudioMuted(!lp.isMicrophoneEnabled);
    setIsVideoMuted(!lp.isCameraEnabled);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, []);

  const connect = React.useCallback(async () => {
    if (!options.token || !options.signalingUrl) {
      setError(new Error("Token and signaling URL are required"));
      return;
    }

    setIsConnecting(true);
    setError(null);
    setIsDisconnected(false);

    try {
      // Import Room dynamically to avoid SSR issues
      const { Room } = await import("livekit-client");
      
      const roomOptions = {
        adaptiveStream: true,
        dynacast: true,
        reconnect: true,
      };

      const newRoom = new Room(roomOptions);
      setRoom(newRoom);

      // Set up event handlers before connecting
      handleRoomEvents(newRoom);

      // Fix signaling URL for LiveKit server version compatibility
      // Older versions (1.8.3) use /rtc instead of /rtc/v1
      let signalingUrl = options.signalingUrl;
      if (signalingUrl.includes('/rtc/v1')) {
        signalingUrl = signalingUrl.replace('/rtc/v1', '/rtc');
        console.log("Adjusted signaling URL for LiveKit 1.8.3 compatibility:", signalingUrl);
      }

      // Connect to the room
      await newRoom.connect(signalingUrl, options.token);
      
      // Set participant name if provided
      if (options.participantName) {
        newRoom.localParticipant.name = options.participantName;
      }
      
      // Subscribe to existing participants' tracks
      newRoom.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track) {
            publication.setSubscribed(true);
          }
        });
      });
      
      // Enable audio/video based on options
      if (options.audioEnabled !== false) {
        await newRoom.localParticipant.setMicrophoneEnabled(true);
        setIsAudioMuted(false);
      }
      
      if (options.videoEnabled !== false) {
        await newRoom.localParticipant.setCameraEnabled(true);
        setIsVideoMuted(false);
      }

      setIsConnected(true);
      setIsConnecting(false);
      
    } catch (err) {
      setError(err as Error);
      setIsConnecting(false);
      setIsConnected(false);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à la réunion",
        variant: "destructive",
      });
      console.error("Failed to connect to room:", err);
    }
  }, [options, handleRoomEvents, toast]);

  // Auto-connect when options are available and we're not already connected
  React.useEffect(() => {
    if (options.token && options.signalingUrl && !isConnected && !isConnecting && !room) {
      void connect();
    }
  }, [options.token, options.signalingUrl, isConnected, isConnecting, room, connect]);

  const disconnect = React.useCallback(async () => {
    if (!room) return;

    try {
      await room.disconnect();
      setIsConnected(false);
      setIsDisconnected(true);
      setRoom(null);
      setLocalParticipant(null);
      setRemoteParticipants(new Map());
      
      // Redirect back to chat
      router.push("/chat");
    } catch (err) {
      console.error("Failed to disconnect:", err);
      toast({
        title: "Erreur",
        description: "Impossible de quitter la réunion",
        variant: "destructive",
      });
    }
  }, [room, router, toast]);

  const toggleAudio = React.useCallback(async () => {
    if (!room || !localParticipant) return;

    try {
      const isEnabled = !isAudioMuted;
      await localParticipant.setMicrophoneEnabled(isEnabled);
      setIsAudioMuted(!isEnabled);
    } catch (err) {
      console.error("Failed to toggle audio:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'activer/désactiver le micro",
        variant: "destructive",
      });
    }
  }, [room, localParticipant, isAudioMuted, toast]);

  const toggleVideo = React.useCallback(async () => {
    if (!room || !localParticipant) return;

    try {
      const isEnabled = !isVideoMuted;
      await localParticipant.setCameraEnabled(isEnabled);
      setIsVideoMuted(!isEnabled);
    } catch (err) {
      console.error("Failed to toggle video:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'activer/désactiver la caméra",
        variant: "destructive",
      });
    }
  }, [room, localParticipant, isVideoMuted, toast]);

  const toggleScreenSharing = React.useCallback(async () => {
    if (!room || !localParticipant) return;

    try {
      const { createLocalScreenTracks } = await import("livekit-client");
      
      if (isScreenSharing) {
        // Stop screen sharing - find screen share track by source
        const trackPublications = Array.from(localParticipant.trackPublications.values() as Iterable<TrackPublication>);
        const screenTrackPub = trackPublications.find(
          (pub) => pub.source === "screen_share"
        );
        if (screenTrackPub?.track) {
          await localParticipant.unpublishTrack(screenTrackPub.track as any);
        }
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const tracks = await createLocalScreenTracks();
        
        for (const track of tracks) {
          await localParticipant.publishTrack(track);
        }
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error("Failed to toggle screen sharing:", err);
      toast({
        title: "Erreur",
        description: "Impossible de partager l'écran",
        variant: "destructive",
      });
    }
  }, [room, localParticipant, isScreenSharing, toast]);

  return {
    // State
    room,
    isConnecting,
    isConnected,
    isDisconnected,
    error,
    localParticipant,
    remoteParticipants,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    
    // Controls
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    toggleScreenSharing,
  };
}

export default useLiveKitRoom;
