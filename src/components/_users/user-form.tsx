"use client";

import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { userLoginSchema, userRegisterSchema } from "@/validations/users";
import { Input } from "@/components/ui/input";

type UserFormProps = {
	loading: boolean;
	form: UseFormReturn<
		z.infer<typeof userRegisterSchema> | z.infer<typeof userLoginSchema>,
		any,
		undefined
	>;
};

export const UserForm = {
	name: function Component({ loading, form }: UserFormProps) {
		return (
			<FormField
				control={form?.["control"]}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Full Name</FormLabel>
						<FormControl>
							<Input placeholder="Joe Doe" disabled={loading} {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
	email: function Component({ loading, form }: UserFormProps) {
		return (
			<FormField
				control={form?.["control"]}
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Email</FormLabel>
						<FormControl>
							<Input
								type="email"
								placeholder="name@example.com"
								autoCapitalize="none"
								autoComplete="email"
								autoCorrect="off"
								disabled={loading}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
	password: function Component({ loading, form }: UserFormProps) {
		return (
			<FormField
				control={form?.["control"]}
				name="password"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Password</FormLabel>
						<FormControl>
							<Input
								type="password"
								placeholder="******"
								autoCapitalize="none"
								autoComplete="password"
								autoCorrect="off"
								disabled={loading}
								{...field}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	},
};
