"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { Account } from "@/components/app-shell";
import { CloseIcon, LogOutIcon, UserIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

export function AccountMenu({ account }: { account: Account }) {
  const { t } = useI18n();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="border-t border-rule p-3">
        {account.isGuest ? (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-inset"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-dashed border-rule-strong text-faint">
              <UserIcon size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">
                {t("account.guest")}
              </span>
              <span className="block truncate text-[11.5px] text-accent">
                {t("account.saveChats")} →
              </span>
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-semibold uppercase text-accent-ink">
              {account.email?.[0] ?? "U"}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
              {account.email}
            </span>
            <button
              type="button"
              onClick={signOut}
              aria-label={t("account.signOut")}
              title={t("account.signOut")}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-inset hover:text-ink"
            >
              <LogOutIcon size={14} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {dialogOpen && (
          <AuthDialog
            onClose={() => setDialogOpen(false)}
            onSuccess={() => {
              setDialogOpen(false);
              router.refresh();
              toast.success(t("account.signIn"));
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AuthDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? t("error.title"));
        return;
      }

      onSuccess();
    } catch {
      setError(t("error.title"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <motion.button
        type="button"
        aria-label="Close"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/25 backdrop-blur-[3px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-rule bg-raised shadow-pop"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-faint transition-colors hover:bg-sunken hover:text-ink"
        >
          <CloseIcon size={15} />
        </button>

        <div className="px-7 pb-7 pt-8">
          <h2 className="font-serif text-[26px] leading-tight text-ink">
            {mode === "register" ? t("account.saveChats") : t("account.signIn")}
          </h2>
          {mode === "register" && (
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {t("account.saveChatsHint")}
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <Field
              label={t("account.email")}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <Field
              label={t("account.password")}
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              hint={mode === "register" ? t("account.passwordHint") : undefined}
            />

            {error && (
              <p className="rounded-lg border border-rule bg-sunken px-3 py-2 text-[12.5px] text-negative">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !email || !password}
              className="h-11 w-full rounded-xl bg-accent text-[14px] font-medium text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy
                ? t("account.working")
                : mode === "register"
                  ? t("account.signUp")
                  : t("account.signIn")}
            </button>
          </form>

          <p className="mt-5 text-center text-[12.5px] text-muted">
            {mode === "register" ? t("account.haveAccount") : t("account.noAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "register" ? "login" : "register");
                setError(null);
              }}
              className="font-medium text-accent underline decoration-accent-rule underline-offset-2 hover:decoration-accent"
            >
              {mode === "register" ? t("account.signIn") : t("account.signUp")}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        value={value}
        required
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-rule bg-paper px-3.5 text-[14px] text-ink outline-none transition-colors focus:border-accent"
      />
      {hint && <span className="mt-1 block text-[11.5px] text-faint">{hint}</span>}
    </label>
  );
}
