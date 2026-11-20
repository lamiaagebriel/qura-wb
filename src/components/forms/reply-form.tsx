"use client";

import { TextareaField } from "@/components/forms/textarea-field";
import { replyToPost } from "@/components/posts/post-actions";
import { Button } from "@/components/ui/button";
import { DrawerFooter } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { useActionForm } from "@/hooks/use-action-form";
import { POST_MAX_LENGTH } from "@/lib/posts";
import { replySchema, type ReplyFormValues } from "@/lib/validations/reply-form";

/** A reply to a post: one text field. Its sheet is the caller's (`onDone`, `onCancel`). */
export function ReplyForm({
  postId,
  onDone,
  onCancel,
}: {
  postId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { form, submit, pending, t } = useActionForm<ReplyFormValues, undefined>({
    schema: replySchema,
    defaultValues: { body: "" },
    action: (values) => replyToPost(postId, values),
    success: "Reply posted",
    onDone,
  });

  return (
    <form className="flex flex-col gap-4 px-4 pt-2" onSubmit={submit}>
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
          disabled={pending}
          aria-busy={pending}
        >
          {pending && <Spinner />}
          {t("Reply")}
        </Button>
        <Button
          type="button"
          size="xl"
          variant="secondary"
          className="w-full rounded-2xl text-base"
          onClick={onCancel}
        >
          {t("Cancel")}
        </Button>
      </DrawerFooter>
    </form>
  );
}
