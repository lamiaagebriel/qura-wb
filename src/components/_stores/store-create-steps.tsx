"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { AddressForm, StoreForm, StoreFormProps } from "@/components/_stores/_store-form";
import { storeCreateSchema } from "@/validations/stores";
import { createStore } from "@/servers/stores";
import { Icons } from "@/components/icons";
import {
	Steps,
	StepsList,
	StepsTrigger,
	StepsContent,
	StepsProgress,
	StepsNext,
	StepsPrevious,
} from "@/components/steps-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Button } from "../ui/button";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
	Tv,
	ShoppingBag,
	Sofa,
	Heart,
	Utensils,
	BookOpen,
	Gamepad,
	Car,
	Diamond,
	Dog,
	Briefcase,
	Baby,
	Paintbrush,
	Music,
	Code,
} from "lucide-react";
import { cn } from "@/lib/shadcn";

type StoreCreateStepsProps = {} & Pick<StoreFormProps, "dic">;
export function StoreCreateSteps({ dic }: StoreCreateStepsProps) {
	const [loading, setLoading] = useState<boolean>(false);

	const form = useForm<z.infer<typeof storeCreateSchema>>({
		resolver: zodResolver(storeCreateSchema),
		defaultValues: {
			name: "",
			username: "",
			logo: "",
			bio: "",
			category: "",
			location: {
				addressLine: "",
				zip: "",
				state: "",
				city: "",
				country: "",
			},
		},
	});

	async function onSubmit(data: z.infer<typeof storeCreateSchema>) {
		try {
			setLoading(true);
			const result = await createStore(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			toast.success("created successfully.");
		} catch (err: any) {
			toast.error(err?.["message"]);
		} finally {
			setLoading(false);
		}
	}

	const steps = [
		{
			label: "Sector",
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">Select Your Store Category</h1>
						<p className="text-muted-foreground max-w-prose text-center text-sm">
							Choose the category that best represents your store's offerings.
						</p>
					</div>

					<FormField
						control={form?.["control"]}
						// name={`attributes.${i}.value`}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<RadioGroup
										onValueChange={field.onChange}
										defaultValue={field?.["value"]}
										className="flex flex-col gap-1"
									>
										{[
											{ name: "Electronics", icon: <Tv className="size-4" /> },
											{ name: "Fashion and Apparel", icon: <ShoppingBag className="size-4" /> },
											{ name: "Home and Furniture", icon: <Sofa className="size-4" /> },
											{ name: "Health and Beauty", icon: <Heart className="size-4" /> },
											{ name: "Groceries and Food", icon: <Utensils className="size-4" /> },
											{ name: "Books and Stationery", icon: <BookOpen className="size-4" /> },
											// { name: "Sports and Outdoor Equipment", icon: <Football className=" size-4" /> },
											{ name: "Toys and Games", icon: <Gamepad className="size-4" /> },
											{
												name: "Automotive Parts and Accessories",
												icon: <Car className="size-4" />,
											},
											{ name: "Jewelry and Accessories", icon: <Diamond className="size-4" /> },
											{ name: "Pet Supplies", icon: <Dog className="size-4" /> },
											{ name: "Office Supplies", icon: <Briefcase className="size-4" /> },
											{ name: "Baby and Kids", icon: <Baby className="size-4" /> },
											{ name: "Arts and Crafts", icon: <Paintbrush className="size-4" /> },
											{ name: "Musical Instruments", icon: <Music className="size-4" /> },
											{ name: "Software and Digital Products", icon: <Code className="size-4" /> },
										]?.map((e, i) => (
											<FormItem key={i}>
												<FormControl>
													<RadioGroupItem value={e?.["name"]} className="peer sr-only" />
												</FormControl>
												<FormLabel className="border-muted hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border p-4 text-center">
													{e?.["icon"]}
													<span>{e?.["name"]}</span>
												</FormLabel>
											</FormItem>
										))}
									</RadioGroup>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			),
		},
		{
			label: "Username",
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">Select Your Store Unique Name</h1>
						<p className="text-muted-foreground max-w-prose text-center text-sm">
							Choose the category that best represents your store's offerings. this could be changed
							later.
						</p>
					</div>
					<StoreForm.username dic={dic} form={form as any} loading={loading} />
				</div>
			),
		},
		{
			label: "Basic Details",
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">Fill These Details</h1>
						<p className="text-muted-foreground max-w-prose text-center text-sm">
							Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga sunt quibusdam, cum
							voluptas vero error eveniet animi.
						</p>
					</div>

					<div className="flex flex-col items-center justify-center">
						<StoreForm.logo dic={dic} form={form as any} loading={loading} />
					</div>
					<StoreForm.name dic={dic} form={form as any} loading={loading} />
					<StoreForm.bio dic={dic} form={form as any} loading={loading} />
				</div>
			),
		},
		{
			label: "Address Details",
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">Store Address</h1>
						<p className="text-muted-foreground max-w-prose text-center text-sm">
							Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga sunt quibusdam, cum
							voluptas vero error eveniet animi.
						</p>
					</div>

					<AddressForm.addressLine dic={dic} form={form as any} loading={loading} />
					<div className="grid grid-cols-2 gap-2">
						<AddressForm.zip dic={dic} form={form as any} loading={loading} />
						<AddressForm.state dic={dic} form={form as any} loading={loading} />
						<AddressForm.city dic={dic} form={form as any} loading={loading} />
						<AddressForm.country dic={dic} form={form as any} loading={loading} />
					</div>
				</div>
			),
		},
	];

	return (
		<Steps
			defaultValue="1"
			totalSteps={steps?.["length"]}
			className="flex min-h-screen flex-col justify-between gap-10 py-8"
		>
			<div className="flex items-center justify-center">
				<StepsProgress className="max-w-60" />
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex-1">
					{/* <StepsList>
						{steps?.map((e, i) => (
							<StepsTrigger key={i} value={`${i}`}>
								{e?.["label"]}
							</StepsTrigger>
						))}
					</StepsList> */}

					{steps?.map((e, i) => (
						<StepsContent key={i} value={`${i}`}>
							{e?.["children"]}

							<div className="my-4 flex items-center justify-between gap-4">
								<StepsPrevious>Previous</StepsPrevious>
								{i < steps?.["length"] - 1 ? (
									<StepsNext>
										Next <Icons.chevronRight />
									</StepsNext>
								) : (
									<Button type="submit" disabled={loading} className="w-full">
										{loading && <Icons.spinner />}
										Submit
									</Button>
								)}
							</div>
						</StepsContent>
					))}
				</form>
			</Form>
		</Steps>
	);
}
