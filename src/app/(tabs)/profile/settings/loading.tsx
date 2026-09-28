import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { ListCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** Settings while loading: the grouped settings list. */
export default async function SettingsLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Settings")} back={href("profile")} />
      <SkeletonBody label={t("Loading")} className="py-4">
        <ListCardSkeleton rows={4} />
      </SkeletonBody>
    </Screen>
  );
}
