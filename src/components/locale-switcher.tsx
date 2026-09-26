"use client";

import { LOCALE_META, LOCALES } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/provider";

export function LocaleSwitcher() {
  const { locale, setLocale, isPending, t } = useLocale();

  return (
    <div
      role="radiogroup"
      aria-label={t("Select language")}
      aria-busy={isPending}
      className="inline-flex gap-1 rounded-full border border-foreground/10 p-1 aria-busy:opacity-60"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === locale}
          disabled={isPending}
          onClick={() => l !== locale && setLocale(l)}
          className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/5 aria-checked:bg-foreground aria-checked:text-background"
        >
          {LOCALE_META[l].label}
        </button>
      ))}
    </div>
  );
}
