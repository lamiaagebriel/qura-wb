import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { getGuardedUser } from "@/lib/auth/guard";
import { getActiveIdentity } from "@/lib/identity/active";
import { getLocale } from "@/lib/i18n/actions";
import { getFollowers, isFollowing } from "@/lib/profile/queries";

import { FollowList } from "../follow-list";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Followers")} — Qura` };
}

export default async function FollowersPage() {
  const user = await getGuardedUser();
  if (!user) redirect("/login");

  const [{ t }, identity] = await Promise.all([getLocale(), getActiveIdentity()]);
  // Whose followers this list is — the active identity's, business or
  // not. "Follow back" is checked against the *real* account, though:
  // that's who'd actually do the following (a business never can), same
  // fallback rule as everywhere else this distinction shows up.
  const followers = await getFollowers(identity!.id);
  const followingBack = await Promise.all(
    followers.map((f) => isFollowing(user.id, f.id)),
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("Followers")} />
      <div className="container px-4">
        <FollowList
          users={followers.map((f, i) => ({ ...f, isFollowedByMe: followingBack[i] }))}
          emptyLabel={t("No followers yet.")}
        />
      </div>
    </div>
  );
}
