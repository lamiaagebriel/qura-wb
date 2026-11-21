"use client";

import { useWatch } from "react-hook-form";

import { MessageField } from "@/components/forms/message-field";
import { useActionForm } from "@/hooks/use-action-form";
import { POST_MAX_LENGTH } from "@/lib/posts";
import {
  replySchema,
  type ReplyFormValues,
} from "@/lib/validations/reply-form";
import { replyToPost, updatePost } from "@/server/actions/posts";

/**
 * Writing a reply (or editing one of yours), as a message bar
 * (`MessageField`): the send button shows once there's text. Where it sits
 * is the caller's (`ReplyComposer`).
 */
export function ReplyForm({
  postId,
  editing,
  me,
  fieldRef,
  onDone,
  onCancel,
}: {
  postId: string;
  /** Your reply being edited (else a new one). */
  editing: { id: string; body: string } | null;
  me: { name: string; avatarUrl: string | null };
  fieldRef: React.RefObject<HTMLTextAreaElement | null>;
  onDone: () => void;
  /** Stop editing (the × on "Editing your reply"). */
  onCancel: () => void;
}) {
  const { form, submit, pending, t } = useActionForm<
    ReplyFormValues,
    undefined
  >({
    schema: replySchema,
    defaultValues: { body: editing?.body ?? "" },
    action: (values) =>
      editing
        ? updatePost(editing.id, { body: values.body, data: {} })
        : replyToPost(postId, values),
    success: editing ? "Reply updated" : "Reply posted",
    onDone: () => {
      form.reset({ body: "" });
      onDone();
    },
  });
  const body = useWatch({ control: form.control, name: "body" });

  return (
    <form
      aria-label={editing ? t("Edit your reply") : t("Write a reply")}
      onSubmit={submit}
      data-keep-keyboard
    >
      <MessageField
        control={form.control}
        name="body"
        me={me}
        label={t("Your reply")}
        placeholder={t("Write a reply…")}
        maxLength={POST_MAX_LENGTH}
        fieldRef={fieldRef}
        editing={editing ? t("Editing your reply") : undefined}
        onCancel={onCancel}
        canSend={!!body.trim()}
        sendLabel={editing ? t("Save reply") : t("Post reply")}
        pending={pending}
      />
    </form>
  );
}
