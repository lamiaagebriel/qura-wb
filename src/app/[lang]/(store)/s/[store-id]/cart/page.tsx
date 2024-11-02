import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LocaleProps } from "@/types/locale";
import { ProductsTable } from "@/components/_cart/products-table";
import { getDictionary } from "@/lib/locale";
import { ProductAttribute } from "@/types/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Verified } from "lucide-react";
import { Link } from "@/components/link";
// const SUMMARY: { label: React.ReactNode; value: React.ReactNode }[] = [
// 	{
// 		label: "Subtotal",
// 		value: (
// 			<GetPrice
// 				price={cart.actual_cost}
// 				discount={(1 - cart.cost / cart.actual_cost) * 100}
// 				className="text-foreground"
// 			/>
// 		),
// 	},
// 	{
// 		label: "Saved",
// 		value: cart.actual_cost - cart.cost <= 0 ? "---" : getCurrency(cart.actual_cost - cart.cost),
// 	},
// 	{
// 		label: "Items",
// 		value: cart.total_items,
// 	},
// 	{
// 		label: "Payment Method",
// 		value: "Cash",
// 	},
// 	{
// 		label: "Shipping",
// 		value: getCurrency(SHIPPING_COST),
// 	},
// 	{
// 		label: "Total",
// 		value: (
// 			<>
// 				<p>{getCurrency(cart.cost + SHIPPING_COST)} USD</p>
// 				<p className="text-[9px] text-muted-foreground/90">including VAT</p>
// 			</>
// 		),
// 	},
// ];
const SHIPPING_COST = 10;

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

const CART_ORDER_INFO_FIELDS: any[] = [
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
	{
		type: "text",
		name: "note",
		label: "Note",
	},
];

type CartProps = Readonly<{ params: Promise<{ "store-id": string } & LocaleProps> }>;
export const metadata: Metadata = { title: "Cart" };
export default async function Cart({ params }: CartProps) {
	const { lang, "store-id": storeId } = await params;
	const dic = await getDictionary(lang);

	const r = await db.product.findMany({
		where: { store: { id: storeId } },
	});
	if (!r?.["length"]) return <>NO CART PRODUCTS</>;

	const products = [
		...r?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] })),
		...r?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] })),
		...r?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] })),
		...r?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] })),
		...r?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] })),
		...r?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] })),
		...r?.map((e) => ({ ...e, attributes: e?.["attributes"] as ProductAttribute[] })),
		{ ...r?.[0]!, attributes: r?.[0]!?.["attributes"] as ProductAttribute[] },
	];

	return (
		<div className="container py-4">
			{/* <h1 className="mb-4 text-lg font-bold">Shopping Cart</h1> */}

			<div className="grid gap-4 lg:grid-cols-[1fr,0.5fr]">
				<ProductsTable dic={dic} data={products} />
				<div>
					<Card>
						<CardHeader>
							<CardTitle>Order Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center gap-2">
								<Input placeholder="Discount Voucher" className="w-full rounded-full" />
								<Button variant="outline" className="rounded-full">
									Apply
								</Button>
							</div>
							<Table>
								<TableBody>
									<TableRow className="border-b-0">
										<TableCell className="font-medium">Subtotal</TableCell>
										<TableCell className="text-right">250.00 USD</TableCell>
									</TableRow>

									<TableRow className="border-b-0">
										<TableCell className="font-medium">Discount (10%)</TableCell>
										<TableCell className="text-right">-1.000 USD</TableCell>
									</TableRow>

									<TableRow>
										<TableCell className="font-medium">Delivery Fee</TableCell>
										<TableCell className="text-right">50.00 USD</TableCell>
									</TableRow>

									<TableRow className="border-b-0">
										<TableCell className="font-medium">Total</TableCell>
										<TableCell className="text-right">1,850.00 USD</TableCell>
									</TableRow>
								</TableBody>
							</Table>
							<Separator className="my-4" />

							<div className="flex items-start gap-2">
								<p>
									Lamiaa Gebriel, +201022184878
									<br />
									185 building, Salah Salem st., Almamora - 152845.
									<br />
									Daraw, Aswan, Egypt.
								</p>
								<Button variant="outline" size="sm">
									Add Address
								</Button>
							</div>
							<Separator className="my-4" />

							<div className="flex items-start gap-2">
								<Verified />
								<p>
									<span className="font-semibold">90 Day Limited Warranty</span> against
									manufacturer's defects <Link href={`/s/${storeId}/warranty`}>Details</Link>
								</p>
							</div>
							<Button size="lg" className="w-full rounded-full">
								Checkout Now
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
