"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch, type Path } from "react-hook-form";

import { TextareaField, TextField, UsernameField } from "@/components/form";
import { HugeiconsIcon, PencilEdit02Icon } from "@/components/icons";
import { canGoBack } from "@/components/navigation/history";
import { updateProfile } from "@/components/profile/profile-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { initials } from "@/lib/format";
import { useLocale } from "@/lib/i18n/provider";
import {
  AVATARS,
  avatarUrl,
  BIO_MAX_LENGTH,
  profileSchema,
  type ProfileFormValues,
} from "@/lib/profile";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * Edit your personal profile: the avatar (your Google photo or a preset
 * character), name, @handle and bio. Saved by `updateProfile`.
 */
export function EditProfileForm({
  initial,
  googlePhoto,
}: {
  initial: ProfileFormValues;
  /** Your Google photo, offered first among the avatars (if any). */
  googlePhoto: string | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initial,
    mode: "onTouched",
  });
  const { control } = form;

  const submit = form.handleSubmit(async (values) => {
    (document.activeElement as HTMLElement | null)?.blur();
    const result = await updateProfile(values);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([path, message], i) =>
        form.setError(
          path as Path<ProfileFormValues>,
          { message },
          { shouldFocus: i === 0 },
        ),
      );
      if (result.form) toast.add({ title: t(result.form), type: "error" });
      return;
    }
    toast.add({ title: t("Changes saved") });
    if (canGoBack()) router.back();
    else router.replace(href("profile"));
  });

  // Your current photo stays a choice even if it's no longer your Google one.
  const photos = [
    ...new Set(
      [googlePhoto, initial.image].filter(
        (url): url is string => !!url && !url.startsWith("/avatars/"),
      ),
    ),
  ];

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-6 pt-2 pb-8"
    >
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <Controller
          control={control}
          name="image"
          render={({ field }) => (
            <AvatarPicker
              value={field.value}
              onChange={field.onChange}
              photos={photos}
              control={control}
            />
          )}
        />
        <NameLine control={control} />
      </div>

      <FieldGroup className="gap-6">
        <TextField
          control={control}
          name="name"
          label={t("Name")}
          autoComplete="name"
          enterKeyHint="next"
          maxLength={50}
        />
        <UsernameField
          control={control}
          name="username"
          label={t("Username")}
        />
        <TextareaField
          control={control}
          name="bio"
          label={t("Bio (optional)")}
          dir="auto"
          rows={3}
          maxLength={BIO_MAX_LENGTH}
          enterKeyHint="done"
          autoComplete="off"
        />
      </FieldGroup>

      <Button
        type="submit"
        size="xl"
        className="w-full rounded-xl text-base"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && <Spinner />}
        {t("Save changes")}
      </Button>
    </form>
  );
}

type FormControl = ReturnType<typeof useForm<ProfileFormValues>>["control"];

/**
 * The avatar as it will look; tapping it opens a sheet with the choices
 * (your photo, then the drawn faces). Picking one closes the sheet.
 */
function AvatarPicker({
  value,
  onChange,
  photos,
  control,
}: {
  value: string | null;
  onChange: (url: string) => void;
  photos: string[];
  control: FormControl;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const name = useWatch({ control, name: "name" });
  const pick = (url: string) => {
    onChange(url);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("Change avatar")}
        onClick={() => setOpen(true)}
        className="relative rounded-full"
      >
        <Avatar className="size-24 ring-1 ring-foreground/10">
          {value && (
            <AvatarImage src={value} alt="" referrerPolicy="no-referrer" />
          )}
          <AvatarFallback className="bg-primary/10 text-3xl font-semibold text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-e-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-3 ring-background">
          <HugeiconsIcon
            icon={PencilEdit02Icon}
            strokeWidth={2}
            className="size-4"
          />
        </span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        {/* No description: the title says it all. */}
        <DrawerContent
          aria-describedby={undefined}
          className="pb-[max(var(--safe-bottom),1rem)]"
        >
          <DrawerHeader>
            <DrawerTitle className="text-base">
              {t("Choose an avatar")}
            </DrawerTitle>
          </DrawerHeader>
          <div
            role="radiogroup"
            aria-label={t("Avatar")}
            className="grid grid-cols-4 justify-items-center gap-4 overflow-y-auto px-4 pt-2 pb-4"
          >
            {photos.map((url) => (
              <AvatarChoice
                key={url}
                src={url}
                label={t("Your photo")}
                checked={value === url}
                onSelect={() => pick(url)}
              />
            ))}
            {AVATARS.map(({ id, label }) => (
              <AvatarChoice
                key={id}
                src={avatarUrl(id)}
                label={t(label)}
                checked={value === avatarUrl(id)}
                onSelect={() => pick(avatarUrl(id))}
              />
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

/** The name and @handle, as they'll show on your profile. */
function NameLine({ control }: { control: FormControl }) {
  const [name, username] = useWatch({ control, name: ["name", "username"] });
  return (
    <div className="flex min-w-0 flex-col">
      <span dir="auto" className="truncate font-semibold">
        {name}
      </span>
      {username && (
        <span dir="ltr" className="truncate text-sm text-muted-foreground">
          @{username}
        </span>
      )}
    </div>
  );
}

function AvatarChoice({
  src,
  label,
  checked,
  onSelect,
}: {
  src: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        "size-16 overflow-hidden rounded-full ring-offset-2 ring-offset-background transition-shadow",
        checked ? "ring-3 ring-primary" : "ring-1 ring-foreground/10",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny, local or Google-hosted */}
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className="size-full object-cover"
      />
    </button>
  );
}
