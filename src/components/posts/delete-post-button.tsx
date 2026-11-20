"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Delete02Icon, HugeiconsIcon } from "@/components/icons";
import { overlaysSettled } from "@/components/navigation/use-back-to-close";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";

import { deletePost } from "@/server/actions/posts";

/**
 * Deletes your post or reply, confirmed in a sheet.
 * - Full-width (edit screen): done, it replaces the screen with `then`.
 * - `icon` (on your reply): a trash button; the screen stays and the reply
 *   drops out of it.
 */
export function DeletePostButton({
  id,
  then,
  reply = false,
  icon = false,
  className,
}: {
  id: string;
  then?: string;
  reply?: boolean;
  icon?: boolean;
  className?: string;
}) {
  const { run, t } = useAction();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);
  // Staying on the screen: the delete waits for the sheet to close, as it
  // takes the reply (and this button) off the screen.
  const [queued, setQueued] = useState(false);

  const remove = async () => {
    if (!then) {
      setQueued(true);
      return;
    }
    await run(() => deletePost(id), {
      success: reply ? "Reply deleted" : "Post deleted",
      refresh: false,
      onDone: () => setDeleted(true),
    });
  };

  useEffect(() => {
    if (!queued || confirm) return;
    overlaysSettled().then(() =>
      run(() => deletePost(id), {
        success: reply ? "Reply deleted" : "Post deleted",
        onError: () => setQueued(false),
      }),
    );
    // `run` is a new function each render; the effect only waits for the sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queued, confirm, id, reply]);

  // Leave once the sheet has closed and its history entry is gone (or
  // that back would land on this screen again).
  useEffect(() => {
    if (!deleted || confirm || !then) return;
    overlaysSettled().then(() => router.replace(then));
  }, [deleted, confirm, router, then]);

  const label = reply ? t("Delete reply") : t("Delete post");

  return (
    <>
      {icon ? (
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={label}
          className={cn(
            "size-11 rounded-full text-muted-foreground",
            className,
          )}
          onClick={() => setConfirm(true)}
        >
          <HugeiconsIcon icon={Delete02Icon} />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="xl"
          className={cn(
            "w-full rounded-xl text-destructive",
            className,
          )}
          onClick={() => setConfirm(true)}
        >
          <HugeiconsIcon icon={Delete02Icon} />
          {label}
        </Button>
      )}
      <ConfirmSheet
        open={confirm}
        onOpenChange={setConfirm}
        title={reply ? t("Delete this reply?") : t("Delete this post?")}
        description={
          reply
            ? t("This can't be undone.")
            : t("Its replies will be deleted too. This can't be undone.")
        }
        confirmLabel={t("Delete")}
        destructive
        onConfirm={remove}
      />
    </>
  );
}
