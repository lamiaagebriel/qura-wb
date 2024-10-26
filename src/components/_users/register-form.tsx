"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UserForm, UserFormProps } from "@/components/_users/_user-form";
import { signInWithGoogle, signUpWithPassword } from "@/servers/users";
import { userRegisterSchema } from "@/validations/users";
import { Dictionary } from "@/types/locale";

type UserAuthRegisterFormProps = {} & Dictionary["user-auth-register-form"] &
	Pick<UserFormProps, "dic">;

export function UserAuthRegisterForm({
	dic: { "user-auth-register-form": c, ...dic },
}: UserAuthRegisterFormProps) {
	const [loading, setLoading] = useState<boolean>(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

	const form = useForm<z.infer<typeof userRegisterSchema>>({
		resolver: zodResolver(userRegisterSchema),
	});

	async function onSubmit(data: z.infer<typeof userRegisterSchema>) {
		try {
			setLoading(true);
			const result = await signUpWithPassword(data);

			if (result && typeof result === "object" && "error" in result)
				throw new Error(result?.["error"]);
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
						<UserForm.name dic={dic} form={form as any} loading={loading || isGoogleLoading} />
						<UserForm.email dic={dic} form={form as any} loading={loading || isGoogleLoading} />
						<UserForm.password dic={dic} form={form as any} loading={loading || isGoogleLoading} />

						<Button type="submit" className="w-full" disabled={loading || isGoogleLoading}>
							{loading && <Icons.spinner />}
							{c?.["sign up with email"]}
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
						{c?.["sign up with google"]}
					</Button>
				</div>
			</div>
		</>
	);
}
