"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { HugeiconsIcon, StarIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import {
  REVIEW_MAX_LENGTH,
  reviewSchema,
  type ReviewInput,
} from "@/lib/reviews";
import { cn } from "@/lib/utils";

import { postReview } from "./social-actions";

const STARS = [1, 2, 3, 4, 5] as const;
const EMPTY: ReviewInput = { rating: 0, text: "" };

/**
 * A visitor's "Write a review": opens a bottom sheet with a 1–5 star
 * picker and an optional comment. Posting needs at least a star. With a
 * review already written, the sheet opens on it and posting replaces it.
 * Signed out, it opens the sign-in sheet instead.
 */
export function WriteReviewButton({
  businessName,
  username,
  signedIn,
  mine,
}: {
  businessName: string;
  username: string;
  signedIn: boolean;
  /** The review the signed-in user already wrote, if any. */
  mine?: ReviewInput;
}) {
  const { t, locale } = useLocale();
  const { open: signIn } = useAuthSheet();
  const [open, setOpen] = useState(false);
  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: mine ?? EMPTY,
  });
  const rating = useWatch({ control: form.control, name: "rating" });
  const number = new Intl.NumberFormat(locale);

  const post = form.handleSubmit(async (values) => {
    (document.activeElement as HTMLElement | null)?.blur();
    const result = await postReview(username, values);
    if (!result.ok) {
      toast.add({ title: t(result.error), type: "error" });
      return;
    }
    setOpen(false);
    form.reset(values);
    toast.add({ title: t("Thanks for your review!") });
  });
  const title = mine ? t("Edit your review") : t("Write a review");

  return (
    <>
      <Button
        variant="secondary"
        size="xl"
        className="w-full rounded-xl"
        onClick={() => (signedIn ? setOpen(true) : signIn())}
      >
        <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
        {title}
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-[max(var(--safe-bottom),1rem)]">
          <DrawerHeader>
            <DrawerTitle className="text-base">{title}</DrawerTitle>
            <DrawerDescription dir="auto">{businessName}</DrawerDescription>
          </DrawerHeader>

          <form className="flex flex-col gap-4 px-4 pt-2" onSubmit={post}>
            <Controller
              control={form.control}
              name="rating"
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-label={t("Your rating")}
                  className="flex justify-center gap-1"
                >
                  {STARS.map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={field.value === star}
                      aria-label={t("{{rating}} out of 5 stars", {
                        rating: number.format(star),
                      })}
                      onClick={() => field.onChange(star)}
                      className="flex size-12 items-center justify-center rounded-full"
                    >
                      <HugeiconsIcon
                        icon={StarIcon}
                        strokeWidth={1.5}
                        className={cn(
                          "size-9 transition-colors",
                          star <= field.value
                            ? "fill-current text-amber-500"
                            : "text-muted-foreground/40",
                        )}
                      />
                    </button>
                  ))}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="text"
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder={t("Tell others about your visit (optional)")}
                  aria-label={t("Your review")}
                  dir="auto"
                  rows={4}
                  maxLength={REVIEW_MAX_LENGTH}
                  enterKeyHint="done"
                  autoComplete="off"
                  className="min-h-28 resize-none"
                />
              )}
            />

            <DrawerFooter className="flex-col gap-3 p-0">
              <Button
                type="submit"
                size="xl"
                className="w-full rounded-2xl text-base"
                disabled={!rating || form.formState.isSubmitting}
              >
                {t("Post review")}
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
