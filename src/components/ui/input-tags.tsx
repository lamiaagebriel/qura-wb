"use client";

import * as React from "react";

import { Command as CommandPrimitive } from "cmdk";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Icons } from "@/components/icons";

type InputTagsProps = {
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  suggestions?: string[];
};

export function InputTags({
  selected,
  onSelectedChange,
  suggestions = [],
}: InputTagsProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>("");

  const handleNewValue = ({ value }: { value: string }) => {
    const val = value.trim();
    if (selected?.find((e) => e === val)) {
      toast.error("this value already exists.");
      return;
    }

    onSelectedChange([...selected, val]); // Add new tag
    setValue(""); // Clear input
  };
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) return;

      if (e.key === "Escape") {
        input.blur(); // Blur on Escape
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && value === "") {
        onSelectedChange(selected.slice(0, -1)); // Remove last tag if backspace/delete is pressed
        return;
      }

      if (e.key === "Enter" && value.trim() !== "") {
        handleNewValue({ value: value.trim() });
        e.preventDefault(); // Prevent form submission on Enter
        return;
      }
    },
    [selected, onSelectedChange, value, handleNewValue]
  );

  const selectables = suggestions.filter((val) => !selected.includes(val));
  return (
    <Command
      onKeyDown={handleKeyDown}
      className="h-fit overflow-visible bg-transparent"
    >
      <div
        className={cn(
          "group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <div className="flex flex-wrap gap-1">
          {selected.map((tag, i) => (
            <Badge key={i} variant="secondary">
              {tag}
              <button
                type="button"
                className="ml-1 rounded-full outline-none"
                onClick={() => {
                  const updatedSelected = selected.filter(
                    (_, index) => index !== i
                  );
                  onSelectedChange(updatedSelected); // Update selected on tag removal
                }}
              >
                <Icons.x className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}

          <CommandPrimitive.Input
            ref={inputRef}
            value={value}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onValueChange={(e) => setValue(e)}
            placeholder="insert values..."
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {open && selectables?.["length"] > 0 ? (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="h-full overflow-auto">
                {selectables.map((val, i) => {
                  return (
                    <CommandItem
                      key={i}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        handleNewValue({ value: val });
                      }}
                      className={"cursor-pointer"}
                    >
                      {val}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </div>
    </Command>
  );
}
