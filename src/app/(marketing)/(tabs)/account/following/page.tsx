import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { getGuardedUser } from "@/lib/auth/guard";
import { getActiveIdentity } from "@/lib/identity/active";
import { getLocale } from "@/lib/i18n/actions";
import { getFollowing } from "@/lib/profile/queries";

import { FollowList } from "../follow-list";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Following")} — Qura` };
}

export default async function FollowingPage() {
  const user = await getGuardedUser();
  if (!user) redirect("/login");

  const [{ t }, identity] = await Promise.all([
    getLocale(),
    getActiveIdentity(),
  ]);
  // A business identity always follows nobody (see `followAction`'s
  // ownership check), so this naturally comes back empty when viewing
  // one — expected, not a bug.
  const following = await getFollowing(identity!.id);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={t("Following")} />
      <div className="container px-4">
        <FollowList
          // Every row here is, by definition, someone this account already
          // follows.
          users={following.map((f) => ({ ...f, isFollowedByMe: true }))}
          emptyLabel={t("You're not following anyone yet.")}
        />
      </div>
    </div>
  );
}
