"use client";

import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { storeCreateSchema, storeUpdateSchema } from "@/validations/stores";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/types/locale";
import { Image } from "../image";
import { Button } from "../ui/button";
import { Icons } from "../icons";
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
						<Input placeholder={c?.["ovve.eg"]} disabled={loading} {...field} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	),
	logo: function Component({ loading, form }: StoreFormProps) {
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
										<Image
											src={form.getValues("logo")!}
											alt=""
											className="h-full w-full rounded-full"
										/>
										<Button
											type="button"
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

							<FormLabel className="sr-only">
								logo
								{/* {c?.["label"]} */}
							</FormLabel>
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
			// <div className="grid gap-2">
			// 	<div className="relative">
			// 		<Image
			// 			alt="Product image"
			// 			className="aspect-square w-full rounded-md object-cover object-center"
			// 			height="300"
			// 			src={form.watch("images")?.[0] ?? "https://ui.shadcn.com/placeholder.svg"}
			// 			width="300"
			// 		/>
			// 		{form.watch("images")?.[0] ? (
			// 			<Button
			// 				variant="destructive"
			// 				size="icon"
			// 				onClick={() =>
			// 					form.setValue(
			// 						"images",
			// 						form.getValues("images")?.filter((x, j) => j !== 0),
			// 					)
			// 				}
			// 				className="absolute -right-1 -top-1 size-4 rounded-full"
			// 			>
			// 				<Icons.x />
			// 			</Button>
			// 		) : null}
			// 	</div>
			// 	<div className="grid grid-cols-3 gap-2">
			// 		<div className="relative">
			// 			<Image
			// 				alt="Product image"
			// 				className="aspect-square w-full rounded-md object-cover object-center"
			// 				height="300"
			// 				src={form.watch("images")?.[1] ?? "https://ui.shadcn.com/placeholder.svg"}
			// 				width="300"
			// 			/>
			// 			{form.watch("images")?.[1] ? (
			// 				<Button
			// 					variant="destructive"
			// 					size="icon"
			// 					onClick={() =>
			// 						form.setValue(
			// 							"images",
			// 							form.getValues("images")?.filter((x, j) => j !== 1),
			// 						)
			// 					}
			// 					className="absolute -right-1 -top-1 size-4 rounded-full"
			// 				>
			// 					<Icons.x />
			// 				</Button>
			// 			) : null}
			// 		</div>

			// 		{form.watch("images")?.["length"] > 3 ? (
			// 			<AlertDialog>
			// 				<AlertDialogTrigger asChild>
			// 					<button
			// 						type="button"
			// 						className="rounded-md border border-dashed text-muted-foreground"
			// 					>
			// 						+{form.watch("images")?.["length"]}
			// 					</button>
			// 				</AlertDialogTrigger>
			// 				<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
			// 					<AlertDialogHeader>
			// 						<AlertDialogTitle className="justify-start">edit images</AlertDialogTitle>
			// 						<AlertDialogDescription className="max-w-prose">
			// 							edit images
			// 						</AlertDialogDescription>
			// 					</AlertDialogHeader>

			// 					<Tabs defaultValue="0">
			// 						<TabsList className="h-auto w-full max-w-full flex-1 justify-stretch gap-4 overflow-auto bg-transparent">
			// 							{form.watch("images")?.map((e, i) => (
			// 								<TabsTrigger key={i} value={i?.toString()} className="w-fit p-0">
			// 									<Image
			// 										alt="Product image"
			// 										className="aspect-square size-16 rounded-md object-cover object-center"
			// 										src={e}
			// 										height={999999}
			// 										width={999999}
			// 									/>
			// 								</TabsTrigger>
			// 							))}
			// 						</TabsList>
			// 						{form.watch("images")?.map((e, i) => (
			// 							<TabsContent key={i} value={i?.toString()}>
			// 								<div className="relative">
			// 									<Image
			// 										alt="Product image"
			// 										className="aspect-square w-full rounded-md object-cover object-center"
			// 										height="300"
			// 										src={e ?? "https://ui.shadcn.com/placeholder.svg"}
			// 										width="300"
			// 									/>
			// 									{e ? (
			// 										<Button
			// 											variant="destructive"
			// 											size="icon"
			// 											onClick={() =>
			// 												form.setValue(
			// 													"images",
			// 													form.getValues("images")?.filter((x, j) => j !== i),
			// 												)
			// 											}
			// 											className="absolute -right-1 -top-1 size-4 rounded-full"
			// 										>
			// 											<Icons.x />
			// 										</Button>
			// 									) : null}
			// 								</div>
			// 							</TabsContent>
			// 						))}
			// 					</Tabs>

			// 					<AlertDialogFooter>
			// 						<Button disabled={loading} className="w-full md:w-fit">
			// 							Confirm
			// 						</Button>
			// 					</AlertDialogFooter>
			// 				</AlertDialogContent>
			// 			</AlertDialog>
			// 		) : (
			// 			<div className="relative">
			// 				<Image
			// 					alt="Product image"
			// 					className="aspect-square w-full rounded-md object-cover object-center"
			// 					height="300"
			// 					src={form.watch("images")?.[2] ?? "https://ui.shadcn.com/placeholder.svg"}
			// 					width="300"
			// 				/>
			// 				{form.watch("images")?.[2] ? (
			// 					<Button
			// 						variant="destructive"
			// 						size="icon"
			// 						onClick={() =>
			// 							form.setValue(
			// 								"images",
			// 								form.getValues("images")?.filter((x, j) => j !== 2),
			// 							)
			// 						}
			// 						className="absolute -right-1 -top-1 size-4 rounded-full"
			// 					>
			// 						<Icons.x />
			// 					</Button>
			// 				) : null}
			// 			</div>
			// 		)}

			// 		<FormField
			// 			control={form?.["control"]}
			// 			name={`images.${0}`}
			// 			render={({ field }) => (
			// 				<FormItem className="relative">
			// 					<div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed">
			// 						<div className="relative">
			// 							<Icons.upload className="h-4 w-4 text-muted-foreground" />
			// 						</div>
			// 						{/* <FormLabel className="sr-only">{c?.["label"]} </FormLabel> */}
			// 						<FormControl>
			// 							<Input
			// 								// {...field}
			// 								disabled={loading}
			// 								type="file"
			// 								accept="image/*"
			// 								multiple={true}
			// 								value={undefined}
			// 								onChange={async (e) => {
			// 									const files = e.target.files;

			// 									for (let i = 0; i < (files?.["length"] as number); i++) {
			// 										const file = files?.[i];
			// 										if (file) {
			// 											const base64 = (await fileToBase64({ file }))?.toString();
			// 											// @ts-expect-error
			// 											imagesForm.append(base64 ?? "");
			// 										}
			// 									}
			// 								}}
			// 								className="absolute h-full w-full cursor-pointer rounded-full p-0 opacity-0"
			// 							/>
			// 						</FormControl>
			// 					</div>

			// 					<FormMessage />
			// 				</FormItem>
			// 			)}
			// 		/>

			// 		{/* <button
			// 		type="button"
			// 		className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed"
			// 	>
			// 		<Icons.upload className="h-4 w-4 text-muted-foreground" />
			// 		<span className="sr-only">Upload</span>
			// 	</button> */}
			// 	</div>
			// </div>
		);
	},
};
