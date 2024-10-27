"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Command, CommandList } from "@/components/ui/command";

type FancyMultiSelectProps = {
	selected: string[];
	onSelectedChange: (selected: string[]) => void;
};

export function TagsInput({ selected, onSelectedChange }: FancyMultiSelectProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [value, setValue] = React.useState<string>("");

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			const input = inputRef.current;

			if (input) {
				if ((e.key === "Delete" || e.key === "Backspace") && value === "") {
					onSelectedChange(selected.slice(0, -1)); // Remove last tag if backspace/delete is pressed
					return;
				}

				if (e.key === "Enter" && value.trim() !== "") {
					onSelectedChange([...selected, value.trim()]); // Add new tag
					setValue(""); // Clear input
					e.preventDefault(); // Prevent form submission on Enter
					return;
				}

				if (e.key === "Escape") input.blur(); // Blur on Escape
			}
		},
		[selected, onSelectedChange, value],
	);

	return (
		<Command onKeyDown={handleKeyDown} className="h-fit overflow-visible bg-transparent">
			<div
				className={cn(
					"group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
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
									const updatedSelected = selected.filter((_, index) => index !== i);
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
						onValueChange={(e) => setValue(e)}
						placeholder="insert values..."
						className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
					/>
				</div>
			</div>
			<div className="relative mt-2">
				<CommandList>{/* No predefined options to show */}</CommandList>
			</div>
		</Command>
	);
}
