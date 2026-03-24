"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Key,
  Smartphone,
  CheckCircle,
  Laptop,
  Gamepad2,
  Eye,
  SmartphoneIcon,
  Mail,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Footer } from "../_components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SecuritySetting {
  id: string;
  label: string;
  value: string;
  description?: string;
  isActive?: boolean;
  isEmpty?: boolean;
}

interface Device {
  id: string;
  icon: React.ElementType;
  name: string;
  count: number;
  description: string;
}

interface ThirdPartyApp {
  id: string;
  name: string;
  initial: string;
  color: string;
  access: string;
}

const initial2FA: SecuritySetting = {
  id: "2fa",
  label: "Validation en deux étapes",
  value: "Activation : 9 nov. 2022",
  isActive: true,
};

const initialPasswordKeys: SecuritySetting = {
  id: "password-keys",
  label: "Clés d'accès et clés de sécurité",
  value: "2 clés d'accès",
};

const initialPassword: SecuritySetting = {
  id: "password",
  label: "Mot de passe",
  value: "Dernière modification : 30 juil. 2022",
};

const initialPasskey: SecuritySetting = {
  id: "passkey",
  label: "Ignorer le mot de passe si possible",
  value: "Activé",
  isActive: true,
};

const initialAuthenticator: SecuritySetting = {
  id: "authenticator",
  label: "Vault Authenticator",
  value: "Ajout : 9 nov. 2022",
};

const initialOfficeInvite: SecuritySetting = {
  id: "office-invite",
  label: "Invite Office",
  value: "1 appareil",
};

const initialRecoveryPhone: SecuritySetting = {
  id: "recovery-phone",
  label: "Téléphone pour la validation en deux étapes",
  value: "0470 03 97 11",
};

const initialBackupPhone: SecuritySetting = {
  id: "backup-phone",
  label: "Numéro de téléphone de récupération",
  value: "Ajoutez un numéro de téléphone mobile",
  isEmpty: true,
};

const initialRecoveryEmail: SecuritySetting = {
  id: "recovery-email",
  label: "Adresse e-mail de récupération",
  value: "liam.dispa@aethermail.me",
};

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
    icon: SmartphoneIcon,
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

