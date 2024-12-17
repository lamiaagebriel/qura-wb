"use client";

import * as React from "react";

import { SelectItem as SelectItemType, ServerActionError } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  SubmitHandler,
  useFormContext,
  UseFormProps,
  useForm as useReactHookForm,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Validation, ValidationInfer, validations } from "@/lib/validations";

import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PromiseT<Data = any> = Promise<Data> | (() => Promise<Data>);
type PromiseTResult<Data = any> = (data: Data) => void;

type FormProps<T extends Validation, R> = {
  validation: T;
  formProps?: UseFormProps<ValidationInfer<T>>;
  actions: {
    onSubmit: (data: ValidationInfer<T>) => Promise<R> | Promise<R>;
    onSuccess?: PromiseTResult<R>;
    onError?: PromiseTResult<ServerActionError>;
  };
} & Omit<
  React.DetailedHTMLProps<
    React.FormHTMLAttributes<HTMLFormElement>,
    HTMLFormElement
  >,
  "onSubmit"
>;

const Form = <T extends Validation, R>({
  validation,
  actions,
  formProps,
  ...props
}: FormProps<T, R>) => {
  const schema = validations?.[validation];
  const { onSubmit: actionFn, onSuccess, onError } = actions;
  // const [loading, setLoading] = React.useState<boolean>(false);

  const form = useReactHookForm<ValidationInfer<T>>({
    mode: "onBlur",
    resolver: zodResolver(schema),
    ...formProps,
  });

  async function handleServerAction<T>(
    actionFn: PromiseT<T>,
    options: {
      success?: PromiseTResult<T>;
      error?: PromiseTResult;
      finally?: () => void | Promise<void>;
    }
  ) {
    const { success, error, finally: Finally } = options;
    try {
      const result =
        typeof actionFn === "function" ? await actionFn() : await actionFn;

      if (
        result &&
        typeof result === "object" &&
        "ok" in result &&
        !result?.["ok"]
      )
        throw result;

      success?.(result);
      return result;
    } catch (err: any) {
      // Handle Zod validation errors
      console.log({ err });

      if (error) {
        error(err);
        return;
      }
      console.log("zodIssues" in err && Array.isArray(err?.["zodIssues"]));

      if ("zodIssues" in err && Array.isArray(err?.["zodIssues"])) {
        err?.["zodIssues"]?.forEach((e) => {
          const path = e?.["path"]?.join(".");
          if (!path) return toast.error(e?.["message"]!);

          form.setError(path as any, { message: e?.["message"]! });
        });

        return;
      }

      if ("message" in err && typeof err?.["message"] === "string")
        toast.error(err?.["message"]);

      return null;
    } finally {
      Finally?.();
    }
  }

  async function onSubmit(data: ValidationInfer<T>) {
    await handleServerAction(actionFn(data), {
      success: onSuccess,
      error: onError,
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} {...props} />
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
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

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
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
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
  const { error, formItemId, formDescriptionId, formMessageId } =
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

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

// ---------------------- Custom Form Component
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

type FormSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: Omit<ControllerProps<TFieldValues, TName>, "render">;
  items: SelectItemType[];
  label: string;
} & InputProps;

const FormSelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  field,
  items,
  label,
  placeholder,
  ...props
}: FormSelectFieldProps<TFieldValues, TName>) => {
  return (
    <FormField
      {...field}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {items?.map((e, i) => <SelectItem key={i} {...e} />)}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
FormSelectField.displayName = "FormSelectField";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,

  // ---------------------- Custom Form Component
  FormInputField,
  FormSelectField,
};
