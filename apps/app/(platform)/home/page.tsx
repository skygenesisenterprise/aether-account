"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ChevronRight,
  Database,
  Grid3X3,
  HardDrive,
  Key,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  User,
  Users,
  Wallet,
} from "lucide-react";

import { usePlatform } from "@/context/PlatformContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getHomeStats } from "@/lib/api/platform";
import type { HomeStats } from "@/lib/api/platform";
import { cn } from "@/lib/utils";

function getInitials(name?: string) {
  if (!name) return "AA";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

/* --- Hero --- */
function Hero({ name, email, avatarUrl }: { name?: string; email?: string; avatarUrl?: string }) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-white/6 bg-[#232426] px-4 py-6 text-center sm:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#7775ff]/12 to-transparent" />
      <div className="relative flex flex-col items-center">
        <Avatar className="size-16 ring-2 ring-[#7775ff]/40 ring-offset-2 ring-offset-[#232426]">
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback className="bg-[#5d5bd4] text-base font-semibold text-white">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-white text-balance sm:text-2xl">
          {greeting()}, {name?.split(" ")[0] ?? "bienvenue"}
        </h1>
        {email ? <p className="mt-1 text-xs text-zinc-400 sm:text-sm">{email}</p> : null}
        <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-400 text-pretty sm:text-sm">
          Gérez vos informations, votre confidentialité et votre sécurité pour que Aether réponde à vos besoins.
        </p>
        <Link
          href="/user-info"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/6 sm:text-sm sm:px-5 sm:py-2"
        >
          Gérer votre compte Aether
          <ChevronRight className="size-3.5 sm:size-4" />
        </Link>
      </div>
    </section>
  );
}

/* --- Cartes thématiques et Sécurité combinées --- */
interface FeatureCard {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const featureCards: FeatureCard[] = [
  {
    href: "/data",
    icon: Database,
    title: "Confidentialité",
    description: "Données de votre compte",
  },
  {
    href: "/security",
    icon: ShieldCheck,
    title: "Sécurité",
    description: "Sessions et appareils",
  },
  {
    href: "/wallet",
    icon: Wallet,
    title: "Wallet",
    description: "Paiements et abonnements",
  },
];

function FeatureCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {featureCards.map(({ href, icon: Icon, title, description }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col rounded-xl border border-white/6 bg-[#232426] p-4 transition-colors hover:border-white/12 hover:bg-[#26272a]"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#7775ff]/12 text-[#8b89ff]">
            <Icon className="size-4.5" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#8b89ff]">
            Gérer
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/* --- Contrôle de sécurité compact --- */
function SecurityCheckup({ stats }: { stats: HomeStats }) {
  const twoFa = stats.twoFactorEnabled ?? false;
  const secure = twoFa;

  return (
    <div className="overflow-hidden rounded-xl border border-white/6 bg-[#232426]">
      <div className="flex items-start gap-3 border-b border-white/6 p-4">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            secure ? "bg-emerald-500/12 text-emerald-400" : "bg-amber-500/12 text-amber-400"
          )}
        >
          {secure ? <ShieldCheck className="size-4.5" /> : <ShieldAlert className="size-4.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-white">
            {secure ? "Compte protégé" : "Renforcez la sécurité"}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            {secure
              ? "Aucune action de sécurité requise."
              : "Recommandations pour protéger votre compte."}
          </p>
        </div>
        <Link
          href="/security"
          className="shrink-0 items-center gap-1 rounded-full border border-white/12 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/6 hidden sm:inline-flex"
        >
          Vérifier
        </Link>
      </div>
      <div className="grid divide-y divide-white/6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <SecurityStat
          icon={Lock}
          label="2FA"
          value={twoFa ? "Activée" : "Désactivée"}
          tone={twoFa ? "ok" : "warn"}
        />
        <SecurityStat
          icon={Smartphone}
          label="Appareils"
          value={String(stats.devicesCount ?? 0)}
          tone="neutral"
        />
        <SecurityStat
          icon={Grid3X3}
          label="Applications"
          value={String(stats.applicationsCount ?? 0)}
          tone="neutral"
        />
      </div>
    </div>
  );
}

function SecurityStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "ok" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "ok" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-white";
  return (
    <div className="flex items-center gap-2 p-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/4 text-zinc-400">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className={cn("text-xs font-semibold", toneClass)}>{value}</p>
      </div>
    </div>
  );
}

/* --- Accès rapide --- */
const quickLinks = [
  { href: "/user-info", icon: User, label: "Informations" },
  { href: "/password", icon: Key, label: "Mot de passe" },
  { href: "/applications", icon: Grid3X3, label: "Applications" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/drive", icon: HardDrive, label: "Stockage" },
  { href: "/familly", icon: Users, label: "Famille" },
];

function QuickAccess() {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:text-sm">Accès rapide</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-2 rounded-lg border border-white/6 bg-[#232426] px-3 py-2.5 transition-colors hover:border-white/12 hover:bg-[#26272a]"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/4 text-zinc-300">
              <Icon className="size-4" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-200 sm:text-sm">{label}</span>
            <ChevronRight className="size-3.5 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* --- Activité récente --- */
function RecentActivity({ items }: { items: HomeStats["recentActivity"] }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:text-sm">Activité récente</h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-[#232426] px-4 py-4 text-center">
          <p className="text-xs text-zinc-500 sm:text-sm">Aucune activité récente.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/6 bg-[#232426]">
          <div className="divide-y divide-white/6">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start gap-2 px-3 py-2.5">
                <span
                  className={cn(
                    "mt-1 size-1.5 shrink-0 rounded-full",
                    item.isRead ? "bg-zinc-600" : "bg-[#7775ff]"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-100 sm:text-sm">{item.title}</p>
                  <p className="truncate text-xs text-zinc-500">{item.message}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500">{formatTimeAgo(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* --- Skeleton --- */
function HomeSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 rounded-xl bg-white/5" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
        ))}
      </div>
      <Skeleton className="h-24 rounded-xl bg-white/5" />
      <Skeleton className="h-20 rounded-xl bg-white/5" />
    </div>
  );
}

export default function HomePage() {
  const { currentUser } = usePlatform();
  const [stats, setStats] = React.useState<HomeStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getHomeStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const name = currentUser?.displayName ?? currentUser?.name ?? undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <Hero name={name} email={currentUser?.email} avatarUrl={currentUser?.avatarUrl} />

      {loading ? (
        <div className="mt-4">
          <HomeSkeleton />
        </div>
      ) : error ? (
        <div className="mt-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Impossible de charger votre tableau de bord</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : stats ? (
        <div className="mt-4 space-y-4">
          <FeatureCards />
          <SecurityCheckup stats={stats} />
          <QuickAccess />
          <RecentActivity items={stats.recentActivity} />
        </div>
      ) : null}
    </div>
  );
}
