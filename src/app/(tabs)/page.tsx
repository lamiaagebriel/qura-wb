import { AppHeader } from "@/components/app-header";
import { Home01Icon } from "@/components/icons";
import { StatusScreen } from "@/components/status-screen";
import { getTranslations } from "@/lib/i18n/server";

export default async function HomePage() {
  const { t } = await getTranslations();

  return (
    <>
      <AppHeader title={t("Qura")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <StatusScreen
          icon={Home01Icon}
          title={t("Your feed is coming soon")}
          description={t(
            "Posts from places and people in your city will show up here.",
          )}
          inline
        />
      </main>
    </>
  );
}
