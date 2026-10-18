import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, PostCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** A post while loading: the post, "Write a reply", then two replies. */
export default async function PostLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Post")} back={href("home")} />
      <SkeletonBody label={t("Loading")} className="gap-3 pt-2">
        <PostCardSkeleton />
        <Bone className="h-11 w-full rounded-xl" />
        <Bone className="mt-3 h-5 w-20" />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </SkeletonBody>
    </Screen>
  );
}
