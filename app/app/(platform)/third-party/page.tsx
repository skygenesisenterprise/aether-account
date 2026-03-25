"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  Search,
  Plus,
  Shield,
  Globe,
  Smartphone,
  Eye,
  Laptop,
  Gamepad2,
} from "lucide-react";
import { Footer } from "../_components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ThirdPartyApp {
  id: string;
  name: string;
  initial: string;
  color: string;
  access: string;
  connectedAt: string;
  lastUsed: string;
}

interface Device {
  id: string;
  icon: React.ElementType;
  name: string;
  count: number;
  description: string;
}

const AVAILABLE_APPS = [
  {
    name: "Spotify",
    initial: "S",
    color: "bg-emerald-500",
    access: "Accès à votre profil et lectures",
  },
  { name: "GitHub", initial: "G", color: "bg-gray-700", access: "Accès aux dépôts et code" },
  { name: "Slack", initial: "S", color: "bg-purple-500", access: "Accès aux messages et canaux" },
  { name: "Notion", initial: "N", color: "bg-gray-500", access: "Accès aux documents" },
  { name: "Figma", initial: "F", color: "bg-pink-500", access: "Accès aux fichiers et projets" },
  { name: "Zoom", initial: "Z", color: "bg-blue-500", access: "Accès aux réunions" },
  {
    name: "Microsoft 365",
    initial: "M",
    color: "bg-red-500",
    access: "Accès aux documents et services",
  },
  {
    name: "Google Workspace",
    initial: "G",
    color: "bg-blue-600",
    access: "Accès aux services Google",
  },
];

const MOCK_APPS: ThirdPartyApp[] = [
  {
    id: "1",
    name: "Duolingo",
    initial: "D",
    color: "bg-green-500",
    access: "Accès à certaines informations",
    connectedAt: "15 jan. 2024",
    lastUsed: "Il y a 2 jours",
  },
  {
    id: "2",
    name: "EroPlayAI",
    initial: "E",
    color: "bg-blue-500",
    access: "Accès total au compte",
    connectedAt: "10 fév. 2024",
    lastUsed: "Il y a 1 semaine",
  },
];

const devices: Device[] = [
  {
    id: "desktop",
    icon: Laptop,
    name: "2 sessions sur ordinateur(s)",
    count: 2,
    description: "Linux, Linux",
  },
  {
    id: "iphone",
    icon: Smartphone,
    name: "2 sessions sur iPhone",
    count: 2,
    description: "iPhone, iPhone",
  },
  {
    id: "unknown",
    icon: Gamepad2,
    name: "6 sessions sur appareil(s) inconnu(s)",
    count: 6,
    description: "PlayStation 5, Appareil inconnu, ...",
  },
];

