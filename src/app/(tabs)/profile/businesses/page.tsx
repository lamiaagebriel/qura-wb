import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { HugeiconsIcon, PlusSignIcon, Store01Icon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { StackLink } from "@/components/navigation/stack-link";
import { BusinessList } from "@/components/profile/business-list";
import { FAKE_MY_BUSINESSES } from "@/components/profile/fake-businesses";
import { StatusScreen } from "@/components/status-screen";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("My businesses"), robots: { index: false, follow: true } };
}

/** The businesses you manage; tap one to edit it, or add a new one. */
export default async function MyBusinessesPage() {
  const [{ t }] = await Promise.all([
    getTranslations(),
    requireUser(href("businesses")),
  ]);
  // TEMPORARY: fake businesses until businesses are stored.
  const businesses = FAKE_MY_BUSINESSES;

  const add = (
    <StackLink
      href={href("newBusiness")}
      className={cn(buttonVariants({ size: "xl" }), "w-full rounded-xl text-base")}
    >
      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      {t("Add a business")}
    </StackLink>
  );

  return (
    <Screen>
      <AppHeader title={t("My businesses")} back={href("profile")} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-2 pb-8">
        {businesses.length > 0 ? (
          <>
            <BusinessList businesses={businesses} editable />
            {add}
          </>
        ) : (
          <StatusScreen
            icon={Store01Icon}
            title={t("No businesses yet")}
            description={t("Add your business so people can find it.")}
            inline
          >
            {add}
          </StatusScreen>
        )}
      </main>
    </Screen>
  );
}
