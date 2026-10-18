import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { PostCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** My posts while loading: a few post cards. */
export default async function MyPostsLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("My posts")} back={href("profile")} />
      <SkeletonBody label={t("Loading")} className="gap-3 pt-2">
        {Array.from({ length: 3 }, (_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </SkeletonBody>
    </Screen>
  );
}
