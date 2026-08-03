import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Relative time like "3 dk önce" / "3m ago", falling back to a date. */
export function formatRelative(
  input: string | Date | null | undefined,
  locale: "tr" | "en"
): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (locale === "tr") {
    if (seconds < 60) return "az önce";
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} sa önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  }

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long" });
}

/** Groups chats into Today / Yesterday / Last 7 days / Older buckets. */
export function groupByDate<T extends { updatedAt: string | Date }>(
  items: T[]
): { key: "today" | "yesterday" | "week" | "older"; items: T[] }[] {
  const buckets: Record<string, T[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  const dayMs = 86_400_000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  for (const item of items) {
    const time = new Date(item.updatedAt).getTime();

    if (time >= todayMs) buckets.today.push(item);
    else if (time >= todayMs - dayMs) buckets.yesterday.push(item);
    else if (time >= todayMs - 7 * dayMs) buckets.week.push(item);
    else buckets.older.push(item);
  }

  return (["today", "yesterday", "week", "older"] as const)
    .map((key) => ({ key, items: buckets[key] }))
    .filter((group) => group.items.length > 0);
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};
