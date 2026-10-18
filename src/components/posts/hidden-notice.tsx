import { Alert02Icon, HugeiconsIcon } from "@/components/icons";
import { getTranslations } from "@/lib/i18n/server";
import type { Post } from "@/lib/posts";

/**
 * Above your own post or reply when an admin hid it: why, and what you can do —
 * edit it (an admin then looks again) or delete it. Only you see it.
 */
export async function HiddenNotice({
  post,
  reply = false,
}: {
  post: Post;
  /** Your hidden reply (under someone's post) rather than a post. */
  reply?: boolean;
}) {
  const { t } = await getTranslations();
  if (!post.hidden) return null;
  return (
    <div
      role="status"
      className="flex gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive"
    >
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          {post.hidden.waiting
            ? t("Hidden: an admin is looking at your edit")
            : reply
              ? t("Hidden by an admin: only you can see this reply")
              : t("Hidden by an admin: only you can see this post")}
        </p>
        {post.hidden.reason && (
          <p dir="auto" className="text-foreground">
            {post.hidden.reason}
          </p>
        )}
        {!post.hidden.waiting && (
          <p className="text-foreground">
            {t("Edit it to fix the problem, or delete it.")}
          </p>
        )}
      </div>
    </div>
  );
}
