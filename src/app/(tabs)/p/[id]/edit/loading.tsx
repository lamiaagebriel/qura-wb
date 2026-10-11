import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, PostFormSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** Edit post while loading: the text box, Save, then Delete. */
export default async function EditPostLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Edit post")} back={href("home")} />
      <SkeletonBody label={t("Loading")} className="gap-3 pt-2">
        <PostFormSkeleton types={false} />
        <Bone className="mx-auto h-4 w-28" />
      </SkeletonBody>
    </Screen>
  );
}
