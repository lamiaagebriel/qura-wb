import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, ListCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Profile while loading: avatar (with its edit badge), name, handle and
 * count; then the three groups — what you run, what you posted and kept,
 * the app — and Sign out.
 */
export default async function ProfileLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Profile")} large />
      <SkeletonBody label={t("Loading")} className="gap-6 pt-2 pb-8">
        <div className="flex items-center gap-4 pb-1">
          <div className="relative shrink-0">
            <Bone className="size-20 rounded-full" />
            <Bone className="absolute -end-0.5 -bottom-0.5 size-7 rounded-full ring-2 ring-background" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Bone className="h-5 w-40" />
            <Bone className="h-3.5 w-32" />
            <Bone className="mt-1 h-3.5 w-24" />
          </div>
        </div>
        <ListCardSkeleton rows={2} />
        <ListCardSkeleton rows={2} />
        <ListCardSkeleton rows={4} />
        <Bone className="h-11 w-full rounded-xl" />
      </SkeletonBody>
    </Screen>
  );
}
