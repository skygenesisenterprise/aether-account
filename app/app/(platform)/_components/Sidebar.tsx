"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, User, Shield, Key, Box, Database, Share2, Wallet, ChevronRight } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "Account",
    items: [
      { label: "Home", href: "/home", icon: Home },
      { label: "Personal Info", href: "/personal", icon: User },
      { label: "Security", href: "/security", icon: Shield },
      { label: "Password Vault", href: "/password", icon: Key },
      { label: "Third-party Apps", href: "/third-party", icon: Box },
      { label: "Contacts", href: "/contacts", icon: Share2 },
      { label: "Data Control", href: "/privacy", icon: Database },
      { label: "Plans & Wallet", href: "/wallet", icon: Wallet }
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col bg-background">
      <nav className="flex-1 overflow-y-auto p-2">
        {navigation.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </span>
                      {isActive && <ChevronRight className="h-4 w-4 shrink-0" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
