import {
  expect,
  recordTransitions,
  tab,
  test,
  transitionOf,
  waitForHydration,
} from "./fixtures";

// Which animations actually run for each navigation, per language and
// motion preference. Forward: the new screen enters from the end edge
// (right in LTR, left in RTL); back: from the start edge.
for (const lang of ["en", "ar"] as const) {
  for (const reduced of [false, true]) {
    test.describe(`${lang}${reduced ? ", reduced motion" : ""}`, () => {
      test.use({ reducedMotion: reduced ? "reduce" : "no-preference" });

      test("forward, back and tab transitions", async ({ page, context, setLang }) => {
        await recordTransitions(context);
        await setLang(lang);
        await page.goto("/profile");
        await waitForHydration(page);
        const gear = page.locator(`a[aria-label="${lang === "ar" ? "الإعدادات" : "Settings"}"]`);
        const back = page.locator(`[aria-label="${lang === "ar" ? "رجوع" : "Back"}"]`);

        const forward = await transitionOf(page, async () => {
          await gear.tap();
          await page.waitForURL("**/profile/settings");
        });
        const backward = await transitionOf(page, async () => {
          await back.tap();
          await page.waitForURL(/\/profile$/);
        });
        const tabSwitch = await transitionOf(page, async () => {
          await tab(page, "/").tap();
          await page.waitForURL((url) => url.pathname === "/");
        });

        const layer = (list: typeof forward, which: "new" | "old") =>
          list.find((a) => a.layer === which);

        if (reduced) {
          expect(forward.map((a) => a.name).sort()).toEqual(["nav-fade-in", "nav-fade-out"]);
          expect(backward.map((a) => a.name).sort()).toEqual(["nav-fade-in", "nav-fade-out"]);
        } else {
          const end = lang === "ar" ? "-100%" : "100%";
          const start = lang === "ar" ? "100%" : "-100%";
          expect(layer(forward, "new")?.from).toBe(end);
          expect(layer(forward, "old")?.to).toBe(start);
          expect(layer(backward, "new")?.from).toBe(start);
          expect(layer(backward, "old")?.to).toBe(end);
        }
        expect(tabSwitch).toEqual([]);
      });
    });
  }
}
