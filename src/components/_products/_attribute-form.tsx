"use client";

import { useFieldArray, UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { attributesSchema } from "@/validations/products";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/types/locale";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { TagsInput } from "@/components/forms";
import { ProductAttribute } from "@/types/db";

export type AttributeFormProps = {
	loading: boolean;
	form: UseFormReturn<z.infer<typeof attributesSchema>, any, undefined>;
	i: number;
	attributes?: ProductAttribute[];
} & Dictionary["attribute-form"];

export const AttributeForm = {
	name: ({
		dic: {
			"attribute-form": { name: c },
		},
		loading,
		form,
		i,
		attributes,
	}: AttributeFormProps) => {
		// const suggestions = attributes
		// 	?.find((e) => e?.["name"] === form?.getValues(`attributes.${i}.name`))
		// 	?.["values"]?.map((e) => e?.["name"]);

		return (
			<FormField
				control={form?.["control"]}
				name={`attributes.${i}.name`}
				render={({ field }) => (
					<FormItem className="w-full">
						<FormLabel className="sr-only">{c?.["name"]}</FormLabel>
						<FormControl>
							<Input
								placeholder={c?.["sizes"]}
								disabled={loading}
								{...field}
								value={form.watch(`attributes.${i}.name`)}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
	values: ({
		dic: {
			"attribute-form": { name: c },
		},
		loading,
		form,
		i,
		attributes,
	}: AttributeFormProps) => {
		const suggestions = form?.watch(`attributes.${i}.name`)
			? attributes?.find((e) => e?.["name"] === form?.watch(`attributes.${i}.name`))?.["values"]
			: [];

		return (
			<TagsInput
				selected={form.watch(`attributes.${i}.values`)}
				onSelectedChange={(values) => form.setValue(`attributes.${i}.values`, values)}
				suggestions={suggestions}
			/>
		);
	},
};

export type AttributesFormProps = {
	loading: boolean;
	form: UseFormReturn<z.infer<typeof attributesSchema>, any, undefined>;
	attributes?: ProductAttribute[];
} & Pick<AttributeFormProps, "dic">;

export const AttributesForm = ({ dic, form, loading, attributes = [] }: AttributesFormProps) => {
	const attributesForm = useFieldArray({
		name: "attributes",
		control: form?.["control"],
	});

	return (
		<div>
			{form.watch("attributes")?.["length"] ? (
				<Card>
					<CardContent>
						<div>
							{form.watch("attributes")?.map((e, i) => {
								return (
									<div key={i} className="mb-2 space-y-4 border-b-4 last:border-none">
										<div className="flex w-full items-center justify-between gap-2">
											<AttributeForm.name
												dic={dic}
												form={form as any}
												loading={loading}
												i={i}
												attributes={attributes}
											/>

											<Button
												variant="destructive"
												size="icon"
												onClick={() => attributesForm.remove(i)}
											>
												<Icons.x />
											</Button>
										</div>
										<div>
											<AttributeForm.values
												dic={dic}
												form={form as any}
												loading={loading}
												i={i}
												attributes={attributes}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
};

// import {
// 	Table,
// 	TableBody,
// 	TableCell,
// 	TableHead,
// 	TableHeader,
// 	TableRow,
// } from "@/components/ui/table";
// import { ProductAttribute } from "@/types/db";
// import { ProductUpdateButtonProps } from "./product-update-button";

// const colorPalette = [
// 	"text-red-500",
// 	"text-blue-500",
// 	"text-green-500",
// 	"text-yellow-500",
// 	"text-purple-500",
// 	"text-pink-500",
// ];

// const AttributeCombinationsTable: React.FC<
// 	Pick<ProductUpdateButtonProps["product"], "attributes">
// > = ({ attributes }) => {
// 	const generateCombinations = (
// 		attributes: ProductAttribute[],
// 	): ProductAttribute["values"]["0"][][] => {
// 		const valuesArrays = attributes.map((attr) => attr.values);

// 		const combine = (
// 			arrays: ProductAttribute["values"]["0"][][],
// 			index = 0,
// 			prefix: ProductAttribute["values"]["0"][] = [],
// 		): ProductAttribute["values"]["0"][][] => {
// 			if (index === arrays.length) return [prefix];
// 			const combinations: ProductAttribute["values"]["0"][][] = [];
// 			for (const item of arrays[index]) {
// 				combinations.push(...combine(arrays, index + 1, [...prefix, item]));
// 			}
// 			return combinations;
// 		};

// 		return combine(valuesArrays);
// 	};

// 	const combinations = generateCombinations(attributes);

// 	const getColorClass = (index: number): string => colorPalette[index % colorPalette.length];

// 	return (
// 		<Table>
// 			<TableHeader>
// 				<TableRow>
// 					{attributes.map((attr, i) => (
// 						<TableHead key={i} className={getColorClass(i)}>
// 							{attr.name}
// 						</TableHead>
// 					))}
// 				</TableRow>
// 			</TableHeader>
// 			<TableBody>
// 				{combinations.map((combination, rowIndex) => (
// 					<TableRow key={rowIndex}>
// 						{combination.map((value, cellIndex) => (
// 							<TableCell key={cellIndex} className={getColorClass(cellIndex)}>
// 								{value.name}
// 							</TableCell>
// 						))}
// 					</TableRow>
// 				))}
// 			</TableBody>
// 		</Table>
// 	);
// };
