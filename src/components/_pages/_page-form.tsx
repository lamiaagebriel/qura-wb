"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { pageCreateSchema, pageUpdateSchema } from "@/validations/pages";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/types/locale";
import { Textarea } from "@/components/ui/textarea";

export type PageFormProps = {
	loading: boolean;
	form: UseFormReturn<
		z.infer<typeof pageCreateSchema> | z.infer<typeof pageUpdateSchema>,
		any,
		undefined
	>;
} & Dictionary["page-form"];

export const PageForm = {
	title: ({
		dic: {
			"page-form": { title: c },
		},
		loading,
		form,
	}: PageFormProps) => (
		<FormField
			control={form.control}
			name="title"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["title"]}</FormLabel>
					<FormControl>
						<Input {...field} disabled={loading} placeholder={c?.["about us"]} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	url: ({
		dic: {
			"page-form": { url: c },
		},
		loading,
		form,
	}: PageFormProps) => (
		<FormField
			control={form.control}
			name="url"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["url"]}</FormLabel>
					<FormControl>
						<div className="relative overflow-hidden">
							<Input {...field} disabled={loading} placeholder={c?.["about"]} className="pl-28" />
							<div className="absolute left-0.5 top-0.5 flex h-8 flex-col items-center justify-center rounded-l-md bg-muted px-2 text-muted-foreground">
								<p>concom.com/</p>
							</div>
						</div>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	description: ({
		dic: {
			"page-form": { description: c },
		},
		loading,
		form,
	}: PageFormProps) => (
		<FormField
			control={form.control}
			name="description"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["description"]}</FormLabel>
					<FormControl>
						<Textarea
							{...field}
							value={field?.["value"] ?? ""}
							disabled={loading}
							placeholder={c?.["type the page description..."]}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
};
