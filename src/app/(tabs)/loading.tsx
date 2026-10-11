import { AppHeader } from "@/components/app-header";
import { Screen } from "@/components/navigation/screen";
import { Bone } from "@/components/skeletons";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Home while loading, shown instantly on tap: the banner, type chips,
 * two offer cards, then feed rows.
 */
export default async function HomeLoading() {
  const { t } = await getTranslations();
  return (
    <Screen>
      <AppHeader
        title={t("Qura")}
        large
        action={<Bone className="h-8 w-24 rounded-full" />}
      />
      <main
        aria-busy
        className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 pt-1"
      >
        <span className="sr-only" role="status">
          {t("Loading")}
        </span>
        <div aria-hidden className="contents">
          <Bone className="mx-4 aspect-2/1 rounded-2xl" />
          <div className="flex gap-2 overflow-hidden px-4">
            {["w-24", "w-28", "w-32", "w-28"].map((width, i) => (
              <Bone key={i} className={`h-9 shrink-0 rounded-full ${width}`} />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Bone className="mx-4 h-5 w-28" />
            <div className="flex gap-3 overflow-hidden px-4">
              {[0, 1].map((i) => (
                <Bone key={i} className="h-37 w-64 shrink-0 rounded-3xl" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Bone className="mx-4 h-5 w-36" />
            <div className="divide-y divide-border/60 border-y border-border/60">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Bone className="size-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Bone className="h-3.5 w-32" />
                      <Bone className="h-3 w-20" />
                    </div>
                  </div>
                  <Bone className="h-3.5 w-full" />
                  <Bone className="h-3.5 w-3/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </Screen>
  );
}