export default function ThirdPartyPage() {
  const [apps, setApps] = React.useState<ThirdPartyApp[]>(MOCK_APPS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showConnectModal, setShowConnectModal] = React.useState(false);
  const [showRevokeModal, setShowRevokeModal] = React.useState(false);
  const [revokingAppId, setRevokingAppId] = React.useState<string>("");
  const [showDeviceModal, setShowDeviceModal] = React.useState(false);
  const [editingDeviceId, setEditingDeviceId] = React.useState<string>("");
  const [showLostDeviceModal, setShowLostDeviceModal] = React.useState(false);

  const [tempPassword, setTempPassword] = React.useState("");

  const filteredApps = React.useMemo(() => {
    return apps.filter(
      (app) => searchQuery === "" || app.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apps, searchQuery]);

  const handleRevokeAccess = (id: string) => {
    setApps(apps.filter((app) => app.id !== id));
    setShowRevokeModal(false);
  };

  const openRevokeModal = (id: string) => {
    setRevokingAppId(id);
    setShowRevokeModal(true);
  };

  const handleConnectApp = (app: (typeof AVAILABLE_APPS)[0]) => {
    const newApp: ThirdPartyApp = {
      id: crypto.randomUUID(),
      name: app.name,
      initial: app.initial,
      color: app.color,
      access: app.access,
      connectedAt: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      lastUsed: "À l'instant",
    };
    setApps([...apps, newApp]);
    setShowConnectModal(false);
  };

  const openEditDevice = (deviceId: string) => {
    setEditingDeviceId(deviceId);
    setShowDeviceModal(true);
  };

  const handleSignOutDevice = () => {
    setShowDeviceModal(false);
  };

  const handleLostDevice = () => {
    setShowLostDeviceModal(false);
  };

  const connectedAppNames = apps.map((app) => app.name);

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-4 py-3 w-full">
          <div className="flex w-full max-w-3xl flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
                >
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </motion.div>
                <h1 className="text-xl font-semibold text-foreground">Applications tierces</h1>
              </div>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowConnectModal(true)}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Connecter
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher une application..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-input py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  {filteredApps.length} application{filteredApps.length !== 1 ? "s" : ""} connectée
                  {filteredApps.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Sécurisé</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Applications connectées</h2>
                <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                  Voir tout
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {filteredApps.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/30"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${app.color}`}
                    >
                      <span className="text-sm font-semibold text-white">{app.initial}</span>
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">{app.name}</span>
                      <span className="text-xs text-muted-foreground">{app.access}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Connecté le {app.connectedAt} • Utilisé {app.lastUsed}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openRevokeModal(app.id)}
                        className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Appareils autorisés</h2>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {devices.map((device, index) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                      <device.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">{device.name}</span>
                      <span className="text-xs text-muted-foreground">{device.description}</span>
                    </div>
                    <button
                      className="text-xs font-medium text-[#1a73e8] hover:underline"
                      onClick={() => openEditDevice(device.id)}
                    >
                      Gérer
                    </button>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Rechercher un appareil perdu
                    </span>
                  </div>
                  <button
                    className="text-xs font-medium text-[#1a73e8] hover:underline"
                    onClick={() => setShowLostDeviceModal(true)}
                  >
                    Rechercher
                  </button>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">
                  À propos des applications tierces
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Les applications tierces sont des services externes qui demandent l&apos;accès à
                votre compte Aether Office. Vous pouvez révoquer cet accès à tout moment.
              </p>
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span>Nous ne partageons pas votre mot de passe</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span>Vous pouvez révoquer l&apos;accès à tout moment</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span>Les données sont chiffrées de bout en bout</span>
                </div>
              </div>
            </motion.div>

            {filteredApps.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary"
                >
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </motion.div>
                <p className="text-sm font-medium text-foreground">Aucune application trouvée</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {searchQuery
                    ? "Essayez de modifier vos critères de recherche"
                    : "Connectez votre première application tierce"}
                </p>
              </motion.div>
            )}
          </div>

          <Footer />
        </div>
      </div>

      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connecter une application</DialogTitle>
            <DialogDescription>
              Sélectionnez une application à connecter à votre compte Aether Office.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            {AVAILABLE_APPS.map((app) => {
              const isConnected = connectedAppNames.includes(app.name);
              return (
                <button
                  key={app.name}
                  disabled={isConnected}
                  onClick={() => !isConnected && handleConnectApp(app)}
                  className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors ${
                    isConnected ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${app.color}`}
                  >
                    <span className="text-sm font-semibold text-white">{app.initial}</span>
                  </div>
                  <div className="flex flex-1 flex-col items-start">
                    <span className="text-sm font-medium text-foreground">{app.name}</span>
                    <span className="text-xs text-muted-foreground">{app.access}</span>
                  </div>
                  {isConnected ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer l&apos;accès</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir révoquer l&apos;accès de cette application à votre compte ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeModal(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => handleRevokeAccess(revokingAppId)}>
              Révoquer l&apos;accès
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeviceModal} onOpenChange={setShowDeviceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer l&apos;appareil</DialogTitle>
            <DialogDescription>
              Vous pouvez déconnecter cet appareil de votre compte à distance.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Appareil</span>
              <span className="text-sm text-muted-foreground">
                {devices.find((d) => d.id === editingDeviceId)?.description ||
                  "Appareil sélectionné"}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Dernière activité</span>
              <span className="text-sm text-muted-foreground">Il y a 2 heures</span>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button className="w-full" onClick={handleSignOutDevice}>
              Déconnecter cet appareil
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowDeviceModal(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLostDeviceModal} onOpenChange={setShowLostDeviceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechercher un appareil perdu</DialogTitle>
            <DialogDescription>
              Entrez le mot de passe de votre compte pour-localiser vos appareils.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              type="password"
              placeholder="Mot de passe"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLostDeviceModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleLostDevice}>Rechercher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
