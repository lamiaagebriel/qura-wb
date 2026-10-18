import { ParentHeader } from "@/components/navigation/parent-header";
import { Screen } from "@/components/navigation/screen";
import { Bone, SkeletonBody } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Reviews while loading: the business row, the summary card, the star
 * chips, then a few reviews as comments.
 */
export default async function BusinessReviewsLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      {/* Back to this business, read from the address. */}
      <ParentHeader title={t("Reviews")} />
      <SkeletonBody label={t("Loading")} className="gap-4 pt-2">
        <div className="flex items-center gap-3">
          <Bone className="size-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Bone className="h-4 w-36" />
            <Bone className="h-3.5 w-28" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-5 rounded-2xl p-4 ring-1 ring-foreground/5">
            <div className="flex flex-col items-center gap-2">
              <Bone className="h-9 w-12" />
              <Bone className="h-3 w-20" />
              <Bone className="h-3 w-14" />
            </div>
            <div className="flex flex-1 flex-col gap-2.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Bone key={i} className="h-1.5 w-full" />
              ))}
            </div>
          </div>
          <div className="flex gap-2 py-1">
            {Array.from({ length: 4 }, (_, i) => (
              <Bone key={i} className="h-9 w-14 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <Bone className="size-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Bone className="h-3 w-32" />
                <Bone className="h-3 w-16" />
                <Bone className="h-3.5 w-full" />
                <Bone className="h-3.5 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonBody>
    </Screen>
  );
}
