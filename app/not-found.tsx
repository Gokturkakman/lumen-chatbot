import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative z-10 grid min-h-dvh place-items-center px-6">
      <div className="max-w-sm text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink">
          Burada bir şey yok
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Aradığın sohbet silinmiş ya da sana ait değil.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
        >
          Yeni sohbet başlat
        </Link>
      </div>
    </main>
  );
}
