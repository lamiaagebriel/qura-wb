import { getCookie, setCookie } from "cookies-next";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "../hooks";
import { toast } from "sonner";
import { z } from "zod";
import { cartProductSchema } from "../validations";

export type CartProduct = z.infer<typeof cartProductSchema>;

export type CartState = {
	products: CartProduct[];
	// order_info: CreateCartProps | null;
};

const initialState: CartState = {
	products: [],
	// order_info: null,
};

export const cartSlice = createSlice({
	name: "cart",
	initialState: getCookie("cart")
		? (JSON.parse(getCookie("cart") as string) as unknown as CartState)
		: initialState,
	reducers: {
		addToCart: (state: CartState, { payload }: PayloadAction<CartProduct>) => {
			try {
				const exists =
					state.products.filter(({ product: p }) => p.id === payload?.["product"]?.["id"]).pop() ||
					null;

				if (payload?.["product"]?.["stock"] < payload?.["quantity"] + (exists?.["quantity"] ?? 0))
					throw Error("You have reached the maximum, there is no more of this product.");

				if (!exists) {
					state.products.push(payload);
					setCookie("cart", JSON.stringify(state));
					return;
				}

				const i = state.products.indexOf(exists as never) as number;
				(state.products.at(i) as CartProduct).quantity += payload?.["quantity"];
				setCookie("cart", JSON.stringify(state));
			} catch (err: any) {
				toast.error(err?.["message"]);
			}
		},
		removeFromCart: (
			state: CartState,
			{
				payload: { quantity = 1, ...payload },
			}: PayloadAction<{
				product: Pick<Pick<CartProduct, "product">["product"], "id">;
				quantity?: Pick<CartProduct, "quantity">["quantity"];
			}>,
		) => {
			try {
				const exists =
					state.products.filter(({ product: p }) => p.id === payload?.["product"]?.["id"]).pop() ||
					null;
				if (!exists) throw Error("there is no more of this product in your cart.");

				// Get its index
				const i = state.products.indexOf(exists as never) as number;
				(state.products.at(i) as CartProduct).quantity -= quantity;

				// if quantity == 0, then delete the whole product
				if ((state.products.at(i) as CartProduct).quantity < 1)
					state.products = state.products.filter(
						({ product }) => product?.["id"] != payload?.["product"]?.["id"],
					);

				setCookie("cart", JSON.stringify(state));
			} catch (err: any) {
				toast.error(err?.["message"]);
			}
		},
	},
});

export const useCart = () => {
	const dispatch = useAppDispatch();

	return {
		...useAppSelector((state) => state.cart),
		addToCart: (payload: PayloadAction<CartProduct>["payload"]) => {
			dispatch(cartSlice?.["actions"].addToCart(payload));
		},
		removeFromCart: (
			payload: PayloadAction<{
				product: Pick<Pick<CartProduct, "product">["product"], "id">;
				quantity?: Pick<CartProduct, "quantity">["quantity"];
			}>["payload"],
		) => {
			dispatch(cartSlice?.["actions"].removeFromCart(payload));
		},
	};
};
