"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Delete02Icon, HugeiconsIcon } from "@/components/icons";
import { overlaysSettled } from "@/components/navigation/use-back-to-close";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

import { deletePost } from "./post-actions";

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
  const { t } = useLocale();
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
    const result = await deletePost(id);
    if (!result.ok) {
      toast.add({ title: t(result.error), type: "error" });
      return;
    }
    toast.add({ title: reply ? t("Reply deleted") : t("Post deleted") });
    setDeleted(true);
  };

  useEffect(() => {
    if (!queued || confirm) return;
    overlaysSettled().then(async () => {
      const result = await deletePost(id);
      toast.add(
        result.ok
          ? { title: reply ? t("Reply deleted") : t("Post deleted") }
          : { title: t(result.error), type: "error" },
      );
      if (!result.ok) setQueued(false);
    });
  }, [queued, confirm, id, reply, t]);

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
          aria-label={label}
          className={cn(
            "size-11 rounded-full text-muted-foreground",
            className,
          )}
          onClick={() => setConfirm(true)}
        >
          <HugeiconsIcon
            icon={Delete02Icon}
            strokeWidth={2}
            className="size-5"
          />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="xl"
          className={cn(
            "w-full rounded-xl text-base text-destructive",
            className,
          )}
          onClick={() => setConfirm(true)}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
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
