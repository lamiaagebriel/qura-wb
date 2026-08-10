import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { getGuardedUser } from "@/lib/auth/guard";
import { getActiveIdentity } from "@/lib/identity/active";
import { getLocale } from "@/lib/i18n/actions";

import { BusinessProfileForm } from "./business-profile-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Business profile")} — Qura` };
}

/**
 * One page for both create and edit — which one you get isn't in the URL,
 * it follows the active identity (see `getActiveIdentity`): editing your
 * currently-active business if you're viewing as one, otherwise creating
 * a new one. `ProfileSwitcher`'s "Add a business profile" row clears the
 * active identity before linking here specifically so it always lands on
 * create, never accidentally on editing whatever was active before.
 */
export default async function BusinessProfilePage() {
  const user = await getGuardedUser();
  if (!user) redirect("/login");

  const [{ t }, identity] = await Promise.all([
    getLocale(),
    getActiveIdentity(),
  ]);
  const isEdit = !!identity?.isBusiness;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isEdit ? identity!.name : t("Create business profile")}
      />
      <div className="container px-4">
        <BusinessProfileForm
          mode={isEdit ? "edit" : "create"}
          businessId={isEdit ? identity!.id : undefined}
          defaultValues={
            isEdit
              ? {
                  name: identity!.name,
                  username: identity!.username,
                  bio: identity!.bio ?? "",
                }
              : { name: "", username: "", bio: "" }
          }
        />
      </div>
    </div>
  );
}
