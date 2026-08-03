"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Locale } from "./types";

const dictionaries = {
  tr: {
    "app.tagline": "araştıran asistan",
    "nav.newChat": "Yeni sohbet",
    "nav.search": "Sohbetlerde ara",
    "nav.noResults": "Sonuç yok",
    "nav.empty": "Henüz sohbet yok",
    "nav.emptyHint": "İlk sorunu sor, burada birikmeye başlasın.",
    "nav.today": "Bugün",
    "nav.yesterday": "Dün",
    "nav.week": "Son 7 gün",
    "nav.older": "Daha eski",
    "nav.rename": "Yeniden adlandır",
    "nav.delete": "Sil",
    "nav.deleteConfirm": "Bu sohbet kalıcı olarak silinsin mi?",
    "nav.collapse": "Kenar çubuğunu daralt",
    "nav.expand": "Kenar çubuğunu genişlet",

    "greeting.morning": "Günaydın",
    "greeting.afternoon": "İyi günler",
    "greeting.evening": "İyi akşamlar",
    "home.headline": "Bugün neyi merak ediyorsun?",
    "home.sub": "Haberleri getirir, videoları izler, web'i okur, görselleri anlar.",

    "suggest.news.label": "Son haberler",
    "suggest.news.prompt": "BBC'nin son 5 haberini getir ve ne anlama geldiklerini özetle",
    "suggest.video.label": "Video özetle",
    "suggest.video.prompt": "Şu YouTube videosunu izleyip özetler misin: ",
    "suggest.person.label": "Kim bu kişi?",
    "suggest.person.prompt": "Şu LinkedIn profilini oku ve bu kişiyi anlat: ",
    "suggest.search.label": "Web'de ara",
    "suggest.search.prompt": "Bu hafta yapay zekâ alanında ne oldu?",

    "composer.placeholder": "Bir şey sor…",
    "composer.placeholderEmpty": "Bir soru sor, görsel yükle ya da bir link yapıştır…",
    "composer.send": "Gönder",
    "composer.stop": "Durdur",
    "composer.attach": "Görsel ekle",
    "composer.hint": "Göndermek için Enter, satır atlamak için Shift + Enter",
    "composer.imageTooBig": "Görsel çok büyük (en fazla 10 MB).",
    "composer.imageOnly": "Sadece görsel dosyaları yükleyebilirsin.",
    "composer.noVision": "{model} görselleri okuyamıyor. Görsel destekli bir modele geç.",
    "composer.remove": "Kaldır",

    "message.you": "Sen",
    "message.copy": "Kopyala",
    "message.copied": "Kopyalandı",
    "message.retry": "Yeniden dene",
    "message.thinking": "Düşünüyor",
    "message.reasoning": "Akıl yürütme",
    "message.error": "Yanıt alınamadı.",
    "message.stopped": "Durduruldu.",

    "tool.getNews.running": "Haberler getiriliyor",
    "tool.getNews.done": "{count} haber · {publisher}",
    "tool.webSearch.running": "Web'de aranıyor",
    "tool.webSearch.done": "{count} sonuç bulundu",
    "tool.readUrl.running": "Sayfa okunuyor",
    "tool.readUrl.done": "Sayfa okundu",
    "tool.summarizeYouTube.running": "Video izleniyor",
    "tool.summarizeYouTube.done": "Video izlendi",
    "tool.getLinkedInProfile.running": "Profil aranıyor",
    "tool.getLinkedInProfile.done": "Profil bulundu",
    "tool.failed": "Başarısız",

    "card.source.rss": "Resmi RSS akışı",
    "card.source.google-news": "Google News",
    "card.source.exa": "Exa araması",
    "card.source.duckduckgo": "DuckDuckGo",
    "card.tldr": "Özet",
    "card.keyPoints": "Ana noktalar",
    "card.timeline": "Bölümler",
    "card.quote": "Dikkat çeken",
    "card.watchOn": "YouTube'da izle",
    "card.viewProfile": "Profili aç",
    "card.otherMatches": "Diğer eşleşmeler",
    "card.readMore": "Devamını oku",

    "model.picker": "Model seç",
    "model.vision": "Görsel",
    "model.fast": "Hızlı",
    "model.reasoning": "Akıl yürütme",

    "account.guest": "Misafir",
    "account.signIn": "Giriş yap",
    "account.signUp": "Hesap oluştur",
    "account.signOut": "Çıkış yap",
    "account.email": "E-posta",
    "account.password": "Şifre",
    "account.passwordHint": "En az 8 karakter",
    "account.saveChats": "Sohbetlerini kalıcı yap",
    "account.saveChatsHint":
      "Şu an misafir olarak gezniyorsun. Hesap açarsan mevcut sohbetlerin korunur ve başka cihazlardan erişebilirsin.",
    "account.haveAccount": "Zaten hesabın var mı?",
    "account.noAccount": "Hesabın yok mu?",
    "account.working": "Bekle…",

    "theme.toggle": "Temayı değiştir",
    "lang.toggle": "Dili değiştir",

    "error.title": "Bir sorun oluştu",
    "error.retry": "Tekrar dene",
    "notFound.title": "Bu sohbet bulunamadı",
    "notFound.action": "Yeni sohbet başlat",
  },

  en: {
    "app.tagline": "the assistant that looks things up",
    "nav.newChat": "New chat",
    "nav.search": "Search chats",
    "nav.noResults": "No matches",
    "nav.empty": "No chats yet",
    "nav.emptyHint": "Ask your first question and it will show up here.",
    "nav.today": "Today",
    "nav.yesterday": "Yesterday",
    "nav.week": "Previous 7 days",
    "nav.older": "Older",
    "nav.rename": "Rename",
    "nav.delete": "Delete",
    "nav.deleteConfirm": "Delete this chat permanently?",
    "nav.collapse": "Collapse sidebar",
    "nav.expand": "Expand sidebar",

    "greeting.morning": "Good morning",
    "greeting.afternoon": "Good afternoon",
    "greeting.evening": "Good evening",
    "home.headline": "What are you curious about?",
    "home.sub": "Pulls the news, watches videos, reads the web, understands images.",

    "suggest.news.label": "Latest news",
    "suggest.news.prompt": "Get the last 5 stories from BBC and tell me what they add up to",
    "suggest.video.label": "Summarise a video",
    "suggest.video.prompt": "Watch and summarise this YouTube video: ",
    "suggest.person.label": "Who is this?",
    "suggest.person.prompt": "Read this LinkedIn profile and tell me about them: ",
    "suggest.search.label": "Search the web",
    "suggest.search.prompt": "What happened in AI this week?",

    "composer.placeholder": "Ask anything…",
    "composer.placeholderEmpty": "Ask a question, drop an image, or paste a link…",
    "composer.send": "Send",
    "composer.stop": "Stop",
    "composer.attach": "Attach image",
    "composer.hint": "Enter to send, Shift + Enter for a new line",
    "composer.imageTooBig": "That image is too large (10 MB max).",
    "composer.imageOnly": "Only image files can be attached.",
    "composer.noVision": "{model} can't read images. Switch to a vision model.",
    "composer.remove": "Remove",

    "message.you": "You",
    "message.copy": "Copy",
    "message.copied": "Copied",
    "message.retry": "Retry",
    "message.thinking": "Thinking",
    "message.reasoning": "Reasoning",
    "message.error": "Couldn't get a response.",
    "message.stopped": "Stopped.",

    "tool.getNews.running": "Fetching headlines",
    "tool.getNews.done": "{count} stories · {publisher}",
    "tool.webSearch.running": "Searching the web",
    "tool.webSearch.done": "{count} results",
    "tool.readUrl.running": "Reading page",
    "tool.readUrl.done": "Page read",
    "tool.summarizeYouTube.running": "Watching the video",
    "tool.summarizeYouTube.done": "Video watched",
    "tool.getLinkedInProfile.running": "Looking up profile",
    "tool.getLinkedInProfile.done": "Profile found",
    "tool.failed": "Failed",

    "card.source.rss": "Official RSS feed",
    "card.source.google-news": "Google News",
    "card.source.exa": "Exa search",
    "card.source.duckduckgo": "DuckDuckGo",
    "card.tldr": "TL;DR",
    "card.keyPoints": "Key points",
    "card.timeline": "Chapters",
    "card.quote": "Worth quoting",
    "card.watchOn": "Watch on YouTube",
    "card.viewProfile": "Open profile",
    "card.otherMatches": "Other matches",
    "card.readMore": "Read more",

    "model.picker": "Choose model",
    "model.vision": "Vision",
    "model.fast": "Fast",
    "model.reasoning": "Reasoning",

    "account.guest": "Guest",
    "account.signIn": "Sign in",
    "account.signUp": "Create account",
    "account.signOut": "Sign out",
    "account.email": "Email",
    "account.password": "Password",
    "account.passwordHint": "At least 8 characters",
    "account.saveChats": "Keep your chats",
    "account.saveChatsHint":
      "You're browsing as a guest. Create an account and your existing chats carry over — reachable from any device.",
    "account.haveAccount": "Already have an account?",
    "account.noAccount": "No account yet?",
    "account.working": "One moment…",

    "theme.toggle": "Toggle theme",
    "lang.toggle": "Change language",

    "error.title": "Something went wrong",
    "error.retry": "Try again",
    "notFound.title": "That chat doesn't exist",
    "notFound.action": "Start a new chat",
  },
} as const;

export type TranslationKey = keyof (typeof dictionaries)["en"];

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = "lumen.locale";

export function I18nProvider({
  children,
  initialLocale = "tr",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "tr" || stored === "en") setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `lumen_locale=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const t = useCallback<I18nValue["t"]>(
    (key, vars) => {
      let text: string = dictionaries[locale][key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return context;
}
