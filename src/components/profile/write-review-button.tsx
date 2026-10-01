"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

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
import { cn } from "@/lib/utils";

const STARS = [1, 2, 3, 4, 5] as const;

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(1000),
});
type Review = z.infer<typeof reviewSchema>;
const EMPTY: Review = { rating: 0, text: "" };

/**
 * A visitor's "Write a review": opens a bottom sheet with a 1–5 star
 * picker and an optional comment. Posting needs at least a star.
 */
export function WriteReviewButton({ businessName }: { businessName: string }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const form = useForm<Review>({
    resolver: zodResolver(reviewSchema),
    defaultValues: EMPTY,
  });
  const rating = useWatch({ control: form.control, name: "rating" });
  const number = new Intl.NumberFormat(locale);

  const post = form.handleSubmit(() => {
    // TODO: save the review (reviews table) once reviews are stored.
    (document.activeElement as HTMLElement | null)?.blur();
    setOpen(false);
    form.reset(EMPTY);
    toast.add({ title: t("Thanks for your review!") });
  });

  return (
    <>
      <Button
        variant="secondary"
        size="xl"
        className="w-full rounded-xl"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
        {t("Write a review")}
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-[max(var(--safe-bottom),1rem)]">
          <DrawerHeader>
            <DrawerTitle className="text-base">
              {t("Write a review")}
            </DrawerTitle>
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
                  maxLength={1000}
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
                disabled={!rating}
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
