"use client";

import { Controller, useWatch } from "react-hook-form";

import { ArrowUp01Icon, Cancel01Icon, HugeiconsIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { useActionForm } from "@/hooks/use-action-form";
import { useLocale } from "@/lib/i18n/provider";
import { POST_MAX_LENGTH } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { replySchema, type ReplyFormValues } from "@/lib/validations/reply-form";
import { replyToPost, updatePost } from "@/server/actions/posts";

// The counter shows once a reply gets this close to the limit.
const COUNT_FROM = POST_MAX_LENGTH - 100;

/**
 * Writing a reply (or editing one of yours), as a message bar: your photo
 * and a rounded field whose send button shows once there's text. Where it
 * sits is the caller's (`ReplyComposer`).
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
  const { locale } = useLocale();
  const { form, submit, pending, t } = useActionForm<ReplyFormValues, undefined>({
    schema: replySchema,
    defaultValues: { body: editing?.body ?? "" },
    action: (values) =>
      editing ? updatePost(editing.id, { body: values.body, data: {} }) : replyToPost(postId, values),
    success: editing ? "Reply updated" : "Reply posted",
    onDone: () => {
      form.reset({ body: "" });
      onDone();
    },
  });
  const body = useWatch({ control: form.control, name: "body" });
  const length = body.length;
  const number = new Intl.NumberFormat(locale);

  return (
    <form
      aria-label={editing ? t("Edit your reply") : t("Write a reply")}
      className="flex items-end gap-2"
      onSubmit={submit}
      data-keep-keyboard
    >
      <Avatar className="mb-0.5 size-9 shrink-0">
        <AvatarImage src={me.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{me.name}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-muted ring-1 ring-foreground/5">
        {editing && (
          <div className="flex items-center justify-between border-b border-border/60 ps-4">
            <span className="text-xs text-muted-foreground">{t("Editing your reply")}</span>
            <button
              type="button"
              aria-label={t("Cancel")}
              onClick={onCancel}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-11 rounded-none text-muted-foreground")}
            >
              <HugeiconsIcon icon={Cancel01Icon} />
            </button>
          </div>
        )}
        {length >= COUNT_FROM && (
          <span
            aria-live="polite"
            className={cn(
              "px-3.5 pt-1.5 text-end text-[0.6875rem] text-muted-foreground tabular-nums",
              length >= POST_MAX_LENGTH && "text-destructive",
            )}
          >
            {t("{{count}} / {{max}}", { count: number.format(length), max: number.format(POST_MAX_LENGTH) })}
          </span>
        )}
        <div className="flex items-end">
          <Controller
            control={form.control}
            name="body"
            render={({ field }) => (
              <textarea
                {...field}
                ref={(el) => {
                  field.ref(el);
                  fieldRef.current = el;
                }}
                placeholder={t("Write a reply…")}
                aria-label={t("Your reply")}
                dir="auto"
                rows={1}
                maxLength={POST_MAX_LENGTH}
                enterKeyHint="send"
                autoComplete="off"
                className="field-sizing-content max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-3.5 py-2 leading-6 outline-none placeholder:text-muted-foreground"
              />
            )}
          />
          {/* Like Instagram: the send button shows once there's text. */}
          {body.trim() && (
            <Button
              type="submit"
              size="icon"
              aria-label={editing ? t("Save reply") : t("Post reply")}
              className="m-1 size-8 shrink-0 rounded-full"
              disabled={pending}
            >
              <HugeiconsIcon icon={ArrowUp01Icon} />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
