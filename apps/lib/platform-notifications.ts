export interface PlatformNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  category: "message" | "meeting" | "team" | "file" | "system";
  read: boolean;
  initials?: string;
}

export const notifications: PlatformNotification[] = [
  {
    id: "message-product",
    title: "Elena Martin vous a mentionné",
    description: "La nouvelle direction du client est prête pour la revue.",
    time: "Il y a 4 min",
    category: "message",
    read: false,
    initials: "EM",
  },
  {
    id: "meeting-reminder",
    title: "Réunion dans 15 minutes",
    description: "Revue du nouveau client · Salle Aether",
    time: "Il y a 8 min",
    category: "meeting",
    read: false,
  },
  {
    id: "team-invite",
    title: "Invitation dans l’équipe Infrastructure",
    description: "Marcus Chen vous a ajouté au canal Architecture.",
    time: "Il y a 26 min",
    category: "team",
    read: false,
    initials: "MC",
  },
  {
    id: "file-shared",
    title: "Un document a été partagé",
    description: "Sarah Kim a partagé « Roadmap plateforme 2026 ».",
    time: "Il y a 1 h",
    category: "file",
    read: false,
    initials: "SK",
  },
  {
    id: "missed-call",
    title: "Appel manqué de Sarah Kim",
    description: "Appel audio · Aujourd’hui à 09:10",
    time: "Il y a 2 h",
    category: "meeting",
    read: false,
    initials: "SK",
  },
  {
    id: "recording-ready",
    title: "Enregistrement disponible",
    description: "L’enregistrement du point produit quotidien est prêt.",
    time: "Hier",
    category: "system",
    read: true,
  },
  {
    id: "security-update",
    title: "Paramètres de sécurité mis à jour",
    description: "La politique d’accès aux réunions externes a été modifiée.",
    time: "Lundi",
    category: "system",
    read: true,
  },
];
