"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SettingsSection } from "@/components/settings/settings-utils";
import { settingsNavigation } from "@/components/settings/settings-utils";

interface SettingsNavigationProps {
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsNavigation({ section, onSectionChange }: SettingsNavigationProps) {
  return (
    <>
      <div className="lg:hidden">
        <Select value={section} onValueChange={(value) => onSectionChange(value as SettingsSection)}>
          <SelectTrigger className="w-full border-white/10 bg-[#292a2c] text-left text-white">
            <SelectValue placeholder="Choisir une section" />
          </SelectTrigger>
          <SelectContent>
            {settingsNavigation.map((group) =>
              group.items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {group.label} · {item.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <aside className="hidden rounded-md border border-white/10 bg-[#292a2c] p-3 lg:block">
        <div className="space-y-4">
          {settingsNavigation.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant="ghost"
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "h-auto w-full justify-start rounded-md px-2 py-2 text-left text-zinc-300 hover:bg-white/5 hover:text-white",
                      section === item.id ? "bg-violet-500/12 text-white" : ""
                    )}
                  >
                    <span className="block">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="mt-1 block text-xs text-zinc-500">{item.description}</span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
