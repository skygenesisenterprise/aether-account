"use client";

import { HelpCircle, LayoutGrid, Settings, LogOut, CreditCard, Shield } from "lucide-react";
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
        <h1 className="text-sm font-medium font-sans text-white/70">
          Sky Genesis Enterprise Account
        </h1>
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
              className="z-50 min-w-80 rounded-md border border-border bg-popover p-2 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              <div className="px-2 pb-3 pt-1.5 text-sm font-medium font-sans text-muted-foreground">
                Applications
              </div>
              <div className="grid grid-cols-3 gap-1">
                {apps.map((app) => (
                  <DropdownMenu.Item
                    key={app.name}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-md p-3 text-center text-sm text-popover-foreground outline-none hover:bg-secondary focus:bg-secondary"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                      <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium font-sans text-xs">{app.name}</span>
                      <span className="text-[10px] text-muted-foreground">{app.description}</span>
                    </div>
                  </DropdownMenu.Item>
                ))}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              aria-label="Account menu"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-secondary text-[10px] font-medium">JD</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-64 rounded-md border border-border bg-popover p-2 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              <div className="mb-3 flex items-center gap-3 rounded-md border border-border bg-background p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-secondary text-sm font-medium">JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium font-sans">John Doe</span>
                  <span className="text-xs text-muted-foreground">john.doe@company.com</span>
                </div>
              </div>

              <div className="space-y-1">
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-popover-foreground outline-none hover:bg-secondary focus:bg-secondary">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Account settings
                </DropdownMenu.Item>
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-popover-foreground outline-none hover:bg-secondary focus:bg-secondary">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Billing
                </DropdownMenu.Item>
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-popover-foreground outline-none hover:bg-secondary focus:bg-secondary">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Security
                </DropdownMenu.Item>
              </div>

              <DropdownMenu.Separator className="my-2 h-px bg-border" />

              <DropdownMenu.Item className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-red-500 outline-none hover:bg-red-500/10 focus:bg-red-500/10">
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
