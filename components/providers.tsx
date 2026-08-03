"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { I18nProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider initialLocale={initialLocale}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--paper-raised)",
              border: "1px solid var(--rule)",
              color: "var(--ink)",
              borderRadius: "12px",
              fontSize: "0.875rem",
              boxShadow: "var(--shadow-pop)",
            },
          }}
        />
      </I18nProvider>
    </ThemeProvider>
  );
}
