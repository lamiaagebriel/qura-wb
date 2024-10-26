import type { Metadata } from "next";
import { Suspense } from "react";

import { Icons } from "@/components/icons";
import { UserAuthRegisterForm } from "@/components/_users/register-form";
import { Link } from "@/components/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { LocaleProps } from "@/types/locale";
import { getDictionary } from "@/lib/locale";

type RegisterProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Register" };
export default async function Register({ params }: RegisterProps) {
	const { lang } = await params;
	const dic = await getDictionary(lang);
	const c = dic?.["auth"]?.["register"];

	return (
		<div className="grid flex-1 items-center justify-center overflow-auto lg:max-w-none lg:grid-cols-2 lg:px-0">
			<Link
				href="/login"
				className={cn(buttonVariants({ variant: "ghost" }), "absolute right-4 top-4")}
			>
				{c?.["login"]}
			</Link>

			<div className="hidden h-full bg-muted lg:block" />
			<section className="container flex w-full max-w-sm flex-col justify-center space-y-6">
				<div className="flex flex-col space-y-2 text-center">
					<Icons.logo className="mx-auto mb-5 h-16 w-16" />

					<h1 className="text-2xl font-semibold tracking-tight">{c?.["create an account!"]} 🎉</h1>
					<p className="text-sm text-muted-foreground">
						{
							c?.[
								"join our community and unlock amazing features to streamline your work and boost your productivity."
							]
						}
					</p>
				</div>
				<div className="grid gap-4">
					<Suspense>
						<UserAuthRegisterForm dic={dic} />
					</Suspense>

					<p className="px-8 text-center text-sm text-muted-foreground">
						{c?.["by clicking continue, you agree to our"]}{" "}
						<Link href="/terms" className="hover:text-brand underline underline-offset-4">
							{c?.["terms of service"]}
						</Link>{" "}
						{c?.["and"]}{" "}
						<Link href="/privacy" className="hover:text-brand underline underline-offset-4">
							{c?.["privacy policy"]}
						</Link>
						.
					</p>
				</div>
			</section>
		</div>
	);
}
