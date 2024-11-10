"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { storeCreateSchema, storeUpdateSchema } from "@/validations/stores";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/types/locale";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "@/components/image";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { fileToBase64 } from "@/lib/utils";

export type StoreFormProps = {
	loading: boolean;
	form: UseFormReturn<
		z.infer<typeof storeCreateSchema> | z.infer<typeof storeUpdateSchema>,
		any,
		undefined
	>;
} & Dictionary["store-form"];

export const StoreForm = {
	name: ({
		dic: {
			"store-form": { name: c },
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="name"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["name"]}</FormLabel>
					<FormControl>
						<Input {...field} disabled={loading} placeholder={c?.["ovve.eg"]} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	username: ({
		dic: {
			"store-form": { username: c },
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="username"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["username"]}</FormLabel>
					<FormControl>
						<div className="relative overflow-hidden">
							<Input {...field} disabled={loading} placeholder={c?.["ovve"]} className="pl-28" />
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
	bio: ({
		dic: {
			"store-form": { bio: c },
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="bio"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["bio"]}</FormLabel>
					<FormControl>
						<Textarea
							{...field}
							value={field?.["value"] ?? ""}
							disabled={loading}
							placeholder={c?.["type about your store..."]}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	logo: function Component({
		dic: {
			"store-form": { logo: c },
		},
		loading,
		form,
	}: StoreFormProps) {
		return (
			<FormField
				control={form?.["control"]}
				name="logo"
				render={({ field }) => (
					<FormItem>
						<div className="relative flex aspect-square h-20 cursor-pointer items-center justify-center rounded-full border border-dashed p-0 transition-all hover:bg-gray-50">
							<div className="relative">
								{form.watch("logo") ? (
									<>
										<Image src={form.getValues("logo")!} alt="" className="rounded-full" />
										<Button
											variant="outline"
											size="icon"
											className="absolute -right-5 -top-5 h-6 w-6"
											disabled={loading}
											onClick={() => form.resetField("logo")}
										>
											<Icons.x />
										</Button>
									</>
								) : (
									<Icons.image className="text-gray-500" />
								)}
							</div>

							<FormLabel className="sr-only">{c?.["logo"]}</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="file"
									accept="image/*"
									className="absolute h-full w-full cursor-pointer rounded-full p-0 opacity-0"
									disabled={loading}
									value={undefined}
									onChange={async (e) => {
										form.resetField("logo");
										const file = e?.["target"]?.["files"]?.[0];

										if (file) {
											// field.onChange(file);
											const base64 = (await fileToBase64({ file }))?.toString();
											form.setValue("logo", base64 ?? "");
										}
									}}
								/>
							</FormControl>
						</div>

						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
};

export const AddressForm = {
	addressLine: ({
		dic: {
			"store-form": {
				location: { "address-line": c },
			},
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="location.addressLine"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["address line"]}</FormLabel>
					<FormControl>
						<Input
							{...field}
							value={field?.["value"] ?? ""}
							disabled={loading}
							placeholder={c?.["03 aprt., 808 building"]}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	zip: ({
		dic: {
			"store-form": {
				location: { zip: c },
			},
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="location.zip"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["zip"]}</FormLabel>
					<FormControl>
						<Input
							{...field}
							value={field?.["value"] ?? ""}
							disabled={loading}
							placeholder={c?.["185047"]}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	state: ({
		dic: {
			"store-form": {
				location: { state: c },
			},
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="location.state"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["state"]}</FormLabel>
					<FormControl>
						<Input
							{...field}
							value={field?.["value"] ?? ""}
							disabled={loading}
							placeholder={c?.["obour"]}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	city: ({
		dic: {
			"store-form": {
				location: { city: c },
			},
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="location.city"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["city"]}</FormLabel>
					<FormControl>
						<Input
							{...field}
							value={field?.["value"] ?? ""}
							disabled={loading}
							placeholder={c?.["cairo"]}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	country: ({
		dic: {
			"store-form": {
				location: { country: c },
			},
		},
		loading,
		form,
	}: StoreFormProps) => (
		<FormField
			control={form.control}
			name="location.country"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{c?.["country"]}</FormLabel>
					<FormControl>
						<Input
							{...field}
							value={field?.["value"] ?? ""}
							disabled={loading}
							placeholder={c?.["egypt"]}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
};
