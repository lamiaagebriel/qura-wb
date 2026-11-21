"use client";

import {
  Controller,
  useWatch,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { ArrowUp01Icon, Cancel01Icon, HugeiconsIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * The message field of a comment-like form (a reply, a review), like
 * Instagram's or WhatsApp's: one rounded group of your photo, a field that
 * grows with the text, and the send button. Editing, an "Editing…" row with
 * a × sits on top; near the limit, a counter. Edit it here and every
 * composer follows. The form (and its schema, `useActionForm`) is the
 * caller's; this is its text field and its submit.
 */
export function MessageField<T extends FieldValues>({
  control,
  name,
  me,
  label,
  placeholder,
  maxLength,
  countFrom = maxLength - 100,
  fieldRef,
  editing,
  onCancel,
  canSend,
  sendLabel,
  pending,
}: {
  control: Control<T>;
  /** The form's text field. */
  name: FieldPath<T>;
  me: { name: string; avatarUrl: string | null };
  label: string;
  placeholder: string;
  maxLength: number;
  /** The counter shows from this many characters. */
  countFrom?: number;
  /** Lets the caller focus the field ("Edit" on your reply). */
  fieldRef?: React.RefObject<HTMLTextAreaElement | null>;
  /** "Editing your reply": shows the row with its ×. */
  editing?: string;
  onCancel?: () => void;
  /** Whether the send button shows (text typed, a star picked…). */
  canSend: boolean;
  sendLabel: string;
  pending: boolean;
}) {
  const { t, locale } = useLocale();
  const text: string = useWatch({ control, name }) ?? "";
  const length = text.length;
  const number = new Intl.NumberFormat(locale);

  return (
    <ButtonGroup
      // One pill: photo · field · send (the inner corners are the group's).
      className="w-full items-end overflow-hidden rounded-3xl bg-muted ring-1 ring-foreground/5"
    >
      <span className="flex shrink-0 self-end p-1.5">
        <Avatar className="size-8">
          <AvatarImage src={me.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{me.name}</AvatarFallback>
        </Avatar>
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        {editing && (
          <div className="flex items-center justify-between border-b border-border/60">
            <span className="text-xs text-muted-foreground">{editing}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Cancel")}
              onClick={onCancel}
              className="size-11 rounded-none text-muted-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
            </Button>
          </div>
        )}
        {length >= countFrom && (
          <span
            aria-live="polite"
            className={cn(
              "pe-1 pt-1.5 text-end text-[0.6875rem] text-muted-foreground tabular-nums",
              length >= maxLength && "text-destructive",
            )}
          >
            {t("{{count}} / {{max}}", {
              count: number.format(length),
              max: number.format(maxLength),
            })}
          </span>
        )}
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <textarea
              {...field}
              ref={(el) => {
                field.ref(el);
                if (fieldRef) fieldRef.current = el;
              }}
              placeholder={placeholder}
              aria-label={label}
              dir="auto"
              rows={1}
              maxLength={maxLength}
              enterKeyHint="send"
              autoComplete="off"
              className="field-sizing-content max-h-24 min-h-11 min-w-0 resize-none bg-transparent px-1.5 py-2.5 leading-6 outline-none placeholder:text-muted-foreground"
            />
          )}
        />
      </div>

      {/* Like Instagram: the send button shows once it can be sent. */}
      {canSend && (
        <span className="flex shrink-0 self-end p-1.5">
          <Button
            type="submit"
            size="icon"
            aria-label={sendLabel}
            className="size-8 rounded-full"
            disabled={pending}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} />
          </Button>
        </span>
      )}
    </ButtonGroup>
  );
}
