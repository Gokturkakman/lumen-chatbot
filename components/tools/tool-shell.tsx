"use client";

import { motion } from "motion/react";

import { AlertIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Animated chip shown while a tool is still running. */
export function ToolRunning({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="my-3 inline-flex items-center gap-2 rounded-full border border-rule bg-sunken/70 py-1.5 pl-2.5 pr-3.5">
      <span className="relative grid h-4 w-4 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-accent/25" />
        <Icon size={13} className="relative text-accent" />
      </span>
      <span className="eyebrow !text-ink">{label}</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1 w-1 rounded-full bg-accent"
            style={{
              animation: "shimmer 1.2s ease-in-out infinite",
              animationDelay: `${index * 0.16}s`,
            }}
          />
        ))}
      </span>
    </div>
  );
}

export function ToolError({ message }: { message: string }) {
  return (
    <div className="my-3 flex items-start gap-2.5 rounded-xl border border-rule bg-sunken px-3.5 py-2.5">
      <AlertIcon size={15} className="mt-px shrink-0 text-negative" />
      <p className="text-[12.5px] leading-relaxed text-muted">{message}</p>
    </div>
  );
}

/** Card wrapper every tool result shares: eyebrow header + hairline + body. */
export function ToolCard({
  icon: Icon,
  eyebrow,
  meta,
  children,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  eyebrow: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("card my-4 overflow-hidden shadow-card", className)}
    >
      <header className="flex items-center gap-2 border-b border-rule bg-sunken/45 px-4 py-2.5">
        <Icon size={13} className="shrink-0 text-accent" />
        <span className="eyebrow !text-ink">{eyebrow}</span>
        {meta && (
          <>
            <span className="ml-auto" />
            <span className="truncate text-[11px] text-faint">{meta}</span>
          </>
        )}
      </header>
      {children}
    </motion.section>
  );
}
