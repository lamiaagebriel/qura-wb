"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { TextareaField } from "@/components/form";
import { BubbleChatIcon, HugeiconsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import { POST_MAX_LENGTH, replySchema } from "@/lib/posts";

import { replyToPost } from "./post-actions";

type ReplyInput = { body: string };

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
  const form = useForm<ReplyInput>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: "" },
  });

  const send = form.handleSubmit(async (values) => {
    (document.activeElement as HTMLElement | null)?.blur();
    const result = await replyToPost(postId, values);
    if (!result.ok) {
      toast.add({ title: t(result.error), type: "error" });
      return;
    }
    setOpen(false);
    form.reset({ body: "" });
    toast.add({ title: t("Reply posted") });
  });

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
          <form className="flex flex-col gap-4 px-4 pt-2" onSubmit={send}>
            <TextareaField
              control={form.control}
              name="body"
              label={<span className="sr-only">{t("Your reply")}</span>}
              placeholder={t("Your reply")}
              dir="auto"
              rows={4}
              maxLength={POST_MAX_LENGTH}
              autoComplete="off"
              enterKeyHint="enter"
              className="min-h-28"
            />
            <DrawerFooter className="flex-col gap-3 p-0">
              <Button
                type="submit"
                size="xl"
                className="w-full rounded-2xl text-base"
                disabled={form.formState.isSubmitting}
                aria-busy={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Spinner />}
                {t("Reply")}
              </Button>
              <Button
                type="button"
                size="xl"
                variant="secondary"
                className="w-full rounded-2xl text-base"
                onClick={() => setOpen(false)}
              >
                {t("Cancel")}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
