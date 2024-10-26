"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { userLoginSchema } from "@/validations/users";
import { signInWithGoogle, signInWithPassword } from "@/servers/users";
import { UserForm, UserFormProps } from "@/components/_users/_user-form";
import { Dictionary } from "@/types/locale";

type UserLoginFormProps = {} & Dictionary["user-login-form"] & Pick<UserFormProps, "dic">;
export function UserLoginForm({ dic: { "user-login-form": c, ...dic } }: UserLoginFormProps) {
	const [loading, setLoading] = useState<boolean>(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

	const form = useForm<z.infer<typeof userLoginSchema>>({
		resolver: zodResolver(userLoginSchema),
	});

	async function onSubmit(data: z.infer<typeof userLoginSchema>) {
		try {
			setLoading(true);
			const result = await signInWithPassword(data);

			if (result && typeof result === "object" && "error" in result) {
				toast.error(result?.["error"]);
				return;
			}
		} catch (err: any) {
			toast.error(err?.["message"]);
		} finally {
			setLoading(false);
		}
	}
	return (
		<>
			<div className="grid gap-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<UserForm.email dic={dic} form={form} loading={loading || isGoogleLoading} />
						<UserForm.password dic={dic} form={form} loading={loading || isGoogleLoading} />

						{/* <p className="text-end text-xs text-muted-foreground">
              <Link
                href="/forgot-password"
                className="underline underline-offset-4 hover:text-primary"
              >
                {c?.["forgot password"]}
              </Link>
            </p> */}

						<Button type="submit" className="w-full" disabled={loading || isGoogleLoading}>
							{loading && <Icons.spinner />}
							{c?.["sign in with email"]}
						</Button>
					</form>
				</Form>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							{c?.["or continue with"]}
						</span>
					</div>
				</div>
				<div className="w-full space-y-2">
					<Button
						variant="outline"
						className="w-full"
						onClick={async () => {
							setIsGoogleLoading(true);
							toast.promise(signInWithGoogle(), {
								error: async (err) => err?.["message"],
							});
						}}
						disabled={loading || isGoogleLoading}
					>
						{isGoogleLoading ? <Icons.spinner /> : <Icons.google />}
						{c?.["sign in with google"]}
					</Button>
				</div>
			</div>
		</>
	);
}
