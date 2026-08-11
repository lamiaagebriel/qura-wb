import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CopyLinkButton } from "@/components/copy-link-button";
import { AppHeader } from "@/components/app-header";
import { getCurrentUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";
import {
  getFollowCounts,
  getUserByUsername,
  isFollowing,
} from "@/lib/profile/queries";

import { ProfileTabs } from "@/app/(marketing)/(tabs)/profile-tabs";
import { ProfileFollowStats } from "./follow-profile-button";

type ProfilePageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  return { title: user ? `${user.name} (@${user.username}) — Qura` : "Qura" };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const [viewer, { t }, profileUser] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getUserByUsername(username),
  ]);

  if (!profileUser) notFound();

  // Your own public profile URL is just your own profile — send you to the
  // richer `/account` view (Edit/Settings, no Follow button) instead of
  // duplicating it here.
  if (viewer?.id === profileUser.id) {
    redirect("/account");
  }

  const [{ followers, following }, alreadyFollowing] = await Promise.all([
    getFollowCounts(profileUser.id),
    viewer ? isFollowing(viewer.id, profileUser.id) : Promise.resolve(false),
  ]);

  const shareUrl = `${process.env.APP_URL ?? ""}/profile/${profileUser.username}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Reachable from lots of places (search, a thread's author link,
          a followers list, ...) with no single real "parent" — `/` is a
          safe, always-meaningful fallback rather than trusting browser
          history, which a fresh tab or a shared link has none of. */}
      <AppHeader title={`@${profileUser.username}`} backHref="/" />

      <div className="container flex flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-[20px] font-bold tracking-tight">
              {profileUser.name}
            </h2>
            {profileUser.bio && (
              <p className="text-foreground text-[13.5px] leading-relaxed whitespace-pre-line">
                {profileUser.bio}
              </p>
            )}
          </div>

          <Avatar size="lg" className="size-20!">
            <AvatarImage src={profileUser.image!} alt={profileUser.name} />
            <AvatarFallback>{profileUser.name}</AvatarFallback>
          </Avatar>
        </div>

        <ProfileFollowStats
          initialFollowerCount={followers}
          followingCount={following}
          userId={profileUser.id}
          initialIsFollowing={alreadyFollowing}
          isSignedIn={!!viewer}
          ownerBusinessId={
            profileUser.ownerId && profileUser.ownerId === viewer?.id
              ? profileUser.id
              : undefined
          }
          shareButton={
            <CopyLinkButton
              value={shareUrl}
              copyLabel={t("Share profile")}
              copiedLabel={t("Link copied")}
              successToast={t("Profile link copied to clipboard.")}
              variant="outline"
              className="flex-1"
            />
          }
        />
      </div>

      <ProfileTabs
        userId={profileUser.id}
        currentUserId={viewer?.id}
        stickyTop={50}
      />
    </div>
  );
}
