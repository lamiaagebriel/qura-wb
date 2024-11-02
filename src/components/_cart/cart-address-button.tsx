"use client";

import { Icons } from "@/components/icons";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cartAddressSchema } from "@/lib/redux/validations";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useCart } from "@/lib/redux";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";

const PAYMENT_METHODS: any[] = [
	{
		value: "CASH",
		children: "Cash",
		disabled: false,
	},
	{
		value: "PAYPAL",
		children: "Paypal",
		disabled: true,
	},
];
const EGYPT_CITIES: any[] = [
	{ value: "Alexandria", children: "Alexandria", disabled: false },
	{ value: "Aswan", children: "Aswan", disabled: true },
	{ value: "Asyut", children: "Asyut", disabled: false },
	{ value: "Beheira", children: "Beheira", disabled: true },
	{ value: "Beni Suef", children: "Beni Suef", disabled: true },
	{ value: "Cairo", children: "Cairo", disabled: false },
	{ value: "Dakahlia", children: "Dakahlia", disabled: false },
	{ value: "Damietta", children: "Damietta", disabled: true },
	{ value: "Faiyum", children: "Faiyum", disabled: true },
	{ value: "Gharbia", children: "Gharbia", disabled: false },
	{ value: "Giza", children: "Giza", disabled: false },
	{ value: "Ismailia", children: "Ismailia", disabled: false },
	{ value: "Kafr El Sheikh", children: "Kafr El Sheikh", disabled: true },
	{ value: "Luxor", children: "Luxor", disabled: true },
	{ value: "Matruh", children: "Matruh", disabled: true },
	{ value: "Minya", children: "Minya", disabled: true },
	{ value: "Monufia", children: "Monufia", disabled: false },
	{ value: "New Valley", children: "New Valley", disabled: true },
	{ value: "North Sinai", children: "North Sinai", disabled: true },
	{ value: "Port Said", children: "Port Said", disabled: true },
	{ value: "Qalyubia", children: "Qalyubia", disabled: false },
	{ value: "Qena", children: "Qena", disabled: false },
	{ value: "Red Sea", children: "Red Sea", disabled: true },
	{ value: "Sharqia", children: "Sharqia", disabled: true },
	{ value: "Sohag", children: "Sohag", disabled: false },
	{ value: "South Sinai", children: "South Sinai", disabled: false },
	{ value: "Suez", children: "Suez", disabled: false },
];

const COUNTRIES: any[] = [
	{ value: "Egypt", children: "Egypt", disabled: false },
	{ value: "Saudi Arabia", children: "Saudi Arabia", disabled: true },
	{ value: "Iran", children: "Iran", disabled: true },
	{ value: "Iraq", children: "Iraq", disabled: true },
	{
		value: "United Arab Emirates",
		children: "United Arab Emirates",
		disabled: true,
	},
	{ value: "Jordan", children: "Jordan", disabled: true },
	{ value: "Lebanon", children: "Lebanon", disabled: true },
	{ value: "Kuwait", children: "Kuwait", disabled: true },
	{ value: "Qatar", children: "Qatar", disabled: true },
	{ value: "Bahrain", children: "Bahrain", disabled: true },
	{ value: "Oman", children: "Oman", disabled: true },
];

const ADDRESS_FIELDS = [
	{
		type: "input",
		name: "name",
		label: "Full Name",
		desc: "the order owner's name.",
	},
	{
		type: "input",
		name: "phone",
		label: "Phone Number",
	},
	{
		type: "input",
		name: "address_line",
		label: "Address Line",
		input: { placeholder: "optional." },
	},
	{
		type: "input",
		name: "zip",
		label: "ZIP",
	},
	{
		type: "select",
		name: "city",
		label: "City",
		items: EGYPT_CITIES,
		desc: "only works in Egypt right now.",
	},
	{
		type: "select",
		name: "country",
		label: "Country",
		items: COUNTRIES,
		desc: "only works in Egypt right now.",
	},
	{
		type: "select",
		name: "payment_method",
		label: "Payment Method",
		desc: "some payment methods are invalid right now.",
		items: PAYMENT_METHODS,
	},
];
export type CartAddressButtonProps = {};
export function CartAddressButton({}: CartAddressButtonProps) {
	const cart = useCart();
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<z.infer<typeof cartAddressSchema>>({
		resolver: zodResolver(cartAddressSchema),
		defaultValues: { ...cart?.["address"] },
	});

	async function onSubmit(data: z.infer<typeof cartAddressSchema>) {
		cart.addCartAddress({ address: data });
		setOpen(false);
		form.reset({ ...data });
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-4">
				<CardTitle>Order Address</CardTitle>
				<AlertDialog
					open={open}
					onOpenChange={(o) => {
						form.reset();
						setOpen(o);
					}}
				>
					<AlertDialogTrigger asChild>
						<Button variant="outline">{cart?.["address"] ? "edit" : "add"}</Button>
					</AlertDialogTrigger>
					<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
						<AlertDialogHeader>
							<AlertDialogTitle className="justify-start">
								Are you absolutely sure?
							</AlertDialogTitle>
							<AlertDialogDescription className="max-w-prose">
								This action cannot be undone. This will permanently delete your account and remove
								your data from our servers.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Full Name</FormLabel>
											<FormControl>
												<Input {...field} disabled={loading} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone</FormLabel>
											<FormControl>
												<Input {...field} disabled={loading} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="address_line"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Address Line</FormLabel>
											<FormControl>
												<Input {...field} disabled={loading} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="zip"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Zip</FormLabel>
											<FormControl>
												<Input {...field} disabled={loading} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid">
									<FormField
										control={form.control}
										name="state"
										render={({ field }) => (
											<FormItem>
												<FormLabel>State</FormLabel>
												<FormControl>
													<Input {...field} disabled={loading} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="city"
										render={({ field }) => (
											<FormItem>
												<FormLabel>City</FormLabel>
												<FormControl>
													<Input {...field} disabled={loading} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="country"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Country</FormLabel>
												<FormControl>
													<Input {...field} disabled={loading} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<AlertDialogFooter>
									<AlertDialogCancel disabled={loading} asChild>
										<Button disabled={loading} variant="outline">
											Cancel
										</Button>
									</AlertDialogCancel>
									<Button type="submit" disabled={loading} className="w-full md:w-fit">
										Confirm
									</Button>
								</AlertDialogFooter>
							</form>
						</Form>
					</AlertDialogContent>
				</AlertDialog>
			</CardHeader>

			<CardContent>
				<Table>
					<TableBody>
						{Object.entries(cart?.["address"] ?? {})?.map(([key, value], i) => (
							<TableRow key={i}>
								<TableCell className="font-medium">{key}</TableCell>
								<TableCell className="text-right">{value}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
