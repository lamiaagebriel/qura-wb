"use client";

import * as React from "react";

import {
  HandleServerActionOptions,
  SelectItem as SelectItemType,
  ServerActionResult,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  UseFormProps,
  useForm as useFormReactHook,
  UseFormReturn,
  useFormState,
} from "react-hook-form";

import { cn, handleServerAction } from "@/lib/utils";
import { Validation, ValidationName, validations } from "@/lib/validations";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Input, InputProps } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPProps,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { InputTags } from "@/components/ui/input-tags";
import { Label, LabelProps } from "@/components/ui/label";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { useLocale } from "@/components/locale-provider";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectProps,
  SelectTrigger,
  SelectValue,
} from "./select";

type ExtendedUseForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
  TTransformedValues extends FieldValues | undefined = undefined,
> = UseFormReturn<TFieldValues, TContext, TTransformedValues> & {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  disabled: boolean;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
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
  // TODO: let validation be a must
  validation?: T;
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
  const schema = validation ? validations?.[validation] : null;

  const [loading, setLoading] = React.useState<boolean>(false);
  const [disabled, setDisabled] = React.useState<boolean>(false);

  const form = useFormReactHook<Validation[T]>({
    mode: "onBlur",
    ...(!!schema &&
      ({ resolver: zodResolver(schema) } as unknown as UseFormProps<
        Validation[T]
      >)),
    ...useFormProps,
  });
  const extendedUseForm = {
    ...form,
    loading,
    setLoading,
    disabled,
    setDisabled,
  } as ExtendedUseForm<Validation[T]>;

  // console.log("error: ", form?.formState?.errors);
  return (
    <FormProvider {...{ ...extendedUseForm }}>
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

const FormFieldContext = React.createContext<FormFieldContextValue | null>(
  null
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  const form = useForm?.();
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller control={form?.control as any} {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>");
  }
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

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

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid flex-1 gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      data-slot="form-control"
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
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}

// ------------------------- custom fields

export function withFormAwareness<
  TProps extends {
    disabled?: boolean;
    loading?: "true" | "false";
  },
>(WrappedComponent: React.ComponentType<TProps>) {
  const Result = React.forwardRef<unknown, TProps>((props, ref) => {
    const form = useForm?.() ?? undefined;
    const loading = form?.loading;
    const disabled = form?.loading || form?.disabled || props?.disabled;

    return React.createElement(
      WrappedComponent as React.ComponentType<TProps>,
      {
        ...(props as TProps),
        ref: ref as never,
        disabled,
        loading: JSON.stringify(loading),
      }
    );
  });

  Result.displayName = WrappedComponent.displayName;
  return Result;
}

type CustomFormsProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string | LabelProps;
  description?: string | React.ComponentProps<"p">;
};

type FormButtonProps<T extends ValidationName, R> = {
  infiniteLoading?: FormProps<T, R>["infiniteLoading"];
  useForm?: FormProps<T, R>["useForm"];
  onAction?: FormProps<T, R>["onSubmit"];
  validation?: FormProps<T, R>["validation"];

  Icon?: React.ReactNode;
} & ButtonProps;

const FormButton = <T extends ValidationName, R>({
  onClick,
  children,
  validation,
  onAction,
  disabled,

  infiniteLoading = false,
  useForm: useFormProps,

  Icon = null,
  type,
  ...props
}: FormButtonProps<T, R>) => {
  const form = useForm?.();
  const [loading, setLoading] = React.useState<boolean>(false);

  return (
    <Button
      type={type}
      onClick={async (e) => {
        if (onAction) {
          setLoading(true);
          form?.setDisabled?.(true);
          await handleServerAction(
            onAction(useFormProps?.defaultValues ?? ({} as any)),
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
};

const FormResetButton = <T extends ValidationName, R>({
  onClick,
  ...props
}: FormButtonProps<T, R>) => {
  const form = useForm?.();

  return (
    <FormButton
      onClick={async (e) => {
        form?.reset();
        onClick?.(e);
      }}
      {...props}
    />
  );
};

function FormInputField({
  field,
  label,
  description,
  ...props
}: CustomFormsProps & InputProps) {
  const labelProps: LabelProps =
    typeof label === "string" ? { children: label } : label;
  const descriptionProps: React.ComponentProps<"p"> =
    typeof description === "string"
      ? { children: description }
      : { ...description };

  return (
    <FormField
      {...field}
      render={({ field }) => (
        <FormItem>
          <FormLabel {...labelProps} />
          <FormControl>
            <Input {...field} {...props} />
          </FormControl>
          {!!descriptionProps?.children && (
            <FormDescription {...descriptionProps} />
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormInputOTPField({
  field: _field,
  label,
  description,
  maxLength = 8,
  ...props
}: CustomFormsProps & Omit<InputOTPProps, "children" | "render">) {
  const labelProps: LabelProps =
    typeof label === "string" ? { children: label } : label;
  const descriptionProps: React.ComponentProps<"p"> =
    typeof description === "string"
      ? { children: description }
      : { ...description };

  return (
    <FormField
      {..._field}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel {...labelProps} />

            <FormControl>
              <InputOTP
                maxLength={maxLength}
                {...field}
                {...props}
                containerClassName="flex items-center justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: maxLength }).map((_, idx) => (
                    <InputOTPSlot key={idx} index={idx} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function FormTagsField({
  field,
  label,
  description,
  ...props
}: CustomFormsProps & InputProps) {
  const labelProps: LabelProps =
    typeof label === "string" ? { children: label } : label;
  const descriptionProps: React.ComponentProps<"p"> =
    typeof description === "string"
      ? { children: description }
      : { ...description };

  return (
    <FormField
      {...field}
      render={({ field }) => (
        <FormItem>
          <FormLabel {...labelProps} />
          <FormControl>
            <InputTags
              selected={field?.value}
              onSelectedChange={(values) => field?.onChange(values)}
            />
          </FormControl>
          {!!descriptionProps?.children && (
            <FormDescription {...descriptionProps} />
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormTextareaField({
  field,
  label,
  description,
  ...props
}: CustomFormsProps & TextareaProps) {
  const labelProps: LabelProps =
    typeof label === "string" ? { children: label } : label;
  const descriptionProps: React.ComponentProps<"p"> =
    typeof description === "string"
      ? { children: description }
      : { ...description };

  return (
    <FormField
      {...field}
      render={({ field }) => (
        <FormItem>
          <FormLabel {...labelProps} />
          <FormControl>
            <Textarea {...field} {...props} />
          </FormControl>
          {!!descriptionProps?.children && (
            <FormDescription {...descriptionProps} />
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormSelectField({
  field,
  label,
  description,
  placeholder,
  items,
  ...props
}: CustomFormsProps &
  SelectProps & { placeholder: string; items: SelectItemType[] }) {
  const labelProps: LabelProps =
    typeof label === "string" ? { children: label } : label;
  const descriptionProps: React.ComponentProps<"p"> =
    typeof description === "string"
      ? { children: description }
      : { ...description };

  return (
    <FormField
      {...field}
      render={({ field }) => (
        <FormItem>
          <FormLabel {...labelProps} />
          <FormControl>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              {...props}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {items?.map((e, i) => (
                  <SelectItem key={i} {...e} />
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {!!descriptionProps?.children && (
            <FormDescription {...descriptionProps} />
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export type FormAlertDialogButtonProps = React.PropsWithChildren<{
  title?: string;
  description?: string;
  trigger: ButtonProps;
  form: FormProps<any, any>;
  isFooter?: boolean;
}>;

function FormAlertDialogButton({
  title,
  description,
  form: { className: formClassName, children: formChildren, ...formProps },
  trigger: { disabled, ...triggerProps },
  isFooter = true,
  children,
}: FormAlertDialogButtonProps) {
  const { cmn } = useLocale();
  const form = useForm?.();
  const [openDialog, setOpenDialog] = React.useState<boolean>(false);

  return (
    <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={disabled || form?.disabled || form?.loading}
          {...triggerProps}
        />
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
                <FormButton variant="outline">{cmn["cancel"]}</FormButton>
              </AlertDialogCancel>
              <FormButton type="submit">{cmn["confirm"]}</FormButton>
            </AlertDialogFooter>
          ) : null}
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export {
  Form,
  FormAlertDialogButton,
  FormButton,
  FormControl,
  FormDescription,
  FormField,
  FormInputField,
  FormInputOTPField,
  FormItem,
  FormLabel,
  FormMessage,
  FormResetButton,
  FormSelectField,
  FormTagsField,
  FormTextareaField,
  useFormField,
};
