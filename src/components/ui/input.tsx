"use client";

import * as React from "react";

import { cva, VariantProps } from "class-variance-authority";
import { countries } from "countries-list";

import { cn, fileToBase64 } from "@/lib/utils";

import { Combobox } from "@/components/ui/combobox";
import { Icons } from "@/components/icons";

import { withFormAwareness } from "./form";

export const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
);

export type InputProps = React.ComponentProps<"input"> &
  React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {
    countryCode?: string;
    onCountryCodeChange?: (countryCode: string) => void;
  };

const InputWithoutFormAwareness = React.forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      type = "text",
      className,
      onChange,
      value,
      multiple,
      countryCode = "+1",
      onCountryCodeChange,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const [phoneValue, setPhoneValue] = React.useState(
      value?.toString()?.split(countryCode)?.[1]
    );
    const [selectedCountryCode, setSelectedCountryCode] =
      React.useState(countryCode);
    const phoneInputRef = React.useRef<HTMLInputElement>(null);

    if (type === "password") {
      return (
        <div className="relative">
          <input
            ref={ref}
            onChange={onChange}
            value={value ?? ""}
            multiple={multiple}
            type={isPasswordVisible ? "text" : "password"}
            className={cn(
              inputVariants({ className }),
              "pr-10" // Add space for the eye icon
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
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

      // Extract country codes from countries-list
      const getCountryCodes = () => {
        return Object.entries(countries).map(([code, country]) => ({
          code,
          name: country.name,
          phone: country.phone,
        }));
      };

      // Sort country codes for the dropdown
      const sortedCountryCodes = React.useMemo(() => {
        const codes = getCountryCodes();
        return codes.sort((a, b) => a.name.localeCompare(b.name));
      }, []);

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
                    <img
                      alt={e?.name}
                      src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${e.code}.svg`}
                      className="inline-flex size-4 object-cover object-center"
                    />
                    <span>(+{e.phone})</span>
                  </div>
                </>
              ),
            }))}
          />

          <input
            ref={phoneInputRef}
            type={type}
            onChange={handlePhoneChange}
            value={phoneValue?.trimStart()}
            className={cn(
              inputVariants({ className }),
              "w-full rounded-l-none"
            )}
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
          ref={ref}
          type={type}
          onChange={onChange}
          value={value ?? ""}
          multiple={multiple}
          className={cn(inputVariants({ className }))}
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
          ref={ref}
          type={type}
          className={cn(inputVariants({ className }))}
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
          ref={ref}
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
          className={cn(inputVariants({ className }))}
          {...props}
        />
      );

    return (
      <input
        ref={ref}
        type={type}
        onChange={onChange}
        multiple={multiple}
        value={value ?? ""}
        className={cn(inputVariants({ className }))}
        {...props}
      />
    );
  }
);
InputWithoutFormAwareness.displayName = "Input";
const Input = withFormAwareness(InputWithoutFormAwareness);

export { Input };
