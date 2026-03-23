"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Key,
  Shield,
  User,
  Mail,
  Smartphone,
  Activity,
  ChevronRight,
  Settings,
  Bell,
  CreditCard,
  Globe,
  Lock,
  Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Footer } from "../_components/Footer";

const quickActions = [
  {
    icon: Key,
    label: "Password Vault",
    description: "Gérer vos mots de passe",
    href: "/password",
    color: "text-blue-500",
  },
  {
    icon: Shield,
    label: "Sécurité",
    description: "Dernier contrôle il y a 3 jours",
    href: "/security",
    color: "text-green-500",
  },
  {
    icon: Smartphone,
    label: "Appareils",
    description: "4 appareils connectés",
    href: "/security",
    color: "text-purple-500",
  },
  {
    icon: Mail,
    label: "AetherMail",
    description: "liam.dispa@aethermail.me",
    href: "/personal",
    color: "text-orange-500",
  },
];

const recentActivity = [
  {
    icon: Shield,
    title: "Connexion réussie",
    description: "Linux - Google Chrome",
    time: "Il y a 2 heures",
    type: "success",
  },
  {
    icon: Key,
    title: "Mot de passe mis à jour",
    description: "GitHub",
    time: "Il y a 3 jours",
    type: "info",
  },
  {
    icon: Smartphone,
    title: "Nouvel appareil détecté",
    description: "iPhone 15 Pro",
    time: "Il y a 1 semaine",
    type: "warning",
  },
];

const securityTips = [
  {
    icon: Lock,
    text: "Activez la validation en deux étapes",
    action: "Configurer",
    priority: "high",
  },
  {
    icon: Eye,
    text: "Effectuez un contrôle de sécurité",
    action: "Démarrer",
    priority: "medium",
  },
  {
    icon: Key,
    text: "Vérifiez vos mots de passe compromis",
    action: "Analyser",
    priority: "low",
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col h-full bg-background">
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-4 py-3 w-full">
          <div className="flex w-full max-w-3xl flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="relative"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/60 text-xl font-bold text-primary-foreground shadow-lg">
                    {user?.name?.charAt(0).toUpperCase() || "L"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                    <Bell className="h-3 w-3" />
                  </div>
                </motion.div>
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-xl font-semibold text-foreground">
                    {user?.name || "Liam Von Astoria"}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || "starslabstechnology@gmail.com"}
                  </p>
                </div>
              </div>

              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid grid-cols-4 gap-2"
            >
              {quickActions.map((action, index) => (
                <motion.a
                  key={action.label}
                  href={action.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05, duration: 0.3 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-2 text-center transition-shadow hover:shadow-md"
                >
                  <div className={`rounded-full bg-secondary p-2 ${action.color}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground">{action.description}</span>
                  </div>
                </motion.a>
              ))}
            </motion.div>

            <div className="grid gap-3 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Activité récente</h2>
                  </div>
                  <button className="text-[10px] font-medium text-[#1a73e8] hover:underline">
                    Voir tout
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`rounded-full p-1.5 ${
                          activity.type === "success"
                            ? "bg-green-500/10 text-green-500"
                            : activity.type === "warning"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        <activity.icon className="h-3 w-3" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {activity.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {activity.description}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Sécurité</h2>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {securityTips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`rounded-full p-1.5 ${
                          tip.priority === "high"
                            ? "bg-red-500/10 text-red-500"
                            : tip.priority === "medium"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        <tip.icon className="h-3 w-3" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-xs text-foreground">{tip.text}</span>
                      </div>
                      <button className="text-[10px] font-medium text-[#1a73e8] hover:underline">
                        {tip.action}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Votre profil</h2>
                </div>
                <a
                  href="/personal"
                  className="flex items-center gap-1 text-xs font-medium text-[#1a73e8] hover:underline"
                >
                  Modifier <ChevronRight className="h-3 w-3" />
                </a>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Nom</span>
                  <span className="text-sm font-medium text-foreground">Liam Von Astoria</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">E-mail principal</span>
                  <span className="text-sm font-medium text-foreground truncate">
                    starslabstechnology@gmail.com
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Téléphone</span>
                  <span className="text-sm font-medium text-foreground">0470 03 97 11</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Genre</span>
                  <span className="text-sm font-medium text-foreground">Homme</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Date de naissance</span>
                  <span className="text-sm font-medium text-foreground">6 juin 2005</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Langue</span>
                  <span className="text-sm font-medium text-foreground">Français (France)</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Raccourcis rapides</h2>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/50">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Wallet</span>
                    <span className="text-xs text-muted-foreground">Gérer vos abonnements</span>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/50">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Confidentialité</span>
                    <span className="text-xs text-muted-foreground">Contrôler vos données</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}
