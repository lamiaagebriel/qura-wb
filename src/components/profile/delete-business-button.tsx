"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Delete02Icon, HugeiconsIcon } from "@/components/icons";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";

import { deleteBusiness } from "./business-actions";

/**
 * "Delete business" under the edit form: confirms first (it can't be
 * undone), then deletes and replaces the screen with My businesses — the
 * edit screen no longer exists, so it isn't kept in history.
 */
export function DeleteBusinessButton({
  username,
  name,
}: {
  username: string;
  name: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Leave once the sheet's own history entry is gone: closing it calls
  // `history.back()` (`use-back-to-close`), which lands asynchronously and
  // would undo a navigation made before it.
  useEffect(() => {
    if (!deleted || open) return;
    let done = false;
    const leave = () => {
      if (done) return;
      done = true;
      router.replace(href("businesses"));
    };
    window.addEventListener("popstate", leave, { once: true });
    const fallback = setTimeout(leave, 400);
    return () => {
      window.removeEventListener("popstate", leave);
      clearTimeout(fallback);
    };
  }, [deleted, open, router]);

  return (
    <>
      <Button
        type="button"
        size="xl"
        variant="ghost"
        className="w-full rounded-xl text-base text-destructive"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        {t("Delete business")}
      </Button>
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Delete “{{name}}”?", { name })}
        description={t(
          "Its page, branches, followers and reviews will be deleted. This can't be undone.",
        )}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={async () => {
          const result = await deleteBusiness(username);
          if (!result.ok) {
            toast.add({ title: t(result.error), type: "error" });
            return;
          }
          toast.add({ title: t("Business deleted") });
          setDeleted(true);
        }}
      />
    </>
  );
}
