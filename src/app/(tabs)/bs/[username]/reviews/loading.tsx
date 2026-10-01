import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/**
 * Reviews while loading: the business brief, the summary card, the
 * "Write a review" button, then a few reviews.
 */
export default async function BusinessReviewsLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader title={t("Reviews")} back={href("search")} />
      <SkeletonBody label={t("Loading")} className="gap-3 pt-2">
        <div className="flex flex-col items-center gap-2.5 rounded-2xl p-4 ring-1 ring-foreground/5">
          <Bone className="size-16 rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <Bone className="h-4.5 w-40" />
            <Bone className="h-3.5 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl p-4 ring-1 ring-foreground/5">
          <div className="flex flex-col items-center gap-2">
            <Bone className="h-9 w-12" />
            <Bone className="h-3 w-20" />
            <Bone className="h-3 w-14" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} className="h-1.5 w-full" />
            ))}
          </div>
        </div>
        <Bone className="h-11 w-full rounded-xl" />
        <div className="divide-y divide-border/60 rounded-2xl px-4 ring-1 ring-foreground/5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 py-4">
              <div className="flex items-center gap-2.5">
                <Bone className="size-9 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Bone className="h-3.5 w-28" />
                  <Bone className="h-3 w-24" />
                </div>
              </div>
              <Bone className="h-3.5 w-full" />
              <Bone className="h-3.5 w-3/5" />
            </div>
          ))}
        </div>
      </SkeletonBody>
    </Screen>
  );
}
