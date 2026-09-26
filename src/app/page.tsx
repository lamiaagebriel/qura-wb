import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "@/lib/i18n/server";

export default async function Home() {
  const { t, locale, dir } = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-6 py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          {t("Qura — Your city, one feed")}
        </h1>
        <p className="text-lg leading-8 text-foreground/70">
          {t(
            "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Aswan, expanding worldwide.",
          )}
        </p>
        <p className="text-foreground/70">{t("Hi {{name}},", { name: "Qura" })}</p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-foreground/60">
          {t("Language")}
        </span>
        <LocaleSwitcher />
        <code className="font-mono text-xs text-foreground/50">
          lang=&quot;{locale}&quot; dir=&quot;{dir}&quot;
        </code>
      </div>
    </main>
  );
}
