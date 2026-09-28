import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { PostSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/** Home while loading: the feed's shape, shown instantly on tap. */
export default async function HomeLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Qura")} large />
      <SkeletonBody label={t("Loading")} className="divide-y divide-border/60">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </SkeletonBody>
    </Screen>
  );
}
