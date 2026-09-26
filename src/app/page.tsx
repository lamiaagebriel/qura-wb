import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeSwitcher } from "@/components/mode-switcher";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTranslations } from "@/lib/i18n/server";

export default async function Home() {
  const { t, locale, dir } = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-24">
      <Card>
        <CardHeader>
          <CardTitle>{t("Qura — Your city, one feed")}</CardTitle>
          <CardDescription>
            {t(
              "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Aswan, expanding worldwide.",
            )}
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <ModeSwitcher />
              <LocaleSwitcher />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>{t("Hi {{name}},", { name: "Qura" })}</p>
          <code className="font-mono text-xs text-muted-foreground">
            lang=&quot;{locale}&quot; dir=&quot;{dir}&quot;
          </code>
        </CardContent>
      </Card>
    </main>
  );
}
