"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";

import { FormError, INPUT, TextareaField } from "@/components/form";
import { PlaceField } from "@/components/places/place-field";
import { Button } from "@/components/ui/button";
import { canGoBack } from "@/components/navigation/history";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import {
  BUSINESS_TYPES,
  typesFor,
  POST_MAX_LENGTH,
  PRICE_MAX_LENGTH,
  postSchema,
  type Post,
  type PostFormValues,
  type PostInput,
  type PostType,
  type PostingBusiness,
  type PostingUser,
} from "@/lib/posts";

import { TypeSelect } from "./type-select";
import { PostAsPicker } from "./post-as-picker";
import { createPost, updatePost } from "./post-actions";

/**
 * Writing a post (its own screen): who it's from (you, or one of your
 * businesses), what type it is — the types follow the account (`typesFor`):
 * switching to one that can't post the current type picks its first — the
 * text, and an offer's price / last day. With `editing`, it edits that
 * post's text and details (type and author stay). Done, it goes back to
 * the screen it was opened from (`back` on a deep link).
 */
export function PostForm({
  me = null,
  businesses,
  defaultKind = "general",
  editing,
  place = "",
  back,
}: {
  /** You, for "Post as" (new posts). */
  me?: PostingUser | null;
  businesses: PostingBusiness[];
  defaultKind?: PostType;
  editing?: Post;
  /** Where a new post goes at first: the place being browsed. */
  place?: string;
  back: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  // A business-only type (the + on Jobs…) starts as your first business.
  const startAs =
    !typesFor(false).includes(defaultKind) &&
    BUSINESS_TYPES.includes(defaultKind)
      ? (businesses[0]?.username ?? "")
      : "";
  const empty: PostFormValues = {
    type: typesFor(!!startAs).includes(defaultKind)
      ? defaultKind
      : typesFor(!!startAs)[0],
    city: place,
    business: startAs,
    body: "",
    data: {},
  };
  const form = useForm<PostFormValues, unknown, PostInput>({
    // The form keeps strings; the schema turns them into the post.
    resolver: zodResolver(postSchema) as Resolver<
      PostFormValues,
      unknown,
      PostInput
    >,
    defaultValues: editing
      ? {
          type: editing.type,
          // A post stays where it was posted.
          city: "",
          // Kept as posted; only checked by the schema.
          business:
            editing.author.type === "business" ? editing.author.username : "",
          body: editing.body,
          data: Object.fromEntries(
            Object.entries(editing.data).map(([key, value]) => [
              key,
              String(value ?? ""),
            ]),
          ),
        }
      : empty,
  });
  const type = useWatch({ control: form.control, name: "type" });
  const business = useWatch({ control: form.control, name: "business" });
  const types = typesFor(!!business);
  // A reply has only its text (its type is the post's).
  const isReply = !!editing?.replyTo;

  /** Posting as someone else: keep the type if they can post it. */
  const postAs = (next: string) => {
    form.setValue("business", next);
    const open = typesFor(!!next);
    if (!open.includes(form.getValues("type"))) form.setValue("type", open[0]);
  };

  const submit = form.handleSubmit(async (values) => {
    (document.activeElement as HTMLElement | null)?.blur();
    const result = editing
      ? await updatePost(editing.id, values)
      : await createPost(values);
    if (!result.ok) {
      toast.add({ title: t(result.error), type: "error" });
      return;
    }
    toast.add({ title: editing ? t("Post updated") : t("Posted!") });
    if (canGoBack()) router.back();
    else router.replace(back);
  });

  return (
    <form className="flex flex-col gap-5 pt-2 pb-8" onSubmit={submit}>
      {!editing && businesses.length > 0 && (
        <Controller
          control={form.control}
          name="business"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{t("Post as")}</FieldLabel>
              <PostAsPicker
                label={t("Post as")}
                me={me}
                businesses={businesses}
                allowMe
                value={field.value}
                onChange={postAs}
              />
              <FormError error={fieldState.error} />
            </Field>
          )}
        />
      )}

      {!editing && place && (
        <Controller
          control={form.control}
          name="city"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="post-place">{t("Where")}</FieldLabel>
              <PlaceField
                id="post-place"
                value={field.value}
                label={t("Where")}
                onChange={field.onChange}
              />
            </Field>
          )}
        />
      )}

      {!editing && (
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="post-type">{t("What is it?")}</FieldLabel>
              <TypeSelect
                id="post-type"
                label={t("What is it?")}
                types={types}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
              />
              <FormError error={fieldState.error} />
            </Field>
          )}
        />
      )}

      <TextareaField
        control={form.control}
        name="body"
        label={isReply ? t("Your reply") : t("Your post")}
        placeholder={
          isReply
            ? t("Your reply")
            : t(
                type === "question"
                  ? "What would you like to ask?"
                  : "What's happening in your city?",
              )
        }
        dir="auto"
        rows={5}
        maxLength={POST_MAX_LENGTH}
        autoComplete="off"
        enterKeyHint="enter"
        className="min-h-32"
      />

      {type === "offer" && !isReply && (
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="data.price"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="post-price">
                  {t("Price or discount")}
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="post-price"
                  dir="auto"
                  placeholder={t("e.g. 20% off")}
                  maxLength={PRICE_MAX_LENGTH}
                  autoComplete="off"
                  enterKeyHint="next"
                  className={INPUT}
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="data.endsOn"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="post-ends">{t("Valid until")}</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="post-ends"
                  type="date"
                  min={toDateInput(new Date())}
                  className={INPUT}
                />
              </Field>
            )}
          />
        </div>
      )}

      <Button
        type="submit"
        size="xl"
        className="w-full rounded-xl text-base"
        disabled={form.formState.isSubmitting}
        aria-busy={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && <Spinner />}
        {editing ? t("Save") : t("Post")}
      </Button>
    </form>
  );
}

/** yyyy-mm-dd in local time, for `<input type="date">`. */
function toDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
