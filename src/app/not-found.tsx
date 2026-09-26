import type { Metadata } from "next";
import Link from "next/link";

import { FileNotFoundIcon, HugeiconsIcon, Home01Icon } from "@/components/icons";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Page not found") };
}

/** Unknown URLs and every `notFound()` call (e.g. `requireAdmin()`). */
export default async function NotFound() {
  const { t } = await getTranslations();

  return (
    <StatusScreen
      icon={FileNotFoundIcon}
      title={t("Page not found")}
      description={t("This page doesn't exist or has moved.")}
    >
      <Button
        size="xl"
        className="w-full rounded-xl"
        nativeButton={false}
        render={<Link href={href("home")} />}
      >
        <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
        {t("Go to home")}
      </Button>
    </StatusScreen>
  );
}