const thirdPartyApps: ThirdPartyApp[] = [
  {
    id: "duolingo",
    name: "Duolingo",
    initial: "D",
    color: "bg-green-500",
    access: "Accès à certaines informations",
  },
  {
    id: "eroplayai",
    name: "EroPlayAI",
    initial: "E",
    color: "bg-blue-500",
    access: "Accès total au compte",
  },
];

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(true);
  const [passkeyEnabled, setPasskeyEnabled] = React.useState(true);
  const [secureNavigation, setSecureNavigation] = React.useState(false);

  const [edit2FAOpen, setEdit2FAOpen] = React.useState(false);
  const [editPasswordKeysOpen, setEditPasswordKeysOpen] = React.useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = React.useState(false);
  const [editAuthenticatorOpen, setEditAuthenticatorOpen] = React.useState(false);
  const [editRecoveryPhoneOpen, setEditRecoveryPhoneOpen] = React.useState(false);
  const [editBackupPhoneOpen, setEditBackupPhoneOpen] = React.useState(false);
  const [editRecoveryEmailOpen, setEditRecoveryEmailOpen] = React.useState(false);
  const [editDeviceOpen, setEditDeviceOpen] = React.useState(false);
  const [editingDeviceId, setEditingDeviceId] = React.useState("");
  const [editThirdPartyOpen, setEditThirdPartyOpen] = React.useState(false);
  const [editingAppId, setEditingAppId] = React.useState("");

  const [tempPassword, setTempPassword] = React.useState("");
  const [tempPhone, setTempPhone] = React.useState("");
  const [tempEmail, setTempEmail] = React.useState("");

  const saveEditPassword = () => {
    setEditPasswordOpen(false);
  };

  const saveEditRecoveryPhone = () => {
    setEditRecoveryPhoneOpen(false);
  };

  const saveEditBackupPhone = () => {
    setEditBackupPhoneOpen(false);
  };

  const saveEditRecoveryEmail = () => {
    setEditRecoveryEmailOpen(false);
  };

  const openEditDevice = (deviceId: string) => {
    setEditingDeviceId(deviceId);
    setEditDeviceOpen(true);
  };

  const openEditThirdParty = (appId: string) => {
    setEditingAppId(appId);
    setEditThirdPartyOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-4 py-3 w-full">
          <div className="flex w-full max-w-3xl flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">Check-up Sécurité</h2>
              </div>
              <div className="flex flex-col gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10">
                    <Shield className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Conseils de sécurité du Check-up Sécurité
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Complétez le Check-up Sécurité pour renforcer la protection de votre compte.
                    </span>
                  </div>
                  <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                    Configurer
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Activité récente liée à la sécurité
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Pas d'alertes liées à la sécurité au cours des 28 derniers jours
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">
                    Comment vous connecter à Aether Office
                  </h2>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Validation en deux étapes
                    </span>
                    <span className="text-xs text-green-500">Activé</span>
                  </div>
                  <Dialog open={edit2FAOpen} onOpenChange={setEdit2FAOpen}>
                    <DialogTrigger asChild>
                      <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                        {twoFactorEnabled ? "Désactiver" : "Activer"}
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Validation en deux étapes</DialogTitle>
                        <DialogDescription>
                          {twoFactorEnabled
                            ? "Êtes-vous sûr de vouloir désactiver la validation en deux étapes ?"
                            : "Activez la validation en deux étapes pour sécuriser votre compte."}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEdit2FAOpen(false)}>
                          Annuler
                        </Button>
                        <Button
                          onClick={() => {
                            setTwoFactorEnabled(!twoFactorEnabled);
                            setEdit2FAOpen(false);
                          }}
                        >
                          {twoFactorEnabled ? "Désactiver" : "Activer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Clés d'accès et clés de sécurité
                    </span>
                    <span className="text-xs text-muted-foreground">2 clés d'accès</span>
                  </div>
                  <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                    Gérer
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">Mot de passe</span>
                    <span className="text-xs text-muted-foreground">
                      Dernière modification : 30 juil. 2022
                    </span>
                  </div>
                  <Dialog open={editPasswordOpen} onOpenChange={setEditPasswordOpen}>
                    <DialogTrigger asChild>
                      <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier le mot de passe</DialogTitle>
                        <DialogDescription>Entrez votre nouveau mot de passe.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          type="password"
                          placeholder="Nouveau mot de passe"
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPasswordOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditPassword}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Ignorer le mot de passe si possible
                    </span>
                    <span className="text-xs text-green-500">Activé</span>
                  </div>
                  <button
                    className="text-xs font-medium text-[#1a73e8] hover:underline"
                    onClick={() => setPasskeyEnabled(!passkeyEnabled)}
                  >
                    {passkeyEnabled ? "Désactiver" : "Activer"}
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">Vault Authenticator</span>
                    <span className="text-xs text-muted-foreground">Ajout : 9 nov. 2022</span>
                  </div>
                  <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                    Gérer
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">Invite Office</span>
                    <span className="text-xs text-muted-foreground">1 appareil</span>
                  </div>
                  <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                    Gérer
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Téléphone pour la validation en deux étapes
                    </span>
                    <span className="text-xs text-foreground">0470 03 97 11</span>
                  </div>
                  <Dialog open={editRecoveryPhoneOpen} onOpenChange={setEditRecoveryPhoneOpen}>
                    <DialogTrigger asChild>
                      <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier le téléphone</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          placeholder="Numéro de téléphone"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditRecoveryPhoneOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditRecoveryPhone}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Numéro de téléphone de récupération
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Ajoutez un numéro de téléphone mobile
                    </span>
                  </div>
                  <Dialog open={editBackupPhoneOpen} onOpenChange={setEditBackupPhoneOpen}>
                    <DialogTrigger asChild>
                      <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                        Ajouter
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter un numéro de récupération</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          placeholder="Numéro de téléphone"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditBackupPhoneOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditBackupPhone}>Ajouter</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Adresse e-mail de récupération
                    </span>
                    <span className="text-xs text-foreground">liam.dispa@aethermail.me</span>
                  </div>
                  <Dialog open={editRecoveryEmailOpen} onOpenChange={setEditRecoveryEmailOpen}>
                    <DialogTrigger asChild>
                      <button className="text-xs font-medium text-[#1a73e8] hover:underline">
                        Modifier
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier l'e-mail de récupération</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        <Input
                          placeholder="Adresse e-mail"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditRecoveryEmailOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={saveEditRecoveryEmail}>Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Vos appareils</h2>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {devices.map((device, index) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
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
                  transition={{ delay: 0.4 }}
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
                  <button className="text-xs font-medium text-[#1a73e8] hover:underline">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">
                    Connexions à des applis et services tiers
                  </h2>
                </div>
                <a
                  href="#"
                  className="flex items-center gap-1 text-xs font-medium text-[#1a73e8] hover:underline"
                >
                  Voir tout <ChevronRight className="h-3 w-3" />
                </a>
              </div>
              <div className="flex flex-col gap-3">
                {thirdPartyApps.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${app.color}`}
                    >
                      <span className="text-sm font-semibold text-white">{app.initial}</span>
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">{app.name}</span>
                      <span className="text-xs text-muted-foreground">{app.access}</span>
                    </div>
                    <button
                      className="text-xs font-medium text-[#1a73e8] hover:underline"
                      onClick={() => openEditThirdParty(app.id)}
                    >
                      Gérer
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    Navigation sécurisée avec protection renforcée
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Des protections plus personnalisées contre les extensions, sites et
                    téléchargements dangereux.
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {secureNavigation ? "Activé" : "Désactivé"}
                </span>
                <button
                  className="text-xs font-medium text-[#1a73e8] hover:underline"
                  onClick={() => setSecureNavigation(!secureNavigation)}
                >
                  {secureNavigation ? "Désactiver" : "Activer"}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <Key className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    Gestionnaire de mots de passe
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Vous avez 59 mots de passe enregistrés. Le gestionnaire facilite la connexion.
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end pt-2">
                <a href="/password" className="text-xs font-medium text-[#1a73e8] hover:underline">
                  Examiner
                </a>
              </div>
            </motion.div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}
