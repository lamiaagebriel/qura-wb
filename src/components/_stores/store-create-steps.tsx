"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { AddressForm, StoreForm, StoreFormProps } from "@/components/_stores/_store-form";
import { storeCreateSchema } from "@/validations/stores";
import { createStore } from "@/servers/stores";
import { Icons } from "@/components/icons";
import {
	Steps,
	StepsContent,
	StepsProgress,
	StepsNext,
	StepsPrevious,
} from "@/components/steps-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import { Dictionary } from "@/types/locale";

export type StoreCreateStepsProps = {} & Omit<
	React.ComponentPropsWithoutRef<typeof Steps>,
	"totalSteps"
> &
	Dictionary["store-create-steps"] &
	Pick<StoreFormProps, "dic">;

export function StoreCreateSteps({
	dic: { "store-create-steps": c, ...dic },
	...props
}: StoreCreateStepsProps) {
	const locale = useLocale();
	const router = useRouter();
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

			// toast.success(c?.["created successfully."]);
			router.push(`/${locale}/ss/${result?.["id"]}`);
		} catch (err: any) {
			toast.error(err?.["message"]);
			setLoading(false);
		}
	}

	const steps = [
		{
			label: c?.["Sector"],
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">{c?.["Select Your Store Category"]}</h1>
						<p className="max-w-prose text-center text-sm text-muted-foreground">
							{c?.["Choose the category that best represents your store's offerings."]}
						</p>
					</div>

					<FormField
						control={form?.["control"]}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<RadioGroup
										onValueChange={field.onChange}
										defaultValue={field?.["value"]}
										className="flex flex-col gap-1"
									>
										{c?.["categories"]?.map((e, i) => (
											<FormItem key={i}>
												<FormControl>
													<RadioGroupItem value={e?.["name"]} className="peer sr-only" />
												</FormControl>
												<FormLabel className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-muted p-4 text-center hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary">
													{/* {e?.["icon"]} */}
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
			label: c?.["Username"],
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">{c?.["Select Your Store Unique Name"]}</h1>
						<p className="max-w-prose text-center text-sm text-muted-foreground">
							{
								c?.[
									"Choose the category that best represents your store's offerings. this could be changed later."
								]
							}
						</p>
					</div>
					<StoreForm.username dic={dic} form={form as any} loading={loading} />
				</div>
			),
		},
		{
			label: c?.["Basic Details"],
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">{c?.["Fill These Details"]}</h1>
						<p className="max-w-prose text-center text-sm text-muted-foreground">
							{
								c?.[
									"Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga sunt quibusdam, cum voluptas vero error eveniet animi."
								]
							}
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
			label: c?.["Address Details"],
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">{c?.["Store Address"]}</h1>
						<p className="max-w-prose text-center text-sm text-muted-foreground">
							{
								c?.[
									"Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga sunt quibusdam, cum voluptas vero error eveniet animi."
								]
							}
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
		<Steps totalSteps={steps?.["length"]} {...props}>
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
								<StepsPrevious disabled={loading}>{c?.["previous"]}</StepsPrevious>
								{i < steps?.["length"] - 1 ? (
									<StepsNext disabled={loading}>
										{c?.["next"]} <Icons.chevronRight />
									</StepsNext>
								) : (
									<Button type="submit" disabled={loading} className="w-full">
										{loading && <Icons.spinner />}
										{c?.["submit"]}
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
