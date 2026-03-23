"use client";

import { HelpCircle, LayoutGrid, User } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";

const apps = [
  { name: "Aether Mail", description: "Secure email client" },
  { name: "Aether Drive", description: "Cloud storage" },
  { name: "Aether Chat", description: "Team messaging" },
  { name: "Aether Calendar", description: "Schedule management" },
  { name: "Aether Office", description: "Productivity suite" },
];

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold font-sans text-foreground">Aether Account</h1>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Apps menu"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-70 rounded-md border border-border bg-popover p-2 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              <div className="px-2 py-1.5 text-sm font-medium font-sans text-muted-foreground">
                Applications
              </div>
              {apps.map((app) => (
                <DropdownMenu.Item
                  key={app.name}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-popover-foreground outline-none hover:bg-secondary focus:bg-secondary"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium font-sans">{app.name}</span>
                    <span className="text-xs text-muted-foreground">{app.description}</span>
                  </div>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              aria-label="Account menu"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-secondary text-xs font-medium">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-50 rounded-md border border-border bg-popover p-2 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              <DropdownMenu.Item className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-popover-foreground outline-none hover:bg-secondary focus:bg-secondary">
                Manage account
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-popover-foreground outline-none hover:bg-secondary focus:bg-secondary">
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
