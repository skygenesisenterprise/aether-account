import {
  Bell,
  BookOpenText,
  CalendarDays,
  ContactRound,
  FileText,
  FolderKanban,
  Cloud,
  House,
  ListTodo,
  MessageCircleMore,
  Phone,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";

export interface PlatformNavItem {
  label: string;
  href: string;
  icon: typeof Sparkles;
  badge?: number;
}

export interface Person {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: "online" | "busy" | "away" | "offline";
}

export interface ChatMessage {
  id: string;
  authorId: string;
  author: string;
  initials: string;
  time: string;
  content: string;
  createdAt?: string;
  editedAt?: string;
}

export interface Conversation {
  participants?: any;
  id: string;
  name: string;
  initials: string;
  type: "channel" | "dm";
  memberIds: string[];
  subtitle: string;
  preview: string;
  time: string;
  lastActivityAt?: string;
  unread?: number;
  active?: boolean;
  status: Person["status"];
}

export interface Meeting {
  id: string;
  title: string;
  start: string;
  end: string;
  day: string;
  participants: string[];
  status: "live" | "upcoming" | "done";
  location?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: number;
  channels: string[];
  color: string;
}

export interface SharedFile {
  id: string;
  name: string;
  kind: "document" | "presentation" | "spreadsheet" | "archive";
  owner: string;
  location: string;
  updatedAt: string;
  size: string;
}

export const platformNavItems: PlatformNavItem[] = [
  { label: "Activité", href: "/notifications", icon: Bell, badge: 5 },
  { label: "Conversations", href: "/chat", icon: MessageCircleMore, badge: 4 },
  { label: "Tâches", href: "/tasks", icon: ListTodo },
  { label: "Projets", href: "/projects", icon: FolderKanban },
  { label: "Équipes", href: "/teams", icon: UsersRound },
  { label: "Calendrier", href: "/calendar", icon: CalendarDays },
  { label: "Appels", href: "/calls", icon: Phone, badge: 2 },
  { label: "Drive", href: "/drive", icon: Cloud },
  { label: "Contacts", href: "/contacts", icon: ContactRound },
  { label: "Réglages", href: "/settings", icon: Settings2 },
];

export const people: Person[] = [
  {
    id: "liam",
    name: "Liam Ward",
    initials: "LW",
    role: "Product lead",
    status: "online",
  },
  {
    id: "elena",
    name: "Elena Martin",
    initials: "EM",
    role: "Product designer",
    status: "online",
  },
  {
    id: "marcus",
    name: "Marcus Chen",
    initials: "MC",
    role: "Lead engineer",
    status: "busy",
  },
  {
    id: "sarah",
    name: "Sarah Kim",
    initials: "SK",
    role: "Operations",
    status: "away",
  },
  {
    id: "noah",
    name: "Noah Williams",
    initials: "NW",
    role: "Security",
    status: "offline",
  },
  {
    id: "maya",
    name: "Maya Lopez",
    initials: "ML",
    role: "Customer success lead",
    status: "online",
  },
  {
    id: "claire",
    name: "Claire Dubois",
    initials: "CD",
    role: "Program manager",
    status: "busy",
  },
  {
    id: "adrien",
    name: "Adrien Moreau",
    initials: "AM",
    role: "Frontend engineer",
    status: "online",
  },
  {
    id: "ines",
    name: "Ines Rahal",
    initials: "IR",
    role: "UX researcher",
    status: "away",
  },
  {
    id: "jonas",
    name: "Jonas Becker",
    initials: "JB",
    role: "Platform engineer",
    status: "busy",
  },
  {
    id: "nina",
    name: "Nina Rossi",
    initials: "NR",
    role: "Legal ops",
    status: "offline",
  },
  {
    id: "pierre",
    name: "Pierre Garnier",
    initials: "PG",
    role: "Data analyst",
    status: "online",
  },
  {
    id: "zoe",
    name: "Zoé Laurent",
    initials: "ZL",
    role: "Marketing lead",
    status: "away",
  },
  {
    id: "omar",
    name: "Omar Haddad",
    initials: "OH",
    role: "Solution architect",
    status: "busy",
  },
  {
    id: "lucas",
    name: "Lucas Meyer",
    initials: "LM",
    role: "Support manager",
    status: "online",
  },
  {
    id: "camille",
    name: "Camille Petit",
    initials: "CP",
    role: "Finance ops",
    status: "offline",
  },
];

export const conversations: Conversation[] = [
  {
    id: "product",
    name: "Équipe produit",
    initials: "EP",
    type: "channel",
    memberIds: ["liam", "elena", "marcus", "sarah"],
    subtitle: "8 membres · 4 en ligne",
    preview: "Elena : La nouvelle maquette est prête.",
    time: "09:42",
    unread: 3,
    active: true,
    status: "online",
  },
  {
    id: "marcus",
    name: "Marcus Chen",
    initials: "MC",
    type: "dm",
    memberIds: ["liam", "marcus"],
    subtitle: "En ligne",
    preview: "Je pousse la correction après la revue.",
    time: "08:15",
    unread: 1,
    status: "busy",
  },
  {
    id: "launch",
    name: "Lancement Aether",
    initials: "LA",
    type: "channel",
    memberIds: ["liam", "elena", "sarah"],
    subtitle: "12 membres · 2 en ligne",
    preview: "Sarah : Réunion déplacée à 15 h.",
    time: "Hier",
    status: "online",
  },
  {
    id: "security",
    name: "Sécurité & conformité",
    initials: "SC",
    type: "channel",
    memberIds: ["liam", "marcus", "noah"],
    subtitle: "6 membres · 1 en ligne",
    preview: "Noah a partagé un document.",
    time: "Lun.",
    status: "away",
  },
  {
    id: "design-system",
    name: "Design system",
    initials: "DS",
    type: "channel",
    memberIds: ["liam", "elena", "marcus"],
    subtitle: "9 membres · 3 en ligne",
    preview: "Elena : Je pousse la variante compacte du header.",
    time: "11:08",
    unread: 2,
    status: "online",
  },
  {
    id: "customer-success",
    name: "Customer success",
    initials: "CS",
    type: "channel",
    memberIds: ["liam", "sarah", "elena"],
    subtitle: "7 membres · 2 en ligne",
    preview: "Sarah : Le client attend le recap avant 17 h.",
    time: "10:24",
    unread: 4,
    status: "away",
  },
  {
    id: "war-room",
    name: "War room incident",
    initials: "WR",
    type: "channel",
    memberIds: ["liam", "marcus", "noah", "sarah"],
    subtitle: "5 membres · 2 en ligne",
    preview: "Marcus : La latence est revenue sous le seuil cible.",
    time: "09:58",
    unread: 1,
    status: "busy",
  },
  {
    id: "exec-sync",
    name: "Exec sync",
    initials: "ES",
    type: "channel",
    memberIds: ["liam", "elena", "sarah"],
    subtitle: "4 membres · 2 en ligne",
    preview: "Liam : J’envoie la synthèse finale après déjeuner.",
    time: "Hier",
    status: "online",
  },
  {
    id: "elena",
    name: "Elena Martin",
    initials: "EM",
    type: "dm",
    memberIds: ["liam", "elena"],
    subtitle: "En ligne",
    preview: "Tu peux regarder le spacing du panneau de droite ?",
    time: "11:16",
    unread: 2,
    status: "online",
  },
  {
    id: "sarah",
    name: "Sarah Kim",
    initials: "SK",
    type: "dm",
    memberIds: ["liam", "sarah"],
    subtitle: "Absente",
    preview: "Je t’envoie la note client dans 5 minutes.",
    time: "10:52",
    status: "away",
  },
  {
    id: "noah",
    name: "Noah Williams",
    initials: "NW",
    type: "dm",
    memberIds: ["liam", "noah"],
    subtitle: "Hors ligne",
    preview: "Il me faut ton arbitrage sur le mode invité.",
    time: "Mar.",
    unread: 1,
    status: "offline",
  },
  {
    id: "partners",
    name: "Partenaires externes",
    initials: "PE",
    type: "channel",
    memberIds: ["liam", "sarah", "omar", "maya"],
    subtitle: "11 membres · 3 en ligne",
    preview: "Omar : Les accès sandbox sont prêts pour la démo partenaire.",
    time: "09:21",
    unread: 2,
    status: "busy",
  },
  {
    id: "data-room",
    name: "Data room",
    initials: "DR",
    type: "channel",
    memberIds: ["liam", "pierre", "marcus", "noah"],
    subtitle: "6 membres · 3 en ligne",
    preview: "Pierre : Le tableau de suivi est à jour avec les cohortes EMEA.",
    time: "08:48",
    status: "online",
  },
  {
    id: "board-prep",
    name: "Board prep",
    initials: "BP",
    type: "channel",
    memberIds: ["liam", "claire", "zoe", "camille"],
    subtitle: "5 membres · 2 en ligne",
    preview: "Claire : Il nous manque encore deux chiffres pour la slide 6.",
    time: "Ven.",
    unread: 1,
    status: "busy",
  },
  {
    id: "maya",
    name: "Maya Lopez",
    initials: "ML",
    type: "dm",
    memberIds: ["liam", "maya"],
    subtitle: "En ligne",
    preview: "Le client veut aussi une vue compacte pour les CSM.",
    time: "11:11",
    unread: 3,
    status: "online",
  },
  {
    id: "claire",
    name: "Claire Dubois",
    initials: "CD",
    type: "dm",
    memberIds: ["liam", "claire"],
    subtitle: "Occupée",
    preview: "Je bloque 20 min pour la revue steering si tu confirmes.",
    time: "10:37",
    status: "busy",
  },
  {
    id: "adrien",
    name: "Adrien Moreau",
    initials: "AM",
    type: "dm",
    memberIds: ["liam", "adrien"],
    subtitle: "En ligne",
    preview: "Le panneau supporte bien les très longues listes maintenant.",
    time: "11:27",
    unread: 1,
    status: "online",
  },
  {
    id: "ines",
    name: "Ines Rahal",
    initials: "IR",
    type: "dm",
    memberIds: ["liam", "ines"],
    subtitle: "Absente",
    preview: "Je t’ai laissé les retours de tests utilisateurs dans le doc.",
    time: "Hier",
    status: "away",
  },
  {
    id: "jonas",
    name: "Jonas Becker",
    initials: "JB",
    type: "dm",
    memberIds: ["liam", "jonas"],
    subtitle: "Occupé",
    preview: "Je surveille encore le cluster vidéo pendant 30 minutes.",
    time: "09:33",
    unread: 2,
    status: "busy",
  },
  {
    id: "nina",
    name: "Nina Rossi",
    initials: "NR",
    type: "dm",
    memberIds: ["liam", "nina"],
    subtitle: "Hors ligne",
    preview: "J’ai besoin de la version finale des mentions légales.",
    time: "Lun.",
    status: "offline",
  },
  {
    id: "pierre",
    name: "Pierre Garnier",
    initials: "PG",
    type: "dm",
    memberIds: ["liam", "pierre"],
    subtitle: "En ligne",
    preview: "Je t’envoie les chiffres d’activation avant midi.",
    time: "10:03",
    status: "online",
  },
  {
    id: "zoe",
    name: "Zoé Laurent",
    initials: "ZL",
    type: "dm",
    memberIds: ["liam", "zoe"],
    subtitle: "Absente",
    preview: "On garde quelle capture pour la séquence marketing ?",
    time: "Mar.",
    unread: 1,
    status: "away",
  },
  {
    id: "omar",
    name: "Omar Haddad",
    initials: "OH",
    type: "dm",
    memberIds: ["liam", "omar"],
    subtitle: "Occupé",
    preview: "Les partenaires veulent un environnement de test dès demain.",
    time: "09:18",
    unread: 2,
    status: "busy",
  },
  {
    id: "lucas",
    name: "Lucas Meyer",
    initials: "LM",
    type: "dm",
    memberIds: ["liam", "lucas"],
    subtitle: "En ligne",
    preview: "Le support a documenté 4 tickets récurrents depuis ce matin.",
    time: "08:57",
    status: "online",
  },
  {
    id: "camille",
    name: "Camille Petit",
    initials: "CP",
    type: "dm",
    memberIds: ["liam", "camille"],
    subtitle: "Hors ligne",
    preview: "J’attends les coûts consolidés pour le board pack.",
    time: "Jeu.",
    status: "offline",
  },
];

export const meetings: Meeting[] = [
  {
    id: "daily",
    title: "Point produit quotidien",
    start: "10:00",
    end: "10:30",
    day: "Aujourd’hui",
    participants: ["EM", "MC", "SK", "NW"],
    status: "upcoming",
    location: "Canal Équipe produit",
  },
  {
    id: "design",
    title: "Revue du nouveau client",
    start: "15:00",
    end: "16:00",
    day: "Aujourd’hui",
    participants: ["EM", "MC", "LW"],
    status: "live",
    location: "Salle Aether",
  },
  {
    id: "security",
    title: "Comité sécurité",
    start: "09:30",
    end: "10:15",
    day: "Demain",
    participants: ["NW", "MC"],
    status: "upcoming",
    location: "Confidentiel",
  },
  {
    id: "roadmap",
    title: "Roadmap trimestrielle",
    start: "14:00",
    end: "15:30",
    day: "Vendredi",
    participants: ["EM", "MC", "SK", "NW", "LW"],
    status: "upcoming",
    location: "Tous les collaborateurs",
  },
];

export const teams: Team[] = [
  {
    id: "product",
    name: "Produit",
    description: "Design, recherche utilisateur et feuille de route Aether.",
    members: 12,
    channels: ["Général", "Design", "Recherche", "Annonces"],
    color: "from-violet-500 to-indigo-500",
  },
  {
    id: "engineering",
    name: "Ingénierie",
    description: "Architecture, développement client et infrastructure temps réel.",
    members: 18,
    channels: ["Général", "Web", "Backend", "Infrastructure"],
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "operations",
    name: "Opérations",
    description: "Déploiements, support, sécurité et gouvernance.",
    members: 9,
    channels: ["Général", "Incidents", "Sécurité"],
    color: "from-emerald-500 to-teal-600",
  },
];

export const sharedFiles: SharedFile[] = [
  {
    id: "spec",
    name: "Spécification client Aether Meet",
    kind: "document",
    owner: "Elena Martin",
    location: "Équipe produit",
    updatedAt: "Il y a 18 min",
    size: "2,4 Mo",
  },
  {
    id: "roadmap",
    name: "Roadmap plateforme 2026",
    kind: "presentation",
    owner: "Sarah Kim",
    location: "Lancement Aether",
    updatedAt: "Hier",
    size: "8,1 Mo",
  },
  {
    id: "capacity",
    name: "Capacité infrastructure",
    kind: "spreadsheet",
    owner: "Marcus Chen",
    location: "Ingénierie",
    updatedAt: "Mardi",
    size: "740 Ko",
  },
  {
    id: "assets",
    name: "Assets de marque",
    kind: "archive",
    owner: "Elena Martin",
    location: "Design",
    updatedAt: "12 juin",
    size: "34 Mo",
  },
];

export const conversationMessages: Record<string, ChatMessage[]> = {
  product: [
    {
      id: "m1",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "09:36",
      content:
        "J’ai terminé la nouvelle direction du client. Le shell est plus compact et le contexte reste visible pendant la navigation.",
    },
    {
      id: "m2",
      authorId: "marcus",
      author: "Marcus Chen",
      initials: "MC",
      time: "09:39",
      content:
        "La séparation rail, panneau contextuel et espace actif est compatible avec nos routes actuelles. Je prépare les contrats API.",
    },
    {
      id: "m3",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "09:42",
      content: "Parfait. Je prends la version de Elena pour la revue et je valide le flux mobile avant 15 h.",
    },
  ],
  marcus: [
    {
      id: "mc1",
      authorId: "marcus",
      author: "Marcus Chen",
      initials: "MC",
      time: "08:00",
      content: "Tu peux review la PR quand tu as un moment ?",
    },
    {
      id: "mc2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "08:15",
      content: "Oui, je passe dessus après le point produit. Je te laisse la correction si je vois autre chose.",
    },
  ],
  launch: [
    {
      id: "lc1",
      authorId: "sarah",
      author: "Sarah Kim",
      initials: "SK",
      time: "14:30",
      content: "La réunion de lancement est déplacée à 15 h.",
    },
    {
      id: "lc2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "14:45",
      content: "J’ai mis à jour le deck avec les nouvelles slides et la séquence d’ouverture.",
    },
    {
      id: "lc3",
      authorId: "sarah",
      author: "Sarah Kim",
      initials: "SK",
      time: "Hier",
      content: "Parfait, on se retrouve à 15 h.",
    },
  ],
  security: [
    {
      id: "sc1",
      authorId: "noah",
      author: "Noah Williams",
      initials: "NW",
      time: "Lun.",
      content: "J’ai partagé un document sur les nouvelles exigences de conformité.",
    },
    {
      id: "sc2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "Lun.",
      content: "Merci, je relis ça aujourd’hui et je reviens avec la liste des impacts côté produit.",
    },
    {
      id: "sc3",
      authorId: "noah",
      author: "Noah Williams",
      initials: "NW",
      time: "Lun.",
      content: "Il faudrait finaliser avant vendredi si possible.",
    },
  ],
  "design-system": [
    {
      id: "ds1",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "10:52",
      content: "J’ai réduit la hauteur du header pour mieux respirer sur laptop 13 pouces.",
    },
    {
      id: "ds2",
      authorId: "marcus",
      author: "Marcus Chen",
      initials: "MC",
      time: "11:01",
      content: "OK pour moi. On garde la même structure sur tasks et projects pour éviter les divergences.",
    },
    {
      id: "ds3",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "11:08",
      content: "Je pousse aussi la variante compacte du header avec le rail de contexte violet.",
    },
  ],
  "customer-success": [
    {
      id: "cs1",
      authorId: "sarah",
      author: "Sarah Kim",
      initials: "SK",
      time: "10:12",
      content: "Le client demande un recap unifié entre appels, docs et prochaines actions.",
    },
    {
      id: "cs2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "10:18",
      content: "On peut lui livrer un écran synthèse avec activité, tâches et projets dans le même langage visuel.",
    },
    {
      id: "cs3",
      authorId: "sarah",
      author: "Sarah Kim",
      initials: "SK",
      time: "10:24",
      content: "Parfait, j’aligne le recap client sur cette proposition avant 17 h.",
    },
  ],
  "war-room": [
    {
      id: "wr1",
      authorId: "marcus",
      author: "Marcus Chen",
      initials: "MC",
      time: "09:41",
      content: "On a un pic de latence sur la synchro vidéo côté EMEA.",
    },
    {
      id: "wr2",
      authorId: "noah",
      author: "Noah Williams",
      initials: "NW",
      time: "09:47",
      content: "Rien d’anormal côté sécurité, je vois surtout une saturation réseau sur deux nœuds.",
    },
    {
      id: "wr3",
      authorId: "marcus",
      author: "Marcus Chen",
      initials: "MC",
      time: "09:58",
      content: "La latence est revenue sous le seuil cible après redistribution du trafic.",
    },
  ],
  "exec-sync": [
    {
      id: "es1",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "Hier",
      content: "J’ai finalisé les captures executives avec le nouveau shell plateforme.",
    },
    {
      id: "es2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "Hier",
      content: "Je complète avec une note de lecture sur la hiérarchie Activité, Lecture et Chat.",
    },
  ],
  partners: [
    {
      id: "pe1",
      authorId: "omar",
      author: "Omar Haddad",
      initials: "OH",
      time: "09:10",
      content: "Les partenaires veulent un environnement de test plus stable avant la démonstration.",
    },
    {
      id: "pe2",
      authorId: "sarah",
      author: "Sarah Kim",
      initials: "SK",
      time: "09:21",
      content: "Les accès sandbox sont prêts pour la démo partenaire, je partage le guide dans 10 minutes.",
    },
  ],
  "data-room": [
    {
      id: "dr1",
      authorId: "pierre",
      author: "Pierre Garnier",
      initials: "PG",
      time: "08:36",
      content: "J’ai nettoyé les cohortes et corrigé l’agrégation du dashboard activation.",
    },
    {
      id: "dr2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "08:48",
      content: "Parfait, le tableau de suivi est à jour avec les cohortes EMEA. Je m’en sers pour le point exec.",
    },
  ],
  "board-prep": [
    {
      id: "bp1",
      authorId: "claire",
      author: "Claire Dubois",
      initials: "CD",
      time: "Ven.",
      content: "Il nous manque encore deux chiffres pour la slide 6 et le commentaire marge.",
    },
    {
      id: "bp2",
      authorId: "camille",
      author: "Camille Petit",
      initials: "CP",
      time: "Ven.",
      content: "Je récupère les coûts consolidés avant 16 h pour boucler le pack board.",
    },
  ],
  elena: [
    {
      id: "em1",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "11:09",
      content: "Tu peux regarder le spacing du panneau de droite avant que je livre les captures ?",
    },
    {
      id: "em2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "11:14",
      content: "Oui, je fais l’ajustement et je te dis si la lecture tient bien sur les grands écrans.",
    },
    {
      id: "em3",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "11:16",
      content: "Top, je garde Figma ouvert pour pousser la dernière itération.",
    },
  ],
  sarah: [
    {
      id: "sk1",
      authorId: "sarah",
      author: "Sarah Kim",
      initials: "SK",
      time: "10:44",
      content: "Je t’envoie la note client dans 5 minutes avec les dépendances les plus sensibles.",
    },
    {
      id: "sk2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "10:52",
      content: "Parfait, je l’intègre directement dans le support de revue.",
    },
  ],
  noah: [
    {
      id: "nw1",
      authorId: "noah",
      author: "Noah Williams",
      initials: "NW",
      time: "Mar.",
      content: "Il me faut ton arbitrage sur le mode invité avant d’ouvrir le flux aux partenaires.",
    },
    {
      id: "nw2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "Mar.",
      content: "Je te réponds aujourd’hui avec la version courte pour ne pas bloquer la mise en test.",
    },
  ],
  maya: [
    {
      id: "ml1",
      authorId: "maya",
      author: "Maya Lopez",
      initials: "ML",
      time: "11:04",
      content: "Le client veut aussi une vue compacte pour les CSM, avec tâches et derniers signaux en priorité.",
    },
    {
      id: "ml2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "11:11",
      content: "Oui, on peut réutiliser le même shell et réduire juste la densité des blocs latéraux.",
    },
  ],
  claire: [
    {
      id: "cd1",
      authorId: "claire",
      author: "Claire Dubois",
      initials: "CD",
      time: "10:37",
      content: "Je bloque 20 min pour la revue steering si tu confirmes le créneau de 14:30.",
    },
  ],
  adrien: [
    {
      id: "am1",
      authorId: "adrien",
      author: "Adrien Moreau",
      initials: "AM",
      time: "11:23",
      content: "Le panneau supporte bien les très longues listes maintenant, même avec plusieurs canaux et MPs.",
    },
    {
      id: "am2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "11:27",
      content: "Parfait, je pousse encore quelques mocks pour tester le scroll et les états vides.",
    },
  ],
  ines: [
    {
      id: "ir1",
      authorId: "ines",
      author: "Ines Rahal",
      initials: "IR",
      time: "Hier",
      content: "Je t’ai laissé les retours de tests utilisateurs dans le doc, surtout sur la compréhension du rail latéral.",
    },
  ],
  jonas: [
    {
      id: "jb1",
      authorId: "jonas",
      author: "Jonas Becker",
      initials: "JB",
      time: "09:33",
      content: "Je surveille encore le cluster vidéo pendant 30 minutes, mais les métriques restent stables.",
    },
  ],
  nina: [
    {
      id: "nr1",
      authorId: "nina",
      author: "Nina Rossi",
      initials: "NR",
      time: "Lun.",
      content: "J’ai besoin de la version finale des mentions légales avant publication des nouvelles pages.",
    },
  ],
  pierre: [
    {
      id: "pg1",
      authorId: "pierre",
      author: "Pierre Garnier",
      initials: "PG",
      time: "09:56",
      content: "Je t’envoie les chiffres d’activation avant midi avec un delta par segment.",
    },
  ],
  zoe: [
    {
      id: "zl1",
      authorId: "zoe",
      author: "Zoé Laurent",
      initials: "ZL",
      time: "Mar.",
      content: "On garde quelle capture pour la séquence marketing ? Celle avec la colonne Lecture est plus claire.",
    },
  ],
  omar: [
    {
      id: "oh1",
      authorId: "omar",
      author: "Omar Haddad",
      initials: "OH",
      time: "09:18",
      content: "Les partenaires veulent un environnement de test dès demain avec un scénario guidé.",
    },
  ],
  lucas: [
    {
      id: "lm1",
      authorId: "lucas",
      author: "Lucas Meyer",
      initials: "LM",
      time: "08:57",
      content: "Le support a documenté 4 tickets récurrents depuis ce matin, principalement sur l’invitation externe.",
    },
  ],
  camille: [
    {
      id: "cp1",
      authorId: "camille",
      author: "Camille Petit",
      initials: "CP",
      time: "Jeu.",
      content: "J’attends les coûts consolidés pour le board pack avant d’envoyer la version finance.",
    },
  ],
};

export const mockConversationMessages: Record<string, ChatMessage[]> = {
  product: [
    {
      id: "product-mock-1",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "09:47",
      content: "Je viens d’ajouter une variante avec aperçu des participants épinglé dans l’en-tête du canal.",
    },
    {
      id: "product-mock-2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "09:49",
      content: "Gardons-la pour la démo interne seulement, je préfère une version plus calme pour le client.",
    },
    {
      id: "product-mock-3",
      authorId: "marcus",
      author: "Marcus Chen",
      initials: "MC",
      time: "09:52",
      content: "Ça me va. Je peux exposer le compteur de présence dans la route chat sans changer le contrat principal.",
    },
    {
      id: "product-mock-4",
      authorId: "sarah",
      author: "Sarah Kim",
      initials: "SK",
      time: "09:55",
      content: "Le support veut aussi un état vide plus explicite quand aucun canal n’est sélectionné.",
    },
  ],
  "design-system": [
    {
      id: "design-system-mock-1",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "11:12",
      content: "J’ai harmonisé les rayons entre les bulles de message et les cartes contextuelles.",
    },
    {
      id: "design-system-mock-2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "11:14",
      content: "Oui, c’est plus net. On garde 2xl pour les messages reçus et primaire plein pour les messages envoyés.",
    },
    {
      id: "design-system-mock-3",
      authorId: "marcus",
      author: "Marcus Chen",
      initials: "MC",
      time: "11:16",
      content: "Je vérifie juste le contraste sur les fonds sombres avant de propager ça aux autres écrans.",
    },
  ],
  "customer-success": [
    {
      id: "customer-success-mock-1",
      authorId: "maya",
      author: "Maya Lopez",
      initials: "ML",
      time: "10:28",
      content: "Les CSM veulent retrouver les dernières décisions sans remonter tout le fil de discussion.",
    },
    {
      id: "customer-success-mock-2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "10:31",
      content: "On peut tester un bloc synthèse avec trois points: risque, prochaine action, propriétaire.",
    },
    {
      id: "customer-success-mock-3",
      authorId: "sarah",
      author: "Sarah Kim",
      initials: "SK",
      time: "10:35",
      content: "Parfait, ça répond exactement au besoin du recap avant appel client.",
    },
  ],
  "war-room": [
    {
      id: "war-room-mock-1",
      authorId: "jonas",
      author: "Jonas Becker",
      initials: "JB",
      time: "10:01",
      content: "Je confirme, les erreurs ont chuté après bascule du trafic. Je garde les alertes renforcées encore une heure.",
    },
    {
      id: "war-room-mock-2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "10:04",
      content: "Merci. Notez bien la chronologie, on en aura besoin pour le post mortem de cet après-midi.",
    },
  ],
  marcus: [
    {
      id: "marcus-mock-1",
      authorId: "marcus",
      author: "Marcus Chen",
      initials: "MC",
      time: "08:19",
      content: "J’ai déjà traité le commentaire sur la pagination, il me reste juste la partie présence temps réel.",
    },
    {
      id: "marcus-mock-2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "08:23",
      content: "OK, merge dès que tu es confortable sur les états loading du panneau latéral.",
    },
  ],
  elena: [
    {
      id: "elena-mock-1",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "11:18",
      content: "J’ai aussi réduit l’écart entre le titre et le sous-titre dans le header conversation.",
    },
    {
      id: "elena-mock-2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "11:20",
      content: "Vu. C’est mieux, surtout sur mobile où la ligne secondaire prenait trop de place.",
    },
    {
      id: "elena-mock-3",
      authorId: "elena",
      author: "Elena Martin",
      initials: "EM",
      time: "11:22",
      content: "Je te laisse la main sur les derniers contenus mockés pour tester la densité du fil.",
    },
  ],
  maya: [
    {
      id: "maya-mock-1",
      authorId: "maya",
      author: "Maya Lopez",
      initials: "ML",
      time: "11:15",
      content: "Si tu peux, ajoute quelques messages plus longs pour qu’on voie comment le texte respire dans le canal.",
    },
    {
      id: "maya-mock-2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "11:17",
      content: "Oui, je vais charger les conversations avec assez de matière pour tester le scroll, la lecture et les actions inline.",
    },
  ],
  adrien: [
    {
      id: "adrien-mock-1",
      authorId: "adrien",
      author: "Adrien Moreau",
      initials: "AM",
      time: "11:29",
      content: "La colonne tient bien même avec une vingtaine de messages supplémentaires et plusieurs auteurs alternés.",
    },
    {
      id: "adrien-mock-2",
      authorId: "liam",
      author: "Liam Ward",
      initials: "LW",
      time: "11:31",
      content: "Parfait, c’est exactement le test visuel qu’il nous fallait avant de brancher de vraies données.",
    },
  ],
  noah: [
    {
      id: "noah-mock-1",
      authorId: "noah",
      author: "Noah Williams",
      initials: "NW",
      time: "Mar.",
      content: "Quand tu arbitres le mode invité, pense aussi au comportement des pièces jointes dans les MPs externes.",
    },
  ],
};

export const recentMessages = [
  {
    id: "m1",
    authorId: "elena",
    author: "Elena Martin",
    initials: "EM",
    time: "09:36",
    content:
      "J’ai terminé la nouvelle direction du client. Le shell est plus compact et le contexte reste visible pendant la navigation.",
  },
  {
    id: "m2",
    authorId: "marcus",
    author: "Marcus Chen",
    initials: "MC",
    time: "09:39",
    content:
      "La séparation rail, panneau contextuel et espace actif est compatible avec nos routes actuelles. Je prépare les contrats API.",
  },
  {
    id: "m3",
    authorId: "liam",
    author: "Liam Ward",
    initials: "LW",
    time: "09:42",
    content: "Parfait. Je prends la version de Elena pour la revue et je valide le flux mobile avant 15 h.",
  },
] as const;

export const currentUser = people[0];
