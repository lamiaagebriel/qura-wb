"use client";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dictionary } from "@/types/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LocaleSwitcher } from "./locale-switcher";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";

const appearanceFormSchema = z.object({
	theme: z.enum(["light", "dark", "system"], {
		required_error: "Please select a theme.",
	}),
	lang: z.string({
		required_error: "Please select a theme.",
	}),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export type AppearanceFormProps = Dictionary["appearance-form"] & Dictionary["locale-switcher"];

export function AppearanceForm({ dic: { "appearance-form": c, ...dic } }: AppearanceFormProps) {
	const { theme, setTheme } = useTheme();
	const form = useForm<AppearanceFormValues>({
		resolver: zodResolver(appearanceFormSchema),
		defaultValues: {
			theme: theme?.toLowerCase() as any,
		},
	});

	function onSubmit(data: AppearanceFormValues) {
		setTheme(data?.["theme"]);

		toast.success(
			<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
				<p>You submitted the following values:</p>
				<code className="text-white">{JSON.stringify(data, null, 2)}</code>
			</pre>,
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<div className="flex items-center justify-between gap-4">
					<div className="space-y-1">
						<Label>{c?.["language"]}</Label>
						<p className="text-[0.8rem] text-muted-foreground">
							{c?.["automatically switch between languages."]}
						</p>
					</div>

					<LocaleSwitcher dic={dic} />
				</div>

				<FormField
					control={form.control}
					name="theme"
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>{c?.["theme"]}</FormLabel>
							<FormDescription>
								{c?.["automatically switch between day and night themes."]}
							</FormDescription>
							<FormMessage />

							<RadioGroup
								onValueChange={(e) => {
									field.onChange(e);
									setTheme(e);
								}}
								defaultValue={field.value}
								className="grid gap-8 pt-2 sm:grid-cols-3"
							>
								<FormItem>
									<FormLabel className="[&:has([data-state=checked])>div]:border-primary">
										<FormControl>
											<RadioGroupItem value="light" className="sr-only" />
										</FormControl>
										<div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
											<div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
												<div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
													<div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
													<div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
												</div>
												<div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
													<div className="h-4 w-4 rounded-full bg-[#ecedef]" />
													<div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
												</div>
												<div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
													<div className="h-4 w-4 rounded-full bg-[#ecedef]" />
													<div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
												</div>
											</div>
										</div>
										<span className="block w-full p-2 text-center font-normal">{c?.["light"]}</span>
									</FormLabel>
								</FormItem>
								<FormItem>
									<FormLabel className="[&:has([data-state=checked])>div]:border-primary">
										<FormControl>
											<RadioGroupItem value="dark" className="sr-only" />
										</FormControl>
										<div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
											<div className="space-y-2 rounded-sm bg-slate-950 p-2">
												<div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
													<div className="h-2 w-[80px] rounded-lg bg-slate-400" />
													<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
												</div>
												<div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
													<div className="h-4 w-4 rounded-full bg-slate-400" />
													<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
												</div>
												<div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
													<div className="h-4 w-4 rounded-full bg-slate-400" />
													<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
												</div>
											</div>
										</div>
										<span className="block w-full p-2 text-center font-normal">{c?.["dark"]}</span>
									</FormLabel>
								</FormItem>

								<FormItem>
									<FormLabel className="[&:has([data-state=checked])>div]:border-primary">
										<FormControl>
											<RadioGroupItem value="system" className="sr-only" />
										</FormControl>
										<div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
											<div className="space-y-2 rounded-sm bg-slate-950 p-2">
												<div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
													<div className="h-2 w-[80px] rounded-lg bg-slate-400" />
													<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
												</div>
												<div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
													<div className="h-4 w-4 rounded-full bg-slate-400" />
													<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
												</div>
												<div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
													<div className="h-4 w-4 rounded-full bg-slate-400" />
													<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
												</div>
											</div>
										</div>
										<span className="block w-full p-2 text-center font-normal">
											{c?.["system"]}
										</span>
									</FormLabel>
								</FormItem>
							</RadioGroup>
						</FormItem>
					)}
				/>

				{/* <Button type="submit">{c?.["update preferences"]}</Button> */}
			</form>
		</Form>
	);
}
