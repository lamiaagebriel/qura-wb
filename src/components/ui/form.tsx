"use client";

import { redirect } from "next/navigation";
import * as React from "react";

import {
  HandleServerActionOptions,
  SelectItem as SelectItemType,
  ServerActionError,
  ServerActionResult,
  ServerActionSuccess,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LabelPrimitive from "@radix-ui/react-label";
import { SelectProps } from "@radix-ui/react-select";
import { Slot } from "@radix-ui/react-slot";
import { format } from "date-fns";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  FormProviderProps,
  useFormContext,
  UseFormProps,
  useForm as useFormReactHook,
  UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";

import { cn, handleServerAction } from "@/lib/utils";
import { Validation, ValidationName, validations } from "@/lib/validations";
import { useTranslation } from "@/hooks/use-translation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { Calendar, CalendarProps } from "@/components/ui/calendar";
import { Input, InputProps } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPProps,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { useLocale } from "@/components/locale-provider";

type ExtendedUseForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
> = UseFormReturn<TFieldValues, TContext, TTransformedValues> & {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  disabled: boolean;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
>(): ExtendedUseForm<TFieldValues, TContext, TTransformedValues> {
  const form = useFormContext<TFieldValues, TContext, TTransformedValues>();

  return { ...form } as ExtendedUseForm<
    TFieldValues,
    TContext,
    TTransformedValues
  >;
}

type FormProps<T extends ValidationName, R> = {
  validation: T;
  useForm?: UseFormProps<Validation[T]>;
  onSubmit: (
    data: Validation[T]
  ) => Promise<ServerActionResult<R>> | Promise<ServerActionResult<R>>;
  infiniteLoading?: boolean;
  reset?: boolean;

  setOpenDialog?: React.Dispatch<React.SetStateAction<boolean>>;
} & Pick<HandleServerActionOptions<R>, "onError" | "onSuccess"> &
  Omit<
    React.DetailedHTMLProps<
      React.FormHTMLAttributes<HTMLFormElement>,
      HTMLFormElement
    >,
    "onSubmit"
  >;

const Form = <T extends ValidationName, R>({
  validation,
  onSubmit,
  onError,
  onSuccess,
  infiniteLoading = false,
  reset = false,
  setOpenDialog,
  useForm: useFormProps,
  ...props
}: FormProps<T, R>) => {
  const schema = validations?.[validation];

  const [loading, setLoading] = React.useState<boolean>(false);
  const [disabled, setDisabled] = React.useState<boolean>(false);

  const form = useFormReactHook<Validation[T]>({
    mode: "onBlur",
    resolver: zodResolver(schema),
    ...useFormProps,
  });

  return (
    <FormProvider
      {...{
        ...({
          ...form,
          loading,
          setLoading,
          disabled,
          setDisabled,
        } as ExtendedUseForm<Validation[T]>),
      }}
    >
      <form
        onSubmit={form?.handleSubmit(async (data) => {
          setLoading(true);
          await handleServerAction(onSubmit(data), {
            form,
            onError(_data) {
              onError?.(_data);
              setLoading(false);
            },
            onSuccess(_data) {
              onSuccess?.(_data);
              setLoading(infiniteLoading);
              setOpenDialog?.(infiniteLoading);

              if (reset) form?.reset();
              else form?.reset(data);
            },
          });
        })}
        {...props}
      />
    </FormProvider>
  );
};

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  const form = useForm<TFieldValues>();
  return (
    // TODO: name is not type-safed
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller control={form?.control} {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext)
    throw new Error("useFormField should be used within <FormField>");

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("w-full space-y-1", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId, name } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const txt = useTranslation(error?.["message"] ?? "");
  const body = error?.message ? txt : children;

  if (!body) return null;

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-xs font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

// ------------------------- custom fields
type FormReusingProps = Pick<
  FormProps<any, any>,
  "onSubmit" | "infiniteLoading" | "useForm" // "useForm": used for onActions props
>;
type FormButtonProps = {
  onAction?: FormReusingProps["onSubmit"];
  Icon?: React.ReactNode;

  infiniteLoading?: FormReusingProps["infiniteLoading"];
  useForm?: FormReusingProps["useForm"];
} & ButtonProps;

const FormButton =
  // withFormAwareness(

  React.forwardRef<HTMLButtonElement, FormButtonProps>(
    (
      {
        onClick,
        children,
        onAction,
        disabled,

        infiniteLoading = false,
        useForm: useFormProps,

        Icon = null,
        type,
        ...props
      },
      ref
    ) => {
      const form = useForm?.();
      const [loading, setLoading] = React.useState<boolean>(false);

      return (
        <Button
          ref={ref}
          type={type}
          onClick={async (e) => {
            if (onAction) {
              setLoading(true);
              form?.setDisabled?.(true);
              await handleServerAction(
                onAction(useFormProps?.defaultValues ?? {}),
                {
                  onSuccess() {
                    setLoading(infiniteLoading);
                    form?.setDisabled?.(infiniteLoading);
                  },
                  onError() {
                    setLoading(false);
                    form?.setDisabled?.(false);
                  },
                }
              );
            } else {
              onClick?.(e);
            }
          }}
          disabled={disabled || loading || form?.disabled || form?.loading}
          {...props}
        >
          {(type === "submit" && form?.loading) || loading ? (
            <Icons.spinner />
          ) : (
            Icon
          )}

          {children}
        </Button>
      );
    }
  );
// );
FormButton.displayName = "FormButton";

type FormResetButtonProps = {} & FormButtonProps;

const FormResetButton = React.forwardRef<
  HTMLButtonElement,
  FormResetButtonProps
>(({ onClick, ...props }, ref) => {
  const form = useForm?.();

  return (
    <FormButton
      ref={ref}
      onClick={async (e) => {
        form?.reset();
        onClick?.(e);
      }}
      {...props}
    />
  );
});
FormResetButton.displayName = "FormResetButton";

export type WithFormAwarenessProps = {
  disabled?: boolean;
  loading?: "true" | "false";
};
export function withFormAwareness<T extends WithFormAwarenessProps, R = any>(
  WrappedComponent:
    | React.ComponentType<T>
    | React.ForwardRefRenderFunction<R, T>
) {
  const result = React.forwardRef<R, T>((props, ref) => {
    const form = useForm?.() ?? undefined;
    const loading = form?.loading;
    const disabled = form?.loading || form?.disabled || props?.disabled;

    return React.createElement(WrappedComponent as any, {
      ...props,
      ref,
      disabled,
      loading: JSON.stringify(loading),
    });
  });

  result["displayName"] = WrappedComponent?.displayName;
  return result;
}

type FormInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string;
  description?: string;
} & InputProps;

const FormInputField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  label,
  description,
  ...props
}: FormInputFieldProps<TFieldValues, TName>) => {
  return (
    <FormField
      {...field}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input {...field} {...props} />
            </FormControl>
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
FormInputField.displayName = "FormInputField";

type FormInputOTPFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string;
  maxLength: number;
};
// & InputOTPProps;

const FormInputOTPField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field: _field,
  label,
  maxLength,
  ...props
}: FormInputOTPFieldProps<TFieldValues, TName>) => {
  return (
    <FormField
      {..._field}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <InputOTP maxLength={maxLength} {...field} {...props}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSeparator />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                </InputOTPGroup>
              </InputOTP>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
FormInputOTPField.displayName = "FormInputOTPField";

type FormTextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string;
  description?: string;
} & TextareaProps;

const FormTextareaField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  label,
  description,
  ...props
}: FormTextareaFieldProps<TFieldValues, TName>) => {
  return (
    <FormField
      {...field}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Textarea {...field} {...props} />
            </FormControl>
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
FormTextareaField.displayName = "FormTextareaField";

type FormSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string;
  placeholder: string;
  items: SelectItemType[];
  description?: string;
} & SelectProps;

const FormSelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  label,
  items,
  description,
  placeholder,
  ...props
}: FormSelectFieldProps<TFieldValues, TName>) => {
  return (
    <FormField
      {...field}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>

            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              {...props}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {items?.map((e, i) => <SelectItem key={i} {...e} />)}
              </SelectContent>
            </Select>

            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
FormSelectField.displayName = "FormSelectField";

type FormSwitchFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string;
  items: (SelectItemType & { description?: string })[];
  description?: string;
} & SelectProps;

const FormSwitchField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  label,
  items,
  description,
  ...props
}: FormSwitchFieldProps<TFieldValues, TName>) => {
  const form = useForm?.();
  return (
    <FormField
      {...field}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>

            <div className="flex flex-col gap-4">
              {items?.map((e, i) => (
                <FormControl key={i}>
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background p-4 text-foreground">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{e?.children}</FormLabel>
                      {e?.description ? (
                        <FormDescription>{e?.description}</FormDescription>
                      ) : null}
                    </div>
                    <FormControl>
                      <Switch
                        disabled={form?.disabled}
                        checked={field?.value?.includes(e?.value)}
                        onCheckedChange={(b) => {
                          if (b) field.onChange([...field?.value, e?.value]);
                          else
                            field.onChange([
                              ...field?.value?.filter(
                                (v: any) => v !== e?.value
                              ),
                            ]);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                </FormControl>
              ))}
            </div>

            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
FormSwitchField.displayName = "FormSwitchField";

type FormDateFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string;
  description?: string;
} & CalendarProps;

const FormDateField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  label,
  description,
  ...props
}: FormDateFieldProps<TFieldValues, TName>) => {
  const form = useForm?.();
  const { "form-fields": ff } = useLocale();

  return (
    <FormField
      {...field}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>

            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full items-center justify-between",
                      !field?.["value"] && "text-muted-foreground"
                    )}
                  >
                    {field?.value ? (
                      format(field?.value, "PPP")
                    ) : (
                      <span>{ff?.["pick a date"]}</span>
                    )}
                    <Icons.calendar className="opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={field?.value}
                  // @ts-expect-error TODO: expected handler mismatches
                  onSelect={field.onChange}
                  disabled={(date) => form?.disabled || date < new Date()}
                  initialFocus
                  {...props}
                />
              </PopoverContent>
            </Popover>

            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
FormDateField.displayName = "FormDateField";

type FormAlertDialogButtonProps = React.PropsWithChildren<{
  title?: string;
  description?: string;
  trigger: ButtonProps;
  form: FormProps<any, any>;
  isFooter?: boolean;
}>;

export function FormAlertDialogButton({
  title,
  description,
  form: { className: formClassName, children: formChildren, ...formProps },
  trigger: triggerProps,
  isFooter = true,
  children,
}: FormAlertDialogButtonProps) {
  const { "form-fields": ff } = useLocale();
  const [openDialog, setOpenDialog] = React.useState<boolean>(false);

  return (
    <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
      <AlertDialogTrigger asChild>
        <Button {...triggerProps} />
      </AlertDialogTrigger>

      <AlertDialogContent className="max-h-[calc(100svh-4rem)] overflow-auto">
        <Form
          className={cn("flex flex-col gap-4", formClassName)}
          setOpenDialog={setOpenDialog}
          {...formProps}
        >
          {title || description ? (
            <AlertDialogHeader>
              {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
              {description && (
                <AlertDialogDescription>{description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
          ) : null}

          {children}

          {isFooter ? (
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <FormButton variant="outline">{ff?.["cancel"]}</FormButton>
              </AlertDialogCancel>
              <FormButton type="submit" className="w-full">
                {ff?.["confirm"]}
              </FormButton>
            </AlertDialogFooter>
          ) : null}
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormButton,
  FormResetButton,
  FormInputField,
  FormInputOTPField,
  FormTextareaField,
  FormSelectField,
  FormSwitchField,
  FormDateField,
};
