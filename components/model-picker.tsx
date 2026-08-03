"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import {
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  ImageIcon,
  SparkIcon,
} from "@/components/icons";
import { PROVIDER_LABELS, type ChatModel, type Provider } from "@/lib/ai/models";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: ChatModel[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = models.find((model) => model.id === value) ?? models[0];

  if (!active) {
    return (
      <span className="text-[13px] text-negative">
        No model provider configured
      </span>
    );
  }

  const grouped = models.reduce<Record<string, ChatModel[]>>((acc, model) => {
    (acc[model.provider] ??= []).push(model);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("model.picker")}
        className={cn(
          "flex h-8.5 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium transition-colors",
          open
            ? "border-rule-strong bg-raised text-ink"
            : "border-transparent text-ink hover:border-rule hover:bg-sunken/70"
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {active.name}
        <ChevronDownIcon
          size={13}
          className={cn(
            "text-faint transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-[calc(100%+7px)] z-50 w-[330px] origin-top-left overflow-hidden rounded-xl border border-rule bg-raised shadow-pop"
          >
            <div className="scroll-slim max-h-[min(72vh,580px)] overflow-y-auto p-1.5">
              {(Object.keys(grouped) as Provider[]).map((provider, index) => (
                <div key={provider} className={index > 0 ? "mt-1.5" : ""}>
                  <div className="eyebrow flex items-center gap-2 px-2.5 pb-1 pt-2">
                    {PROVIDER_LABELS[provider]}
                    <span className="h-px flex-1 bg-rule" />
                  </div>

                  {grouped[provider].map((model) => {
                    const selected = model.id === value;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChange(model.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                          selected ? "bg-accent-wash" : "hover:bg-sunken"
                        )}
                      >
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
                          {selected && (
                            <CheckIcon size={13} className="text-accent" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-ink">
                              {model.name}
                            </span>
                            {model.vision && (
                              <Badge label={t("model.vision")}>
                                <ImageIcon size={10} />
                              </Badge>
                            )}
                            {model.reasoning && (
                              <Badge label={t("model.reasoning")}>
                                <BrainIcon size={10} />
                              </Badge>
                            )}
                            {model.fast && (
                              <Badge label={t("model.fast")}>
                                <SparkIcon size={10} />
                              </Badge>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
                            {model.tagline[locale]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={label}
      className="grid h-4 w-4 place-items-center rounded-[5px] border border-rule bg-sunken text-faint"
    >
      {children}
    </span>
  );
}
