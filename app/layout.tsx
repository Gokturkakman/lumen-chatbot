import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { Providers } from "@/components/providers";
import type { Locale } from "@/lib/types";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const display = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumen — araştıran asistan",
  description:
    "Haberleri getiren, YouTube videolarını izleyen, web'i okuyan ve görselleri anlayan çok modelli sohbet asistanı.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#131210" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieLocale = (await cookies()).get("lumen_locale")?.value;
  const locale: Locale = cookieLocale === "en" ? "en" : "tr";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${display.variable} ${mono.variable} antialiased`}
      >
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
