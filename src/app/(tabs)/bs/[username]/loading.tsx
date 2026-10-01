import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { BusinessProfileSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** A business profile while loading. The name isn't known yet, so the bar shows no title. */
export default async function BusinessLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title="" back={href("search")} />
      <SkeletonBody label={t("Loading")} className="gap-4 pt-2">
        <BusinessProfileSkeleton />
      </SkeletonBody>
    </Screen>
  );
}
