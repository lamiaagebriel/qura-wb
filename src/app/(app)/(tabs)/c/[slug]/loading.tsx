import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, ListCardSkeleton, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/** A category while loading: chips, then the business list. */
export default async function CategoryLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title="" back={href("search")} />
      <SkeletonBody label={t("Loading")} className="gap-4 pt-2">
        <div className="flex gap-2">
          {[16, 24, 20, 24].map((w, i) => (
            <Bone key={i} className="h-11 shrink-0 rounded-full" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        <ListCardSkeleton rows={4} />
      </SkeletonBody>
    </Screen>
  );
}
