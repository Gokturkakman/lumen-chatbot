"use client";

import { motion } from "motion/react";

import {
  GlobeIcon,
  NewspaperIcon,
  PlayIcon,
  UserIcon,
} from "@/components/icons";
import { useI18n, type TranslationKey } from "@/lib/i18n";

const SUGGESTIONS: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: TranslationKey;
  prompt: TranslationKey;
  /** Prompts that only make sense once the user pastes a URL. */
  needsInput?: boolean;
}[] = [
  { icon: NewspaperIcon, label: "suggest.news.label", prompt: "suggest.news.prompt" },
  { icon: PlayIcon, label: "suggest.video.label", prompt: "suggest.video.prompt", needsInput: true },
  { icon: UserIcon, label: "suggest.person.label", prompt: "suggest.person.prompt", needsInput: true },
  { icon: GlobeIcon, label: "suggest.search.label", prompt: "suggest.search.prompt" },
];

function greetingKey(): TranslationKey {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting.morning";
  if (hour < 18) return "greeting.afternoon";
  return "greeting.evening";
}

export function Welcome({
  onPick,
  onPrefill,
}: {
  onPick: (text: string) => void;
  onPrefill: (text: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 pb-2 pt-6 sm:px-8">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="eyebrow"
      >
        {t(greetingKey())}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="mt-2.5 font-serif text-[clamp(2rem,5.5vw,2.9rem)] leading-[1.08] tracking-tight text-ink"
      >
        {t("home.headline")}
      </motion.h1>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="hairline mt-5 origin-left"
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-4 max-w-[46ch] text-[14.5px] leading-relaxed text-muted"
      >
        {t("home.sub")}
      </motion.p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion, index) => {
          const Icon = suggestion.icon;
          const prompt = t(suggestion.prompt);

          return (
            <motion.button
              key={suggestion.label}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0.3 + index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() =>
                suggestion.needsInput ? onPrefill(prompt) : onPick(prompt)
              }
              className="group flex h-9 items-center gap-2 rounded-full border border-rule bg-raised pl-3 pr-4 text-[13px] font-medium text-ink transition-all hover:-translate-y-px hover:border-accent-rule hover:shadow-card"
            >
              <Icon
                size={14}
                className="text-faint transition-colors group-hover:text-accent"
              />
              {t(suggestion.label)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
