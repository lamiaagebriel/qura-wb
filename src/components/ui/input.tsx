"use client";

import Image from "next/image";
import * as React from "react";

import { cva, VariantProps } from "class-variance-authority";
import { countries } from "countries-list";

import { cn, fileToBase64 } from "@/lib/utils";

import { Combobox } from "@/components/ui/combobox";
import { withFormAwareness } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";

export const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" +
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" +
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
);

export type InputProps = React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants> & {
    countryCode?: string;
    onCountryCodeChange?: (countryCode: string) => void;
  };

function InputWithoutFormAwareness({
  type = "text",
  className,
  onChange,
  value,
  multiple,
  countryCode = "+1",
  onCountryCodeChange,
  defaultValue,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [phoneValue, setPhoneValue] = React.useState(
    value?.toString()?.split(countryCode)?.[1]
  );
  const [selectedCountryCode, setSelectedCountryCode] =
    React.useState(countryCode);
  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  // Sort country codes for the dropdown
  const countryEntries = React.useMemo(() => Object.entries(countries), []);
  const sortedCountryCodes = React.useMemo(() => {
    const codes = countryEntries.map(([code, country]) => ({
      code,
      name: country.name,
      phone: country.phone,
    }));
    return codes.sort((a, b) => a.name.localeCompare(b.name));
  }, [countryEntries]);

  if (type === "password") {
    return (
      <div className="relative">
        <input
          data-slot="input"
          onChange={onChange}
          value={value ?? ""}
          multiple={multiple}
          type={isPasswordVisible ? "text" : "password"}
          className={cn(
            inputVariants({}),
            "pr-10", // Add space for the eye icon
            className
          )}
          dir="ltr"
          placeholder="******"
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect="off"
          {...props}
        />

        <button
          type="button"
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 focus:outline-none"
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        >
          {isPasswordVisible ? (
            <Icons.eyeOff className="size-3" />
          ) : (
            <Icons.eye className="size-3" />
          )}
        </button>
      </div>
    );
  }

  if (type === "tel") {
    // Format and validate phone number
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value?.trimStart();
      // Only allow digits, spaces, and some special characters
      const validInput = input.replace(/[^\d\s\+\-\(\)]/g, "");
      setPhoneValue(validInput);

      // Create a synthetic event to pass to the parent onChange
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: `${selectedCountryCode} ${validInput}`, // Removes only the first space
          },
        } as React.ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
      }
    };

    // Handle country code change
    const handleCountryCodeChange = (
      // e: React.ChangeEvent<HTMLSelectElement>
      newCountryCode: string
    ) => {
      // const newCountryCode = e.target.value;
      setSelectedCountryCode(newCountryCode);

      if (onCountryCodeChange) {
        onCountryCodeChange(newCountryCode);
      }

      // Update the combined value
      if (onChange && phoneValue) {
        const syntheticEvent = {
          target: {
            name: props.name,
            value: `${newCountryCode} ${phoneValue}`,
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
      }

      // Focus on the phone input after selecting country code
      if (phoneInputRef.current) {
        phoneInputRef.current.focus();
      }
    };

    return (
      <div className="flex rtl:flex-row-reverse">
        <Combobox
          className="gap-6 rounded-r-none"
          value={`${selectedCountryCode}-${sortedCountryCodes?.find((e) => `+${e?.phone}` === selectedCountryCode)?.code}`}
          onValueChange={(value) =>
            handleCountryCodeChange(value?.split("-")[0])
          }
          values={sortedCountryCodes?.map((e) => ({
            value: `+${e.phone}-${e?.code}`,
            disabled: selectedCountryCode === `+${e.phone}`,
            label: (
              <>
                <div className="flex items-center gap-1">
                  <Image
                    fetchPriority="high"
                    alt={e?.name}
                    src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${e.code}.svg`}
                    className="inline-flex size-4 object-cover object-center"
                    width={9999999}
                    height={9999999}
                  />
                  <span>(+{e.phone})</span>
                </div>
              </>
            ),
          }))}
        />

        <input
          data-slot="input"
          ref={phoneInputRef}
          type={type}
          onChange={handlePhoneChange}
          value={phoneValue?.trimStart()}
          className={cn(inputVariants({}), "w-full rounded-l-none", className)}
          dir="ltr"
          placeholder="(555) 123-4567"
          autoCapitalize="none"
          autoComplete="tel"
          autoCorrect="off"
          pattern="[0-9\s\(\)\-]+"
          {...props}
        />
      </div>
    );
  }

  if (type === "email")
    return (
      <input
        type={type}
        data-slot="input"
        onChange={onChange}
        value={value ?? ""}
        multiple={multiple}
        className={cn(inputVariants({}), className)}
        dir="ltr"
        placeholder="name@example.com"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect="off"
        {...props}
      />
    );
  if (type === "file")
    return (
      <input
        data-slot="input"
        type={type}
        className={cn(inputVariants({}), className)}
        value={undefined}
        multiple={multiple}
        onChange={async (e) => {
          const files = e?.target?.files;
          if (!files || !files.length) return null;

          const fileBase64 = await Promise.all(
            Array.from(files).map((file) =>
              fileToBase64(file)?.then((r) => r?.toString() as string)
            )
          );

          onChange?.({
            ...e,
            target: {
              ...e?.target,
              // TODO: handle multiple files
              value: multiple
                ? (fileBase64 as any)
                : fileBase64?.length === 1 && fileBase64[0]
                  ? fileBase64[0]
                  : "",
            },
          });
        }}
        {...props}
      />
    );

  if (type === "number")
    return (
      <input
        data-slot="input"
        type={type}
        onChange={(e) => {
          onChange?.({
            ...e,
            target: {
              ...e?.target,
              value: Number(e?.target?.value ?? "0") as unknown as string,
            },
          });
        }}
        multiple={multiple}
        value={value ?? ""}
        className={cn(inputVariants({}), className)}
        {...props}
      />
    );

  return (
    <input
      data-slot="input"
      type={type}
      onChange={onChange}
      multiple={multiple}
      value={value ?? ""}
      className={cn(inputVariants({}), className)}
      {...props}
    />
  );
}

const Input = withFormAwareness(InputWithoutFormAwareness);
export { Input };
