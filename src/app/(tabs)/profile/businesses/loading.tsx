import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, ListCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** My businesses while loading: the list, then the add button. */
export default async function MyBusinessesLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("My businesses")} back={href("profile")} />
      <SkeletonBody label={t("Loading")} className="gap-4 pt-2">
        <ListCardSkeleton rows={2} />
        <Bone className="h-11 rounded-xl" />
      </SkeletonBody>
    </Screen>
  );
}
