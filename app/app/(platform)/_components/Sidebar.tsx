"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, User, Shield, Key, Box, Database, Share2, Wallet } from "lucide-react";

const navItems = [
  { label: "Accueil", href: "/home", icon: Home },
  { label: "Informations personnelles", href: "/personal", icon: User },
  { label: "Sécurité et connexion", href: "/security", icon: Shield },
  { label: "Mot de passe Vault", href: "/password", icon: Key },
  { label: "Applis et services tiers", href: "/third-party", icon: Box },
  { label: "Données et confidentialité", href: "/privacy", icon: Database },
  { label: "Contacts et partage", href: "/contacts", icon: Share2 },
  { label: "Wallet et abonnements", href: "/wallet", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col bg-background">
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium font-sans transition-colors",
                    isActive
                      ? "bg-background-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-background-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
