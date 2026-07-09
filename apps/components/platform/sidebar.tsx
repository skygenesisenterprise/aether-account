"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  User,
  Shield,
  Key,
  Grid3X3,
  Database,
  Users,
  Folder,
  Settings,
  Share2,
  type LucideIcon,
} from "lucide-react";

import { usePlatform } from "@/context/PlatformContext";
import { canAccessSettings } from "@/components/settings/settings-utils";
import { cn } from "@/lib/utils";


// Définition des éléments de navigation de la plateforme
interface PlatformNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

// Liste des éléments de navigation principaux
const platformNavItems: PlatformNavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/home",
    icon: Home,
  },
  {
    id: "wallet",
    label: "Wallet & Abonnements",
    href: "/wallet",
    icon: Wallet,
  },
  {
    id: "user-info",
    label: "Information personnelles",
    href: "/user-info",
    icon: User,
  },
  {
    id: "security",
    label: "Sécurité et connexion",
    href: "/security",
    icon: Shield,
  },
  {
    id: "password",
    label: "Mot de passe",
    href: "/password",
    icon: Key,
  },
  {
    id: "applications",
    label: "Applications Associés",
    href: "/applications",
    icon: Grid3X3,
  },
  {
    id: "data",
    label: "Données et confidentialité",
    href: "/data",
    icon: Database,
  },
  {
    id: "contacts",
    label: "Contacts et Partage",
    href: "/contacts",
    icon: Share2,
  },
  {
    id: "family",
    label: "Famille",
    href: "/familly",
    icon: Users,
  },
  {
    id: "drive",
    label: "Espace de Stockage",
    href: "/drive",
    icon: Folder,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

// Éléments pour la navigation mobile (sélection des plus importants)
const mobileNavItems = [
  { id: "home", href: "/home", icon: Home, label: "Home" },
  { id: "wallet", href: "/wallet", icon: Wallet, label: "Wallet" },
  { id: "user-info", href: "/user-info", icon: User, label: "Profil" },
  { id: "applications", href: "/applications", icon: Grid3X3, label: "Apps" },
  { id: "settings", href: "/settings", icon: Settings, label: "Param" },
];

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopNavLink({
  href,
  label,
  icon: Icon,
  badge,
  pathname,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  pathname: string;
}) {
  const active = !href.includes("#") && isActiveRoute(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 px-4 py-2.5 text-sm text-[#b6b7ba] transition-colors hover:bg-white/4 hover:text-white",
        active && "bg-white/4 text-white"
      )}
      aria-current={active ? "page" : undefined}
    >
      {active ? (
        <span className="absolute left-0 h-full w-0.5 rounded-r-full bg-[#7775ff]" />
      ) : null}
      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors">
        <Icon className="size-4.5" strokeWidth={1.7} />
        {badge ? (
          <span className="absolute -right-1 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-[#5d5bd4] px-1 text-[9px] font-semibold leading-4 text-white ring-2 ring-[#0d0e10]">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="truncate font-medium">{label}</span>
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  badge,
  pathname,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  pathname: string;
}) {
  const active = isActiveRoute(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-1 text-[9px] text-zinc-500",
        active && "text-[#8b89ff]"
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full",
          active && "bg-[#5d5bd4] text-white"
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="max-w-full truncate px-0.5">{label}</span>
      {badge ? (
        <span className="absolute right-[18%] top-1.5 size-1.5 rounded-full bg-[#7775ff]" />
      ) : null}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { activeWorkspace, currentUser } = usePlatform();
  const navItemsWithBadges = React.useMemo(() => platformNavItems, []);

  const canSeeSettings = canAccessSettings(currentUser, activeWorkspace);

  // Filtrer les éléments pour la navigation mobile
  const filteredMobileItems = mobileNavItems.filter(
    (item) =>
      item.id !== "settings" || (item.id === "settings" && canSeeSettings)
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-white/6 bg-[#232426] text-zinc-300 md:flex">
        <nav
          className="flex flex-1 flex-col overflow-y-auto py-2"
          aria-label="Navigation plateforme"
        >
          {navItemsWithBadges.map((item) => (
            <DesktopNavLink key={item.id} {...item} pathname={pathname} />
          ))}
        </nav>
      </aside>

      {/* Navigation Mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-white/10 bg-[#232426]/98 px-1 backdrop-blur-xl md:hidden"
        aria-label="Navigation mobile"
      >
        {filteredMobileItems.map((item) => {
          const navItem = navItemsWithBadges.find((n) => n.id === item.id);
          if (!navItem) return null;

          return (
            <MobileNavLink
              key={item.id}
              href={navItem.href}
              label={item.label}
              icon={navItem.icon}
              badge={navItem.badge}
              pathname={pathname}
            />
          );
        })}
      </nav>
    </>
  );
}
