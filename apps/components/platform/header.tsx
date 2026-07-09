"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  CircleOff,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  HelpCircle,
  Keyboard,
  MapPinPlus,
  MessageSquareMore,
  Minus,
  MoreHorizontal,
  RotateCcw,
  Settings,
  Signature,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { usePlatform } from "@/context/PlatformContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateMe } from "@/lib/api/me";
import { normalizePresenceStatus, presenceStatusClasses, resolveUserPresenceStatus, type PresenceStatus } from "@/lib/presence";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  className?: string;
}

interface HeaderSearchItem {
  id: string;
  label: string;
  description: string;
  href: string;
  keywords: string[];
}

interface PresenceOption {
  value: PresenceStatus;
  label: string;
}

interface PresencePreviewItem {
  id: string;
  label: string;
  tone: "online" | "busy" | "away" | "offline";
  icon: "check" | "busy" | "brb" | "away" | "offline";
  value?: PresenceStatus;
}

interface WorkLocationOption {
  id: string;
  label: string;
  description: string;
}

interface StatusMessageOption {
  id: string;
  label: string;
}

const PRESENCE_OPTIONS: PresenceOption[] = [
  { value: "online", label: "Disponible" },
  { value: "busy", label: "Occupé(e)" },
  { value: "away", label: "Apparaître absent" },
  { value: "offline", label: "Apparaître hors ligne" },
];

const PRESENCE_MENU_ITEMS: PresencePreviewItem[] = [
  { id: "online", label: "Disponible", tone: "online", icon: "check", value: "online" },
  { id: "busy", label: "Occupé(e)", tone: "busy", icon: "busy", value: "busy" },
  { id: "dnd", label: "Ne pas déranger", tone: "busy", icon: "busy" },
  { id: "brb", label: "De retour bientôt", tone: "away", icon: "brb" },
  { id: "away", label: "Apparaître absent", tone: "away", icon: "away", value: "away" },
  { id: "offline", label: "Apparaître hors ligne", tone: "offline", icon: "offline", value: "offline" },
];

const WORK_LOCATION_OPTIONS: WorkLocationOption[] = [
  { id: "office", label: "Au bureau", description: "Présence sur site aujourd'hui" },
  { id: "home", label: "En télétravail", description: "Travail à distance" },
  { id: "travel", label: "En déplacement", description: "Rendez-vous ou visite externe" },
  { id: "client", label: "Chez un client", description: "Intervention ou réunion" },
];

const STATUS_MESSAGE_OPTIONS: StatusMessageOption[] = [
  { id: "focus", label: "En focus, réponses différées" },
  { id: "meeting", label: "En réunion" },
  { id: "call", label: "En appel" },
  { id: "back-soon", label: "De retour bientôt" },
  { id: "available", label: "Disponible pour échanger" },
  { id: "clear", label: "Aucun message de statut" },
];

