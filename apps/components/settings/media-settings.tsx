"use client";

import * as React from "react";
import { Camera, Mic, MonitorUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
import { SettingRow } from "@/components/settings/setting-row";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface MediaDeviceState {
  cameraId: string;
  microphoneId: string;
  speakerId: string;
}

const STORAGE_KEY = "aether.settings.media";

export function MediaSettings() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const animationRef = React.useRef<number | null>(null);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selection, setSelection] = React.useState<MediaDeviceState>({ cameraId: "", microphoneId: "", speakerId: "" });
  const [permissionError, setPermissionError] = React.useState<string | null>(null);
  const [micLevel, setMicLevel] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setSelection(JSON.parse(raw) as MediaDeviceState);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function persist(next: MediaDeviceState) {
    setSelection(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function loadDevices(requestPermissions = false) {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setPermissionError("Les APIs média du navigateur ne sont pas disponibles.");
      return;
    }
    try {
      if (requestPermissions) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      const next = await navigator.mediaDevices.enumerateDevices();
      setDevices(next);
      setPermissionError(null);
    } catch {
      setPermissionError("Permissions caméra ou micro refusées.");
    }
  }

  async function startCameraPreview() {
    if (typeof navigator === "undefined") {
      return;
    }
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selection.cameraId ? { deviceId: { exact: selection.cameraId } } : true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermissionError(null);
    } catch {
      setPermissionError("Impossible d’ouvrir l’aperçu caméra.");
    }
  }

  async function testMicrophone() {
    if (typeof navigator === "undefined") {
      return;
    }
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selection.microphoneId ? { deviceId: { exact: selection.microphoneId } } : true,
      });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / Math.max(data.length, 1);
        setMicLevel(Math.min(100, Math.round((average / 255) * 100)));
        animationRef.current = requestAnimationFrame(tick);
      };
      tick();
      window.setTimeout(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        void audioContext.close();
        stream.getTracks().forEach((track) => track.stop());
      }, 3000);
    } catch {
      toast.error("Test micro impossible.");
    }
  }

  const cameras = devices.filter((device) => device.kind === "videoinput");
  const microphones = devices.filter((device) => device.kind === "audioinput");
  const speakers = devices.filter((device) => device.kind === "audiooutput");

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        eyebrow="Personnel"
        title="Audio et vidéo"
        description="Les sélections de périphériques sont stockées localement dans ce navigateur. Les permissions ne sont demandées qu’après action explicite."
        actions={
          <Button type="button" size="sm" variant="outline" onClick={() => void loadDevices(true)}>
            <RefreshCw className="size-4" />
            Détecter les périphériques
          </Button>
        }
      />
      {permissionError ? <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">{permissionError}</div> : null}
      <div className="divide-y divide-white/10 rounded-md border border-white/10 bg-black/10 px-4">
        <SettingRow title="Caméra" description="Périphérique vidéo par défaut pour les appels.">
          <Select value={selection.cameraId || "__default"} onValueChange={(value) => persist({ ...selection, cameraId: value === "__default" ? "" : value })}>
            <SelectTrigger className="w-60 border-white/10 bg-[#232426]">
              <Camera className="size-4" />
              <SelectValue placeholder="Caméra par défaut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default">Caméra par défaut</SelectItem>
              {cameras.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>{device.label || "Caméra non nommée"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Microphone" description="Source audio utilisée dans les réunions.">
          <Select value={selection.microphoneId || "__default"} onValueChange={(value) => persist({ ...selection, microphoneId: value === "__default" ? "" : value })}>
            <SelectTrigger className="w-60 border-white/10 bg-[#232426]">
              <Mic className="size-4" />
              <SelectValue placeholder="Microphone par défaut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default">Micro par défaut</SelectItem>
              {microphones.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>{device.label || "Micro non nommé"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Sortie audio" description="Visible uniquement si le navigateur expose les sorties audio.">
          <Select value={selection.speakerId || "__default"} onValueChange={(value) => persist({ ...selection, speakerId: value === "__default" ? "" : value })}>
            <SelectTrigger className="w-60 border-white/10 bg-[#232426]">
              <MonitorUp className="size-4" />
              <SelectValue placeholder="Sortie par défaut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default">Sortie par défaut</SelectItem>
              {speakers.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>{device.label || "Sortie non nommée"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-black/10 p-4">
          <p className="mb-3 text-sm font-medium text-white">Aperçu caméra</p>
          <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-md bg-[#232426] object-cover" />
          <Button type="button" variant="outline" className="mt-3" onClick={() => void startCameraPreview()}>
            Démarrer l’aperçu
          </Button>
        </div>
        <div className="rounded-md border border-white/10 bg-black/10 p-4">
          <p className="mb-3 text-sm font-medium text-white">Test microphone</p>
          <Progress value={micLevel} className="bg-white/10" />
          <p className="mt-2 text-xs text-zinc-500">Niveau instantané détecté pendant 3 secondes.</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => void testMicrophone()}>
            Lancer le test
          </Button>
        </div>
      </div>
    </div>
  );
}
