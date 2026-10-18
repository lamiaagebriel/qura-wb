import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { ListCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** Place requests while loading: a few request cards. */
export default async function PlaceRequestsLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Place requests")} back={href("profile")} />
      <SkeletonBody label={t("Loading")} className="gap-3 pt-2">
        {Array.from({ length: 3 }, (_, i) => (
          <ListCardSkeleton key={i} />
        ))}
      </SkeletonBody>
    </Screen>
  );
}
