"use client";

import { Controller, useWatch } from "react-hook-form";

import { postReview } from "@/server/actions/social";
import { ArrowUp01Icon, Cancel01Icon, HugeiconsIcon, StarIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useActionForm } from "@/hooks/use-action-form";
import { useLocale } from "@/lib/i18n/provider";
import { REVIEW_MAX_LENGTH } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import { reviewSchema, type ReviewFormValues } from "@/lib/validations/review-form";

const STARS = [1, 2, 3, 4, 5] as const;
// The counter shows once a review gets this close to the limit.
const COUNT_FROM = REVIEW_MAX_LENGTH - 200;

/** A short buzz, like a native control (Android; iOS ignores it). */
const buzz = (ms: number | number[] = 8) => navigator.vibrate?.(ms);

/**
 * Writing (or editing) your review of a business, as a message bar: a 1–5
 * star row, your photo and a rounded field whose send button shows once
 * you've picked a star. Where it sits is the caller's (`ReviewComposer`).
 */
export function ReviewForm({
  username,
  editing,
  me,
  businessName,
  initial,
  fieldRef,
  onDone,
  onCancel,
}: {
  username: string;
  /** Editing your review (else writing one). */
  editing: boolean;
  me: { name: string; avatarUrl: string | null };
  businessName: string;
  initial: ReviewFormValues;
  fieldRef: React.RefObject<HTMLTextAreaElement | null>;
  onDone: () => void;
  /** Stop editing (the × on "Editing your review"). */
  onCancel: () => void;
}) {
  const { locale } = useLocale();
  const { form, submit, pending, t } = useActionForm<ReviewFormValues, undefined>({
    schema: reviewSchema,
    defaultValues: initial,
    action: (values) => postReview(username, values),
    success: editing ? "Review updated" : "Thanks for your review!",
    onDone: () => {
      buzz([10, 40, 10]);
      onDone();
    },
  });
  const rating = useWatch({ control: form.control, name: "rating" });
  const length = useWatch({ control: form.control, name: "text" }).length;
  const number = new Intl.NumberFormat(locale);

  return (
    <form
      aria-label={editing ? t("Edit your review") : t("Write a review")}
      className="flex flex-col gap-1"
      onSubmit={submit}
      data-keep-keyboard
    >
      {/* The star row, where Instagram has its quick emoji. */}
      <Controller
        control={form.control}
        name="rating"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label={t("Your rating")}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              {STARS.map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={field.value === star}
                  aria-label={t("{{rating}} out of 5 stars", {
                    rating: number.format(star),
                  })}
                  onClick={() => {
                    buzz();
                    field.onChange(star);
                  }}
                  // Looks 36px; the ::before keeps the tap area at 44px.
                  className="relative flex size-9 items-center justify-center rounded-full before:absolute before:-inset-1 before:content-['']"
                >
                  <HugeiconsIcon
                    icon={StarIcon}
                    strokeWidth={1.5}
                    className={cn(
                      "size-6 transition-[color,scale] active:scale-90",
                      star <= field.value
                        ? "fill-current text-amber-500"
                        : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
            <span
              dir="auto"
              className="min-w-0 truncate pe-1 text-xs text-muted-foreground"
            >
              {businessName}
            </span>
          </div>
        )}
      />

      <div className="flex items-end gap-2">
        <Avatar className="mb-0.5 size-9 shrink-0">
          <AvatarImage src={me.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{me.name}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-muted ring-1 ring-foreground/5">
          {editing && (
            <div className="flex items-center justify-between border-b border-border/60 ps-4">
              <span className="text-xs text-muted-foreground">
                {t("Editing your review")}
              </span>
              <button
                type="button"
                aria-label={t("Cancel")}
                onClick={onCancel}
                className="flex size-11 items-center justify-center text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </button>
            </div>
          )}
          {length >= COUNT_FROM && (
            <span
              aria-live="polite"
              className={cn(
                "px-3.5 pt-1.5 text-end text-[0.6875rem] text-muted-foreground tabular-nums",
                length >= REVIEW_MAX_LENGTH && "text-destructive",
              )}
            >
              {t("{{count}} / {{max}}", {
                count: number.format(length),
                max: number.format(REVIEW_MAX_LENGTH),
              })}
            </span>
          )}
          <div className="flex items-end">
            <Controller
              control={form.control}
              name="text"
              render={({ field }) => (
                <textarea
                  {...field}
                  ref={(el) => {
                    field.ref(el);
                    fieldRef.current = el;
                  }}
                  placeholder={t("What do you think of this place?")}
                  aria-label={t("Your review")}
                  dir="auto"
                  rows={1}
                  maxLength={REVIEW_MAX_LENGTH}
                  enterKeyHint="send"
                  autoComplete="off"
                  className="field-sizing-content max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-3.5 py-2 leading-6 outline-none placeholder:text-muted-foreground"
                />
              )}
            />
            {/* Like Instagram: the send button shows once there's a star. */}
            {rating > 0 && (
              <Button
                type="submit"
                size="icon"
                aria-label={t("Post review")}
                className="m-1 size-8 shrink-0 rounded-full"
                disabled={pending}
              >
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  strokeWidth={2.5}
                  className="size-4"
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
