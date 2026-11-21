"use client";

import { Controller, useWatch } from "react-hook-form";

import { postReview } from "@/server/actions/social";
import { MessageField } from "@/components/forms/message-field";
import { HugeiconsIcon, StarIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { useActionForm } from "@/hooks/use-action-form";
import { useLocale } from "@/lib/i18n/provider";
import { REVIEW_MAX_LENGTH } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import {
  reviewSchema,
  type ReviewFormValues,
} from "@/lib/validations/review-form";

const STARS = [1, 2, 3, 4, 5] as const;

/** A short buzz, like a native control (Android; iOS ignores it). */
const buzz = (ms: number | number[] = 8) => navigator.vibrate?.(ms);

/**
 * Writing (or editing) your review of a business, as a message bar: a 1–5
 * star row over the message bar (`MessageField`), whose send button shows once
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
  const { form, submit, pending, t } = useActionForm<
    ReviewFormValues,
    undefined
  >({
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
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "relative size-9 rounded-full before:absolute before:-inset-1 before:content-['']",
                  )}
                >
                  <HugeiconsIcon
                    icon={StarIcon}
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

      <MessageField
        control={form.control}
        name="text"
        me={me}
        label={t("Your review")}
        placeholder={t("What do you think of this place?")}
        maxLength={REVIEW_MAX_LENGTH}
        countFrom={REVIEW_MAX_LENGTH - 200}
        fieldRef={fieldRef}
        editing={editing ? t("Editing your review") : undefined}
        onCancel={onCancel}
        // Like Instagram: send shows once you've picked a star.
        canSend={rating > 0}
        sendLabel={t("Post review")}
        pending={pending}
      />
    </form>
  );
}
