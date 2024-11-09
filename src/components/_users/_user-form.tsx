"use client";

import * as z from "zod";
import { UseFormReturn } from "react-hook-form";

import { Dictionary } from "@/types/locale";
import { userLoginSchema, userRegisterSchema } from "@/validations/users";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export type UserFormProps = {
	loading: boolean;
	form: UseFormReturn<
		z.infer<typeof userRegisterSchema> | z.infer<typeof userLoginSchema>,
		any,
		undefined
	>;
} & Dictionary["user-form"];

export const UserForm = {
	name: function Component({
		dic: {
			"user-form": { name: c },
		},
		loading,
		form,
	}: UserFormProps) {
		return (
			<FormField
				control={form?.["control"]}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{c?.["full name"]}</FormLabel>
						<FormControl>
							<Input {...field} disabled={loading} dir="ltr" placeholder={c?.["joe doe"]} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
	email: function Component({
		dic: {
			"user-form": { email: c },
		},
		loading,
		form,
	}: UserFormProps) {
		return (
			<FormField
				control={form?.["control"]}
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{c?.["email"]}</FormLabel>
						<FormControl>
							<Input
								{...field}
								disabled={loading}
								dir="ltr"
								type="email"
								placeholder="name@example.com"
								autoCapitalize="none"
								autoComplete="email"
								autoCorrect="off"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
	password: function Component({
		dic: {
			"user-form": { password: c },
		},
		loading,
		form,
	}: UserFormProps) {
		return (
			<FormField
				control={form?.["control"]}
				name="password"
				render={({ field }) => (
					<FormItem>
						<FormLabel>{c?.["password"]}</FormLabel>
						<FormControl>
							<Input
								{...field}
								disabled={loading}
								dir="ltr"
								type="password"
								placeholder="******"
								autoCapitalize="none"
								autoComplete="password"
								autoCorrect="off"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
};
