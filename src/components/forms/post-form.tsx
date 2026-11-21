"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldError,
  type UseFormSetValue,
} from "react-hook-form";

import { FormError, INPUT } from "@/components/forms/form-error";
import {
  PhotosField,
  photoSlots,
  uploadPhotos,
  type PhotoSlot,
} from "@/components/forms/photos-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { canGoBack } from "@/components/navigation/history";
import { PlaceField } from "@/components/places/place-field";
import { createPost, updatePost } from "@/server/actions/posts";
import { PostAsPicker } from "@/components/posts/post-as-picker";
import { TypeSelect } from "@/components/posts/type-select";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useActionForm } from "@/hooks/use-action-form";
import { useLocale } from "@/lib/i18n/provider";
import {
  BUSINESS_TYPES,
  typesFor,
  POST_MAX_LENGTH,
  PRICE_MAX_LENGTH,
  type Post,
  type PostType,
  type PostingBusiness,
  type PostingUser,
} from "@/lib/posts";
import {
  postSchema,
  type PostFormValues,
  type PostInput,
} from "@/lib/validations/post-form";

/**
 * Writing a post (its own screen): who it's from (you, or one of your
 * businesses), what type it is — the types follow the account (`typesFor`):
 * switching to one that can't post the current type picks its first — the
 * text, and an offer's price / last day. Photos (up to 4) are picked here and
 * uploaded when it's sent. With `editing`, it edits that
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
  photos = false,
}: {
  /** You, for "Post as" (new posts). */
  me?: PostingUser | null;
  businesses: PostingBusiness[];
  defaultKind?: PostType;
  editing?: Post;
  /** Where a new post goes at first: the place being browsed. */
  place?: string;
  back: string;
  /** Photo storage is set up (`storageReady`): show the photo picker. */
  photos?: boolean;
}) {
  const router = useRouter();
  const [slots, setSlots] = useState<PhotoSlot[]>(() =>
    photoSlots(editing?.images ?? []),
  );
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
    images: [],
  };
  // The form keeps strings; the schema turns them into the post.
  const { form, submit, pending, t } = useActionForm<
    PostFormValues,
    unknown,
    PostInput
  >({
    schema: postSchema,
    defaultValues: editing
      ? {
          type: editing.type,
          // A post stays where it was posted.
          city: "",
          // Kept as posted; only checked by the schema.
          business:
            editing.author.type === "business" ? editing.author.username : "",
          body: editing.body,
          images: editing.images,
          data: Object.fromEntries(
            Object.entries(editing.data).map(([key, value]) => [
              key,
              String(value ?? ""),
            ]),
          ),
        }
      : empty,
    // The photos upload first (while "Posting…"), then the post takes their URLs.
    action: async (values) => {
      const uploaded = await uploadPhotos(slots);
      if (!uploaded.ok) return uploaded;
      const post = { ...values, images: uploaded.data };
      return editing ? updatePost(editing.id, post) : createPost(post);
    },
    success: editing ? "Post updated" : "Posted!",
    onDone: () => (canGoBack() ? router.back() : router.replace(back)),
  });
  const type = useWatch({ control: form.control, name: "type" });
  const business = useWatch({ control: form.control, name: "business" });
  const types = typesFor(!!business);
  // A reply has only its text (its type is the post's).
  const isReply = !!editing?.replyTo;
  // The schema checks the photos before they upload (an ad needs one), so
  // the form keeps their previews too; the action swaps in the uploaded URLs.
  const pickPhotos = (next: PhotoSlot[]) => {
    setSlots(next);
    form.setValue(
      "images",
      next.map((slot) => (slot.kind === "uploaded" ? slot.url : slot.preview)),
      { shouldValidate: form.formState.isSubmitted },
    );
  };

  /** Posting as someone else: keep the type if they can post it. */
  const postAs = (next: string) => {
    form.setValue("business", next);
    const open = typesFor(!!next);
    if (!open.includes(form.getValues("type"))) form.setValue("type", open[0]);
  };

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

      {photos && !isReply && (
        <Field data-invalid={!!form.formState.errors.images}>
          <PhotosField slots={slots} onChange={pickPhotos} disabled={pending} />
          <FormError
            error={form.formState.errors.images as FieldError | undefined}
          />
        </Field>
      )}

      {type === "ad" && !isReply && (
        <AdFields control={form.control} setValue={form.setValue} />
      )}

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
        className="w-full rounded-xl"
        disabled={pending}
        aria-busy={pending}
      >
        {pending && <Spinner />}
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

/**
 * An ad's own fields: the days it's shown on home (from, until) and where a
 * tap goes — your business's profile, or a link (one button group).
 */
function AdFields({
  control,
  setValue,
}: {
  control: Control<PostFormValues, unknown, PostInput>;
  setValue: UseFormSetValue<PostFormValues>;
}) {
  const { t } = useLocale();
  const link = useWatch({ control, name: "data.link" });
  const [toLink, setToLink] = useState(!!link);
  const today = toDateInput(new Date());

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {(["startsOn", "endsOn"] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={`data.${name}`}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`ad-${name}`}>
                  {name === "startsOn" ? t("Shown from") : t("Until")}
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={`ad-${name}`}
                  type="date"
                  min={today}
                  className={INPUT}
                />
                <FormError error={fieldState.error} />
              </Field>
            )}
          />
        ))}
      </div>

      <Field>
        <FieldLabel>{t("Opens")}</FieldLabel>
        <ButtonGroup className="w-full">
          {[false, true].map((mode) => (
            <Button
              key={String(mode)}
              type="button"
              variant={toLink === mode ? "default" : "outline"}
              aria-pressed={toLink === mode}
              className="h-11 flex-1 first:rounded-s-xl last:rounded-e-xl"
              onClick={() => {
                setToLink(mode);
                if (!mode) setValue("data.link", "");
              }}
            >
              {mode ? t("A link") : t("Your profile")}
            </Button>
          ))}
        </ButtonGroup>
      </Field>
      {toLink && (
        <Controller
          control={control}
          name="data.link"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                value={field.value ?? ""}
                type="url"
                dir="ltr"
                inputMode="url"
                placeholder="https://"
                aria-label={t("A link")}
                autoComplete="off"
                className={INPUT}
              />
              <FormError error={fieldState.error} />
            </Field>
          )}
        />
      )}
    </div>
  );
}