function getInitials(name?: string) {
  if (!name) return "AM";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PresenceGlyph({ icon, tone }: Pick<PresencePreviewItem, "icon" | "tone">) {
  const toneClasses: Record<PresencePreviewItem["tone"], string> = {
    online: "bg-[#4cd137] text-[#143800]",
    busy: "bg-[#eb4d4b] text-white",
    away: "bg-[#ffb900] text-[#2d2200]",
    offline: "bg-[#595959] text-[#dadada]",
  };

  if (icon === "offline") {
    return (
      <span className={cn("flex size-4 items-center justify-center rounded-full", toneClasses[tone])}>
        <CircleOff className="size-3" strokeWidth={2.4} />
      </span>
    );
  }

  if (icon === "busy") {
    return <span className={cn("size-4 rounded-full", toneClasses[tone])} aria-hidden="true" />;
  }

  if (icon === "brb" || icon === "away") {
    return (
      <span className={cn("flex size-4 items-center justify-center rounded-full", toneClasses[tone])}>
        <Minus className="size-3.5" strokeWidth={2.8} />
      </span>
    );
  }

  return (
    <span className={cn("flex size-4 items-center justify-center rounded-full", toneClasses[tone])}>
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}

export function AdminHeader({ className }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, hasActiveSession, isAuthenticated } = useAuth();
  const { activeWorkspace, currentUser, setCurrentUser } = usePlatform();
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [workLocation, setWorkLocation] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const searchContainerRef = React.useRef<HTMLDivElement | null>(null);
  const resolvedUser = currentUser ?? user;
  const presenceStatus: PresenceStatus = resolvedUser
    ? normalizePresenceStatus(currentUser?.presenceStatus) ??
      resolveUserPresenceStatus(resolvedUser, {
        isAuthenticated: hasActiveSession && isAuthenticated,
        isCurrentSession: true,
      }) ??
      "offline"
    : "offline";
  const manualPresenceStatus = normalizePresenceStatus(resolvedUser?.status ?? resolvedUser?.presenceStatus) ?? "offline";
  const effectivePresenceStatus = presenceStatus ?? manualPresenceStatus;
  const currentPresenceLabel = PRESENCE_OPTIONS.find((option) => option.value === effectivePresenceStatus)?.label ?? "Inconnu";
  const currentWorkLocation = WORK_LOCATION_OPTIONS.find((option) => option.id === workLocation);
  const currentStatusMessage = statusMessage ?? null;
  const searchItems = React.useMemo<HeaderSearchItem[]>(
    () => [
      {
        id: "chat",
        label: "Conversations",
        description: "Messages, canaux et appels",
        href: "/chat",
        keywords: ["chat", "message", "messages", "conversation", "canal", "appel"],
      },
      {
        id: "teams",
        label: "Equipes",
        description: "Equipes et canaux",
        href: "/teams",
        keywords: ["team", "teams", "equipe", "equipes", "channel", "canal"],
      },
      {
        id: "contacts",
        label: "Contacts",
        description: "Annuaire et profils",
        href: "/contacts",
        keywords: ["contact", "contacts", "annuaire", "profil", "personne"],
      },
      {
        id: "drive",
        label: "Drive",
        description: "Fichiers et dossiers",
        href: "/drive",
        keywords: ["drive", "fichier", "fichiers", "document", "dossier"],
      },
      {
        id: "tasks",
        label: "Taches",
        description: "Suivi des actions",
        href: "/tasks",
        keywords: ["tache", "taches", "todo", "ticket", "action"],
      },
      {
        id: "calendar",
        label: "Calendrier",
        description: "Evenements et disponibilites",
        href: "/calendar",
        keywords: ["calendar", "calendrier", "meeting", "reunion", "evenement"],
      },
      {
        id: "notifications",
        label: "Notifications",
        description: "Alertes et activite recente",
        href: "/notifications",
        keywords: ["notification", "notifications", "alerte", "activite"],
      },
      {
        id: "settings",
        label: "Parametres",
        description: "Compte et configuration",
        href: "/settings",
        keywords: ["setting", "settings", "parametre", "parametres", "preferences"],
      },
    ],
    []
  );
  const filteredSearchItems = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return searchItems;
    }

    return searchItems.filter((item) =>
      [item.label, item.description, ...item.keywords].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [searchItems, searchQuery]);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextItem = filteredSearchItems[0];
    if (!nextItem) {
      return;
    }

    setSearchOpen(false);
    router.push(nextItem.href);
  }

  async function handlePresenceChange(nextStatus: string) {
    if (!resolvedUser) {
      return;
    }

    const normalizedStatus = PRESENCE_OPTIONS.find((option) => option.value === nextStatus)?.value;
    if (!normalizedStatus || normalizedStatus === manualPresenceStatus || isUpdatingStatus) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const nextUser = await updateMe({ status: normalizedStatus });
      setCurrentUser(nextUser);
      toast.success(`Statut changé: ${PRESENCE_OPTIONS.find((option) => option.value === normalizedStatus)?.label ?? normalizedStatus}`);
    } catch {
      toast.error("Impossible de mettre à jour le statut.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handlePresencePreviewAction(item: PresencePreviewItem) {
    if (item.value) {
      void handlePresenceChange(item.value);
      return;
    }

    toast.info("Ce statut n'est pas encore pris en charge.");
  }

  function handleWorkLocationSelect(option: WorkLocationOption) {
    setWorkLocation(option.id);
    toast.success(`Lieu de travail défini: ${option.label}`);
  }

  function handleStatusMessageSelect(option: StatusMessageOption) {
    const nextValue = option.id === "clear" ? null : option.label;
    setStatusMessage(nextValue);
    toast.success(
      nextValue ? `Message de statut défini: ${nextValue}` : "Message de statut supprimé."
    );
  }

  return (
    <header
      className={cn(
        "relative flex h-11.5 shrink-0 items-center border-b border-white/6 bg-[#0f1011] text-zinc-300",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 md:px-4">
          <span className="truncate text-[13px] font-semibold tracking-[0.01em] text-zinc-100">
            Aether Account
          </span>
        <div className="flex-1" />
        <div ref={searchContainerRef} className="relative w-full max-w-190 flex-1">
          <form onSubmit={handleSearchSubmit}>
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Rechercher une section, un espace ou une action"
              className="h-8 w-full rounded-md border border-white/12 bg-[#232325] px-4 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-500 focus:border-violet-400"
              aria-label="Recherche globale"
            />
          </form>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">
            Ctrl+Alt+E
          </span>
          {searchOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-none border border-white/8 bg-[#2d2d2d] shadow-2xl">
              {filteredSearchItems.length > 0 ? (
                <div className="py-1">
                  {filteredSearchItems.slice(0, 6).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          router.push(item.href);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/6",
                          isActive && "bg-white/6"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-zinc-100">{item.label}</p>
                          <p className="truncate text-xs text-zinc-500">{item.description}</p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-zinc-600" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-zinc-500">
                  Aucun resultat pour “{searchQuery.trim()}”.
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="flex-1" />
      </div>

      <div className="ml-auto flex h-full items-center gap-1.5 px-2 md:px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-md text-zinc-400 hover:bg-white/6 hover:text-white"
              aria-label="Plus d’options"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-none border-white/8 bg-[#2d2d2d] p-0 text-zinc-100 shadow-2xl"
          >
            <DropdownMenuItem className="gap-2 rounded-none px-4 py-3 text-[13px]">
              <Settings className="size-4" />
              <span className="flex-1">Paramètres</span>
              <span className="text-[12px] text-zinc-500">Ctrl+Shift+,</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-none px-4 py-3 text-[13px]">
              <HelpCircle className="size-4" />
              <span className="flex-1">Aide</span>
              <ChevronRight className="size-4 text-zinc-500" />
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-none px-4 py-3 text-[13px]">
              <MessageSquareMore className="size-4" />
              <span className="flex-1">Commentaires</span>
              <ChevronRight className="size-4 text-zinc-500" />
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-none px-4 py-3 text-[13px]">
              <Keyboard className="size-4" />
              <span className="flex-1">Raccourcis clavier</span>
              <span className="text-[12px] text-zinc-500">Ctrl+.</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-none px-4 py-3 text-[13px]">
              <Smartphone className="size-4" />
              Obtenez l’application mobile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-1 rounded-md border-0 px-1 text-zinc-300 shadow-none ring-0 hover:bg-white/6 hover:text-white focus-visible:border-transparent focus-visible:ring-0"
              aria-label="Ouvrir le menu du compte"
            >
              <span className="relative">
                <Avatar className="size-7">
                  <AvatarImage src={resolvedUser?.avatarUrl} alt="" />
                  <AvatarFallback className="bg-violet-600 text-[10px] font-semibold text-white">
                    {getInitials(resolvedUser?.displayName ?? resolvedUser?.name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#232426]",
                    presenceStatusClasses[presenceStatus]
                  )}
                />
              </span>
              <ChevronDown className="hidden size-3 text-zinc-600 lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            forceMount
            asChild
            align="end"
            sideOffset={8}
          >
            <motion.div
              initial={false}
              animate={
                profileMenuOpen
                  ? { opacity: 1, y: 0, scale: 1, pointerEvents: "auto" }
                  : { opacity: 0, y: -10, scale: 0.96, pointerEvents: "none" }
              }
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="origin-top-right w-80 overflow-hidden rounded-none border-transparent bg-[#2d2d2d] p-0 text-zinc-100 shadow-2xl"
            >
                  <div className="border-b border-white/8 bg-[#2d2d2d] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="max-w-44 text-[11px] font-semibold uppercase leading-4 tracking-[0.01em] text-zinc-100">
                        {activeWorkspace?.name ?? "Workspace"}
                      </span>
                      <button
                        type="button"
                        onClick={() => void logout()}
                        className="text-[13px] text-zinc-200 transition-colors hover:text-white"
                      >
                        Se deconnecter
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#2d2d2d] px-4 py-4">
                    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3">
                      <span className="relative shrink-0 self-start pt-0.5">
                        <Avatar className="size-11 rounded-sm">
                          <AvatarImage src={resolvedUser?.avatarUrl} alt="" />
                          <AvatarFallback className="bg-violet-600 text-xs font-semibold text-white">
                            {getInitials(resolvedUser?.displayName ?? resolvedUser?.name)}
                          </AvatarFallback>
                        </Avatar>
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold leading-5 text-zinc-100">
                          {resolvedUser?.displayName ?? resolvedUser?.name ?? "Compte Aether"}
                        </p>
                        <p className="truncate text-[13px] leading-5 text-zinc-100">
                          {resolvedUser?.email || "connecte a Aether Identity"}
                        </p>
                        <a
                          href="https://account.skygenesisenterprise.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-zinc-300 transition-colors hover:text-white"
                        >
                          Afficher le compte
                          <ExternalLink className="size-3" />
                        </a>

                        <div className="mt-3 min-w-0 space-y-0.5">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                disabled={!resolvedUser || isUpdatingStatus}
                                className="flex w-full items-center gap-2 rounded-none px-0 py-2 text-left text-[15px] font-normal text-zinc-100 transition-colors hover:text-white focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
                              >
                                <PresenceGlyph
                                  icon={
                                    effectivePresenceStatus === "online"
                                      ? "check"
                                      : effectivePresenceStatus === "busy"
                                        ? "busy"
                                        : effectivePresenceStatus === "away"
                                          ? "away"
                                          : "offline"
                                  }
                                  tone={effectivePresenceStatus}
                                />
                                <span>{currentPresenceLabel}</span>
                                <span className="sr-only">
                                  {isUpdatingStatus ? "Mise a jour..." : currentPresenceLabel}
                                </span>
                                <ChevronRight className="ml-auto size-4 text-zinc-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              side="bottom"
                              sideOffset={6}
                              className="w-57.5 rounded-md border-[#3a3a3a] bg-[#2d2d2d] p-0 text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                            >
                              <DropdownMenuRadioGroup value={effectivePresenceStatus} onValueChange={(value) => void handlePresenceChange(value)}>
                                <div className="p-2">
                                  {PRESENCE_MENU_ITEMS.map((item) =>
                                    item.value ? (
                                      <DropdownMenuRadioItem
                                        key={item.id}
                                        value={item.value}
                                        disabled={isUpdatingStatus}
                                        className="min-h-10 rounded-md px-5 py-2.5 text-[15px] text-zinc-100 focus:bg-[#3a3a3a] focus:text-white data-[state=checked]:bg-transparent"
                                      >
                                        <div className="flex items-center gap-3">
                                          <PresenceGlyph icon={item.icon} tone={item.tone} />
                                          <span>{item.label}</span>
                                        </div>
                                      </DropdownMenuRadioItem>
                                    ) : (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handlePresencePreviewAction(item)}
                                        className="flex min-h-10 w-full items-center gap-3 rounded-md px-5 py-2.5 text-left text-[15px] text-zinc-100 transition-colors hover:bg-[#3a3a3a] focus:bg-[#3a3a3a] focus:outline-hidden"
                                      >
                                        <PresenceGlyph icon={item.icon} tone={item.tone} />
                                        <span>{item.label}</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </DropdownMenuRadioGroup>
                              <DropdownMenuSeparator className="mx-0 my-0 bg-[#4a4a4a]" />
                              <DropdownMenuItem
                                className="min-h-11 rounded-none px-5 py-3 text-[15px] text-zinc-100 focus:bg-[#3a3a3a] focus:text-white"
                                onSelect={() => toast.info("La durée du statut n'est pas encore configurable.")}
                              >
                                <Clock3 className="size-4 text-zinc-300" />
                                <span className="flex-1">Durée</span>
                                <ChevronRight className="size-4 text-zinc-500" />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="mx-0 my-0 bg-[#4a4a4a]" />
                              <DropdownMenuItem
                                className="min-h-11 rounded-none px-5 py-3 text-[15px] text-zinc-100 focus:bg-[#3a3a3a] focus:text-white"
                                onSelect={() => void handlePresenceChange("online")}
                              >
                                <RotateCcw className="size-4 text-zinc-300" />
                                <span>Réinitialiser le statut</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="mx-0 my-0 bg-[#4a4a4a]" />
                              <DropdownMenuItem
                                className="min-h-11 rounded-none px-5 py-3 text-[15px] text-zinc-100 focus:bg-[#3a3a3a] focus:text-white"
                                onSelect={() => router.push("/settings")}
                              >
                                <Settings className="size-4 text-zinc-300" />
                                <span>Gérer le statut de présence</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex w-full items-center gap-3 px-0 py-2 text-left text-[15px] text-zinc-200 transition-colors hover:text-white focus:outline-hidden"
                              >
                                <MapPinPlus className="size-4 shrink-0 text-zinc-300" />
                                <span className="min-w-0 flex-1">
                                  <span className="block">Definir un lieu de travail</span>
                                  {currentWorkLocation ? (
                                    <span className="block truncate text-[12px] text-zinc-400">
                                      {currentWorkLocation.label}
                                    </span>
                                  ) : null}
                                </span>
                                <ChevronRight className="size-4 text-zinc-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              side="bottom"
                              sideOffset={6}
                              className="w-64 rounded-md border-[#3a3a3a] bg-[#2d2d2d] p-2 text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                            >
                              {WORK_LOCATION_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                  key={option.id}
                                  className="min-h-11 rounded-md px-3 py-2 text-zinc-100 focus:bg-[#3a3a3a] focus:text-white"
                                  onSelect={() => handleWorkLocationSelect(option)}
                                >
                                  <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <MapPinPlus className="mt-0.5 size-4 shrink-0 text-zinc-300" />
                                    <span className="min-w-0">
                                      <span className="block text-[14px]">{option.label}</span>
                                      <span className="block text-[12px] text-zinc-400">{option.description}</span>
                                    </span>
                                  </div>
                                  {currentWorkLocation?.id === option.id ? <Check className="ml-auto size-4 text-zinc-200" /> : null}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex w-full items-center gap-3 px-0 py-2 text-left text-[15px] text-zinc-200 transition-colors hover:text-white focus:outline-hidden"
                              >
                                <Signature className="size-4 shrink-0 text-zinc-300" />
                                <span className="min-w-0 flex-1">
                                  <span className="block">Definir le message de statut</span>
                                  {currentStatusMessage ? (
                                    <span className="block truncate text-[12px] text-zinc-400">
                                      {currentStatusMessage}
                                    </span>
                                  ) : null}
                                </span>
                                <ChevronRight className="size-4 text-zinc-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              side="bottom"
                              sideOffset={6}
                              className="w-72 rounded-md border-[#3a3a3a] bg-[#2d2d2d] p-2 text-zinc-100 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                            >
                              {STATUS_MESSAGE_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                  key={option.id}
                                  className="min-h-11 rounded-md px-3 py-2 text-zinc-100 focus:bg-[#3a3a3a] focus:text-white"
                                  onSelect={() => handleStatusMessageSelect(option)}
                                >
                                  <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <Signature className="size-4 shrink-0 text-zinc-300" />
                                    <span className="truncate text-[14px]">{option.label}</span>
                                  </div>
                                  {(option.id === "clear" && !currentStatusMessage) || option.label === currentStatusMessage ? (
                                    <Check className="ml-auto size-4 text-zinc-200" />
                                  ) : null}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
            </motion.div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
