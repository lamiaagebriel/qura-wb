"use client";

import { useState } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { ReplyForm } from "@/components/forms/reply-form";
import { BubbleChatIcon, HugeiconsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLocale } from "@/lib/i18n/provider";

/**
 * "Write a reply": a bottom sheet with one text field. Signed out, it
 * opens the sign-in sheet instead.
 */
export function ReplyButton({
  postId,
  signedIn,
}: {
  postId: string;
  signedIn: boolean;
}) {
  const { t } = useLocale();
  const { open: signIn } = useAuthSheet();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        size="xl"
        className="w-full rounded-xl"
        onClick={() => (signedIn ? setOpen(true) : signIn())}
      >
        <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} />
        {t("Write a reply")}
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-[max(var(--safe-bottom),1rem)]">
          <DrawerHeader>
            <DrawerTitle className="text-base">
              {t("Write a reply")}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {t("Your reply")}
            </DrawerDescription>
          </DrawerHeader>
          <ReplyForm
            postId={postId}
            onDone={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
