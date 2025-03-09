"use client";

import * as React from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button, ButtonProps } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { withFormAwareness } from "./form";

export type ComboboxProps = React.ComponentProps<"button"> &
  React.HTMLAttributes<HTMLButtonElement> &
  ButtonProps & {
    value: string;
    onValueChange: (value: string) => void;
    values: {
      value: string;
      label: string | React.ReactNode;
      disabled?: boolean;
    }[];
    className?: string;
  };

const ComboboxWithoutFormAwareness = React.forwardRef<
  HTMLButtonElement,
  ComboboxProps
>(({ value, onValueChange, values, className, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger ref={ref} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-fit items-center justify-between gap-0.5 px-2",
            className
          )}
          {...props}
        >
          {value ? values.find((e) => e.value === value)?.label : "Select..."}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No found.</CommandEmpty>
            <CommandGroup>
              {values.map((e, i) => (
                <CommandItem
                  key={i}
                  value={e.value}
                  disabled={e?.disabled}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === e.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {e.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

ComboboxWithoutFormAwareness.displayName = "Combobox";
const Combobox = withFormAwareness(ComboboxWithoutFormAwareness);

export { Combobox };
