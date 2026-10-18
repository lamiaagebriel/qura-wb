import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, PostCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** Posts while loading: the city and filter row, then a few post cards. */
export default async function PostsLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader
        title={t("Posts")}
        large
        back={href("home")}
        action={<Bone className="size-11 rounded-full" />}
      />
      <SkeletonBody label={t("Loading")} className="gap-3 pt-1">
        <div className="flex items-center justify-between">
          <Bone className="h-3.5 w-24" />
          <Bone className="h-9 w-28 rounded-full" />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </SkeletonBody>
    </Screen>
  );
}
