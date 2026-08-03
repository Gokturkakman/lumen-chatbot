"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { MoonIcon, SidebarIcon, SunIcon } from "@/components/icons";
import { ModelPicker } from "@/components/model-picker";
import type { ChatModel } from "@/lib/ai/models";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function TopBar({
  models,
  modelId,
  onModelChange,
  sidebarOpen,
  onToggleSidebar,
}: {
  models: ChatModel[];
  modelId: string;
  onModelChange: (id: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const { t, locale, setLocale } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b border-rule bg-paper/85 px-3 backdrop-blur-xl sm:px-4">
      {!sidebarOpen && (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={t("nav.expand")}
          className="grid h-8.5 w-8.5 place-items-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <SidebarIcon size={17} />
        </button>
      )}

      <ModelPicker models={models} value={modelId} onChange={onModelChange} />

      <div className="flex-1" />

      {/* Language */}
      <div className="flex h-8.5 items-center rounded-lg border border-rule bg-sunken/60 p-0.5">
        {(["tr", "en"] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={cn(
              "h-7 rounded-md px-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all",
              locale === code
                ? "bg-raised text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
                : "text-faint hover:text-muted"
            )}
          >
            {code}
          </button>
        ))}
      </div>

      {/* Theme */}
      <button
        type="button"
        aria-label={t("theme.toggle")}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="grid h-8.5 w-8.5 place-items-center rounded-lg border border-rule bg-sunken/60 text-muted transition-colors hover:text-ink"
      >
        {mounted && resolvedTheme === "dark" ? (
          <SunIcon size={15} />
        ) : (
          <MoonIcon size={15} />
        )}
      </button>
    </header>
  );
}
