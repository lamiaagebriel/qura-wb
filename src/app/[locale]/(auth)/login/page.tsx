import { Metadata } from "next";
import { Suspense } from "react";

import { Icons } from "@/components/icons";
import { UserLoginForm } from "@/components/_users/login-form";
import { LocaleLink } from "@/components/links";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/shadcn";
import { LocaleProps } from "@/types/locale";
import { getDictionary } from "@/lib/locale";

type LoginProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export const metadata: Metadata = { title: "Login" };
export default async function Login({ params }: LoginProps) {
	const { locale } = await params;
	const dic = await getDictionary({ locale });
	const c = dic?.["auth"]?.["login"];

	return (
		<div className="grid flex-1 items-center justify-center overflow-auto">
			<LocaleLink
				href="/"
				className={cn(
					buttonVariants({ variant: "ghost" }),
					"absolute left-4 top-4 gap-2 rtl:flex-row-reverse",
				)}
			>
				<Icons.chevronLeft />
				{c?.["back home"]}
			</LocaleLink>

			<section className="container flex w-full max-w-sm flex-col justify-center space-y-5">
				<div className="flex flex-col space-y-2 text-center">
					<Icons.logo className="mx-auto mb-5 h-16 w-16" />

					<h1 className="text-2xl font-semibold tracking-tight">{c?.["welcome back!"]} 🎉</h1>
					<p className="text-muted-foreground text-sm">
						{
							c?.[
								"join our community and unlock amazing features to streamline your work and boost your productivity."
							]
						}
					</p>
				</div>
				<div className="grid gap-6">
					<Suspense>
						<UserLoginForm dic={dic} />
					</Suspense>

					<p className="text-muted-foreground text-center text-sm">
						<LocaleLink
							href="/register"
							className="hover:text-primary underline underline-offset-4"
						>
							{c?.["don't have an account? sign up now"]}
						</LocaleLink>
					</p>
				</div>
			</section>
		</div>
	);
}
