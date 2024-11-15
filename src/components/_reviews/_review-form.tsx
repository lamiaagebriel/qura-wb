"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { reviewCreateSchema, reviewUpdateSchema } from "@/validations/reviews";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/types/locale";
import { Textarea } from "@/components/ui/textarea";

export type ReviewFormProps = {
	loading: boolean;
	form: UseFormReturn<
		z.infer<typeof reviewCreateSchema> | z.infer<typeof reviewUpdateSchema>,
		any,
		undefined
	>;
} & Dictionary["review-form"];

export const ReviewForm = {
	rating: ({
		dic: {
			"review-form": { rating: c },
		},
		loading,
		form,
	}: ReviewFormProps) => (
		<FormField
			control={form.control}
			name="rating"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["rating"]}</FormLabel>
					<FormControl>
						<Input
							{...field}
							type="number"
							disabled={loading}
							placeholder={c?.["choose 0-5"]}
							onChange={(e) => {
								const evt = {
									...e,
									target: { ...e?.["target"], value: Number(e?.["target"]?.["value"]) },
								};

								field?.onChange(evt);
							}}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	content: ({
		dic: {
			"review-form": { content: c },
		},
		loading,
		form,
	}: ReviewFormProps) => (
		<FormField
			control={form.control}
			name="content"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["content"]}</FormLabel>
					<FormControl>
						<Textarea
							{...field}
							value={field?.["value"] ?? ""}
							disabled={loading}
							placeholder={c?.["describe you experience..."]}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
};
