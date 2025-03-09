import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Paths } from "@/constants/utils";

import { getDictionary } from "@/servers/locale";
import { getAuth } from "@/lib/auth";

import { Separator } from "@/components/ui/separator";
import { SettingsAppearanceForm } from "@/components/settings-appearance-form";

type AppearanceProps = Readonly<{}>;
export const metadata = async (): Promise<Metadata> => {
  const dic = await getDictionary();
  const c = dic["dashboard"]["settings"]["appearance"];

  return { title: c["appearance"] };
};
export default async function Appearance({}: AppearanceProps) {
  const { user } = await getAuth();
  if (!user) redirect(Paths.Login);

  const dic = await getDictionary();
  const c = dic["dashboard"]["settings"]["appearance"];
  const cmn = dic["cmn"];

  return (
    <main className="flex-1">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {c["appearance"]}
            </h2>
            <p className="max-w-prose text-sm text-muted-foreground">
              {c["customize your appearance settings and preferences."]}
            </p>
          </div>
        </div>

        <Separator className="my-4" />
      </div>

      <div>
        <SettingsAppearanceForm />
      </div>
    </main>
  );
}
