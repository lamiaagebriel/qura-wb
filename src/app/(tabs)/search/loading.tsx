import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, ListCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/** Search while loading: the field and the recent-searches list. */
export default async function SearchLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Search")} large>
        <Bone className="h-11 w-full rounded-xl" />
      </AppHeader>
      <SkeletonBody label={t("Loading")} className="gap-2 py-4">
        <Bone className="ms-1 h-3 w-28" />
        <ListCardSkeleton rows={4} />
      </SkeletonBody>
    </Screen>
  );
}
