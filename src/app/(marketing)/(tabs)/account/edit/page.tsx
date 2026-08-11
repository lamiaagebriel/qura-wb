import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { getGuardedUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";

import { EditProfileForm } from "./edit-profile-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Edit profile")} — Qura` };
}

export default async function EditProfilePage() {
  const user = await getGuardedUser();
  if (!user) redirect("/login");

  const { t } = await getLocale();

  return (
    <div className="flex flex-col gap-6">
      <AppHeader title={t("Edit profile")} />
      <div className="container px-4">
        <EditProfileForm
          defaultValues={{
            name: user.name,
            username: user.username,
            bio: user.bio ?? "",
          }}
        />
      </div>
    </div>
  );
}
