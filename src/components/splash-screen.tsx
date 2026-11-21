import { Mark } from "@/components/brand-mark";
import { BRAND } from "@/lib/brand";
import { getTranslations } from "@/lib/i18n/server";

/**
 * The launch screen, like a phone app's: the app icon and name on the app
 * background, rendered with the page (so it's there before any script) and
 * faded out by CSS (`.splash`, globals.css). The root layout only renders
 * on a full load, so it shows each time the app is opened or reloaded,
 * never between screens. It never takes taps (tests and impatient thumbs).
 */
export async function SplashScreen() {
  const { t } = await getTranslations();
  return (
    <div
      aria-hidden
      className="splash pointer-events-none fixed inset-0 z-100 flex flex-col items-center justify-center gap-4 bg-background"
    >
      {/* Same icon as the home screen icon and the iOS launch image. */}
      <span
        className="flex size-24 items-center justify-center rounded-[1.4rem] shadow-lg shadow-foreground/10 dark:ring-1 dark:ring-white/15"
        style={{ background: BRAND.dark.background }}
      >
        <Mark size="68%" color={BRAND.dark.foreground} />
      </span>
      <span className="text-xl font-extrabold tracking-tight">{t("Qura")}</span>
    </div>
  );
}
