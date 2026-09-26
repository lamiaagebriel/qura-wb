"use client";

import "./globals.css";

import { Alert02Icon, HugeiconsIcon, RefreshIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

// Replaces the root layout when the layout itself fails, so there are no
// providers (locale, theme) here — the message is shown in all three languages.
const MESSAGES = [
  { lang: "en", dir: "ltr", title: "Something went wrong", retry: "Try again" },
  { lang: "ar", dir: "rtl", title: "حدث خطأ ما", retry: "حاول مرة أخرى" },
  { lang: "fr", dir: "ltr", title: "Une erreur s'est produite", retry: "Réessayer" },
] as const;

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 font-sans text-foreground antialiased">
        <title>Qura</title>
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          {MESSAGES.map((m) => (
            <p key={m.lang} lang={m.lang} dir={m.dir} className="font-medium">
              {m.title}
            </p>
          ))}
        </div>
        <Button size="xl" className="w-full max-w-xs rounded-xl" onClick={() => retry()}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          {MESSAGES.map((m) => m.retry).join(" · ")}
        </Button>
      </body>
    </html>
  );
}
