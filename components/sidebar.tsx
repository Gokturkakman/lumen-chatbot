"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Account } from "@/components/app-shell";
import { AccountMenu } from "@/components/account-menu";
import {
  CheckIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SidebarIcon,
  TrashIcon,
} from "@/components/icons";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { ChatSummary } from "@/lib/types";
import { cn, groupByDate } from "@/lib/utils";

const GROUP_LABELS: Record<string, TranslationKey> = {
  today: "nav.today",
  yesterday: "nav.yesterday",
  week: "nav.week",
  older: "nav.older",
};

export function Sidebar({
  open,
  animate,
  onToggle,
  onNavigate,
  chats,
  loading,
  activeChatId,
  onMutate,
  account,
}: {
  open: boolean;
  animate: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  chats: ChatSummary[];
  loading: boolean;
  activeChatId: string;
  onMutate: () => void;
  account: Account;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? chats.filter((chat) => chat.title.toLowerCase().includes(needle))
      : chats;
    return groupByDate(filtered);
  }, [chats, query]);

  async function remove(id: string) {
    if (!window.confirm(t("nav.deleteConfirm"))) return;

    const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(t("error.title"));
      return;
    }

    onMutate();
    if (id === activeChatId) router.push("/");
  }

  async function saveTitle(id: string) {
    const title = draftTitle.trim();
    setEditingId(null);
    if (!title) return;

    const res = await fetch(`/api/chats/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) onMutate();
    else toast.error(t("error.title"));
  }

  return (
    <>
      {/* Scrim for the mobile drawer. */}
      {open && (
        <button
          type="button"
          aria-label={t("nav.collapse")}
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={cn(
          "z-40 flex h-dvh shrink-0 flex-col border-r border-rule bg-sunken",
          "max-md:fixed max-md:inset-y-0 max-md:left-0",
          animate &&
            "transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "w-[272px]" : "w-0 border-r-0 max-md:-translate-x-full"
        )}
      >
        <div
          className={cn(
            "flex h-full w-[272px] flex-col overflow-hidden transition-opacity duration-200",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {/* ── Brand ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <Link
              href="/"
              onClick={onNavigate}
              className="group flex items-baseline gap-2"
            >
              <span className="font-serif text-[22px] leading-none tracking-tight text-ink">
                Lumen
              </span>
              <span className="h-[5px] w-[5px] translate-y-[-3px] rounded-full bg-accent transition-transform duration-300 group-hover:scale-150" />
            </Link>
            <button
              type="button"
              onClick={onToggle}
              aria-label={t("nav.collapse")}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-inset hover:text-ink"
            >
              <SidebarIcon size={17} />
            </button>
          </div>

          {/* ── New chat ──────────────────────────────────────────── */}
          <div className="px-4 pb-3">
            <Link
              href="/"
              onClick={onNavigate}
              className="group flex h-10 items-center gap-2.5 rounded-xl border border-rule bg-raised px-3.5 text-sm font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-all hover:border-accent-rule hover:shadow-card"
            >
              <PlusIcon
                size={16}
                className="text-accent transition-transform duration-300 group-hover:rotate-90"
              />
              {t("nav.newChat")}
            </Link>
          </div>

          {/* ── Search ────────────────────────────────────────────── */}
          <div className="px-4 pb-2">
            <div className="relative">
              <SearchIcon
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("nav.search")}
                className="h-9 w-full rounded-lg border border-transparent bg-inset/60 pl-8.5 pr-3 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-rule-strong focus:bg-raised"
              />
            </div>
          </div>

          {/* ── History ───────────────────────────────────────────── */}
          <nav className="scroll-slim min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
            {loading && chats.length === 0 && (
              <div className="space-y-1.5 px-1.5 pt-2">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="h-8 animate-[shimmer_1.8s_ease-in-out_infinite] rounded-lg bg-inset"
                    style={{ animationDelay: `${index * 90}ms` }}
                  />
                ))}
              </div>
            )}

            {!loading && groups.length === 0 && (
              <div className="px-3 pt-8 text-center">
                <p className="text-[13px] font-medium text-muted">
                  {query ? t("nav.noResults") : t("nav.empty")}
                </p>
                {!query && (
                  <p className="mt-1.5 text-xs leading-relaxed text-faint">
                    {t("nav.emptyHint")}
                  </p>
                )}
              </div>
            )}

            {groups.map((group) => (
              <section key={group.key} className="mb-3">
                <h2 className="eyebrow px-3 pb-1.5 pt-2.5">
                  {t(GROUP_LABELS[group.key])}
                </h2>

                <ul>
                  {group.items.map((chat) => {
                    const active = chat.id === activeChatId;
                    const editing = editingId === chat.id;

                    return (
                      <li key={chat.id} className="group/item relative">
                        {editing ? (
                          <div className="flex items-center gap-1 px-1.5 py-0.5">
                            <input
                              autoFocus
                              value={draftTitle}
                              onChange={(event) =>
                                setDraftTitle(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveTitle(chat.id);
                                if (event.key === "Escape") setEditingId(null);
                              }}
                              className="h-8 min-w-0 flex-1 rounded-lg border border-accent-rule bg-raised px-2.5 text-[13px] text-ink outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => saveTitle(chat.id)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-positive hover:bg-inset"
                            >
                              <CheckIcon size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-inset"
                            >
                              <CloseIcon size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/c/${chat.id}`}
                              onClick={onNavigate}
                              className={cn(
                                "flex h-8.5 items-center rounded-lg pl-3 pr-16 text-[13px] transition-colors",
                                active
                                  ? "bg-raised font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
                                  : "text-muted hover:bg-inset/70 hover:text-ink"
                              )}
                            >
                              {active && (
                                <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-accent" />
                              )}
                              <span className="truncate">{chat.title}</span>
                            </Link>

                            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/item:opacity-100">
                              <button
                                type="button"
                                aria-label={t("nav.rename")}
                                onClick={() => {
                                  setEditingId(chat.id);
                                  setDraftTitle(chat.title);
                                }}
                                className="grid h-6.5 w-6.5 place-items-center rounded-md text-faint transition-colors hover:bg-inset hover:text-ink"
                              >
                                <PencilIcon size={13} />
                              </button>
                              <button
                                type="button"
                                aria-label={t("nav.delete")}
                                onClick={() => remove(chat.id)}
                                className="grid h-6.5 w-6.5 place-items-center rounded-md text-faint transition-colors hover:bg-inset hover:text-negative"
                              >
                                <TrashIcon size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>

          <AccountMenu account={account} />
        </div>
      </aside>
    </>
  );
}
