import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { HugeiconsIcon, Search01Icon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { StatusScreen } from "@/components/status-screen";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Search"), alternates: { canonical: href("search") } };
}

export default async function SearchPage() {
  const { t } = await getTranslations();

  return (
    <Screen>
      <AppHeader title={t("Search")} large>
        <InputGroup className="h-11 rounded-xl">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            name="q"
            placeholder={t("Search Qura")}
            aria-label={t("Search Qura")}
            enterKeyHint="search"
          />
        </InputGroup>
      </AppHeader>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <StatusScreen
          icon={Search01Icon}
          title={t("Search Qura")}
          description={t("Find places, events and people in your city.")}
          inline
        />
      </main>
    </Screen>
  );
}
