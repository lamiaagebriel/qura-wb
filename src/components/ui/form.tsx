"use client";

import { redirect } from "next/navigation";
import * as React from "react";

import {
  HandleServerActionOptions,
  ServerActionError,
  ServerActionResult,
  ServerActionSuccess,
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
  FormProviderProps,
  useFormContext,
  UseFormProps,
  useForm as useFormReactHook,
  UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";

import { loginWithPassword } from "@/servers/auth";
import { cn, handleServerAction } from "@/lib/utils";
import { Validation, ValidationName, validations } from "@/lib/validations";

import { Label } from "@/components/ui/label";

import { Icons } from "../icons";
import { Button, ButtonProps } from "./button";
import { Input, InputProps } from "./input";
import { Textarea, TextareaProps } from "./textarea";

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
        onSubmit={form.handleSubmit(async (data) => {
          setLoading(true);
          await handleServerAction(onSubmit(data), {
            form,
            onError(data) {
              onError?.(data);
              setLoading(false);
            },
            onSuccess(data) {
              onSuccess?.(data);
              setLoading(infiniteLoading);
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
      <div ref={ref} className={cn("space-y-1", className)} {...props} />
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
  const body = error ? String(error?.message) : children;

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
type FormButtonProps = {
  onAction?: any;
  infiniteLoading?: boolean;
  Icon?: React.ReactNode;
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
          type={type}
          onClick={async (e) => {
            if (onAction) {
              setLoading(true);
              form?.setDisabled?.(true);
              await handleServerAction(onAction({}), {
                onSuccess() {
                  setLoading(infiniteLoading);
                  form?.setDisabled?.(infiniteLoading);
                },
                onError() {
                  setLoading(false);
                  form?.setDisabled?.(false);
                },
              });
            } else {
              onClick?.(e);
            }
          }}
          disabled={disabled || loading || form.disabled || form.loading}
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

// export type WithFormAwarenessProps = {
//   disabled?: boolean;
//   loading?: "true" | "false";
// };
// function withFormAwareness<T extends WithFormAwarenessProps, R = any>(
//   WrappedComponent:
//     | React.ComponentType<T>
//     | React.ForwardRefRenderFunction<R, T>
// ) {
//   return React.forwardRef<R, T>((props, ref) => {
//     const form = useForm?.() ?? undefined;

// const loading = form?.loading;
// const disabled =
//   form?.loading || form?.disabled || props?.disabled;
//     return React.createElement(WrappedComponent as any, {
//       ...props,
//       ref,
//       disabled,
//       loading: JSON.stringify(loading),
//     });
//   });
// }

type FormInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string;
} & InputProps;

const FormInputField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  label,
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
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
FormInputField.displayName = "FormInputField";

type FormTextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  label: string;
} & TextareaProps;

const FormTextareaField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  label,
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
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
FormTextareaField.displayName = "FormTextareaField";

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
  FormInputField,
  FormTextareaField,
};
