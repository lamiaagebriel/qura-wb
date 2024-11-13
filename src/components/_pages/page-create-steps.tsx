"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { PageForm, PageFormProps } from "@/components/_pages/_page-form";
import { pageCreateSchema } from "@/validations/pages";
import { Icons } from "@/components/icons";
import {
	Steps,
	StepsContent,
	StepsProgress,
	StepsNext,
	StepsPrevious,
} from "@/components/steps-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/types/locale";
import { Store } from "@prisma/client";
import { createPage } from "@/servers/pages";

export type PageCreateStepsProps = { store: Pick<Store, "id"> } & Omit<
	React.ComponentPropsWithoutRef<typeof Steps>,
	"totalSteps"
> &
	Dictionary["page-create-steps"] &
	Pick<PageFormProps, "dic">;

export function PageCreateSteps({
	dic: { "page-create-steps": c, ...dic },
	store,
	...props
}: PageCreateStepsProps) {
	const [loading, setLoading] = useState<boolean>(false);

	const form = useForm<z.infer<typeof pageCreateSchema>>({
		resolver: zodResolver(pageCreateSchema),
		defaultValues: {
			storeId: store?.["id"],
			url: "",
			title: "",
			description: "",
		},
	});

	async function onSubmit(data: z.infer<typeof pageCreateSchema>) {
		try {
			setLoading(true);
			const result = await createPage(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}

			toast.success(c?.["created successfully."]);
		} catch (err: any) {
			toast.error(err?.["message"]);
		} finally {
			setLoading(false);
		}
	}

	const steps = [
		{
			label: "choose url",
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">Provide Page URL</h1>
						<p className="max-w-prose text-center text-sm text-muted-foreground">
							Choose the category that best represents your page's offerings.
						</p>
					</div>

					<PageForm.url dic={dic} form={form as any} loading={loading} />
				</div>
			),
		},
		{
			label: "create page",
			children: (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col items-center">
						<h1 className="text-center font-bold">Provide Page Details</h1>
						<p className="max-w-prose text-center text-sm text-muted-foreground">
							Choose the category that best represents your page's offerings.
						</p>
					</div>

					<PageForm.title dic={dic} form={form as any} loading={loading} />
					<PageForm.description dic={dic} form={form as any} loading={loading} />
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

							<div dir="ltr" className="my-4 flex items-center justify-between gap-4">
								<StepsPrevious disabled={loading}>
									<Icons.arrowLeft />
									{c?.["go back"]}
								</StepsPrevious>
								{i < steps?.["length"] - 1 ? (
									<StepsNext disabled={loading}>
										{c?.["next step"]} <Icons.chevronRight />
									</StepsNext>
								) : (
									<Button type="submit" disabled={loading} className="w-full">
										{loading && <Icons.spinner />}
										{c?.["create page"]}
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
