import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, ListCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Profile while loading: avatar + name, handle and counts, the buttons,
 * then the settings list.
 */
export default async function ProfileLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Profile")} large />
      <SkeletonBody label={t("Loading")} className="gap-4 pt-2">
        <div className="flex items-center gap-4">
          <Bone className="size-20 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Bone className="h-5 w-40" />
            <Bone className="h-3.5 w-32" />
            <Bone className="mt-1 h-3.5 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Bone className="h-11 rounded-xl" />
          <Bone className="h-11 rounded-xl" />
        </div>
        <div className="mt-4">
          <ListCardSkeleton rows={5} />
        </div>
      </SkeletonBody>
    </Screen>
  );
}
