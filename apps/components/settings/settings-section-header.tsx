import * as React from "react";

interface SettingsSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function SettingsSectionHeader({ eyebrow, title, description, actions }: SettingsSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300/80">{eyebrow}</p> : null}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
