import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getCookie, setCookie } from "cookies-next";
import { toast } from "sonner";
import { z } from "zod";

import { Validation } from "@/lib/validations";

import { useAppDispatch, useAppSelector } from "../hooks";

export type CartProduct = Validation["cart-product-schema"];
export type CartAddress = Validation["cart-address-schema"];
export type CartPayment = Validation["cart-payment-schema"];

export type CartState = {
  products: CartProduct[];
  address: CartAddress | null;
  "payment-method": CartPayment["payment-method"] | null;
};

const initialState: CartState = {
  products: [],
  address: null,
  "payment-method": null,
};
const areArraysEqual = (arr1: any[], arr2: any[]) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every(
    (item, index) => JSON.stringify(item) === JSON.stringify(arr2[index])
  );
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
          state.products
            .filter(
              ({ product: p, attributes }) =>
                p.id === payload?.product?.id &&
                areArraysEqual(attributes, payload?.attributes)
            )
            .pop() || null;

        if (
          Number(payload?.product?.stock ?? "0") <
          Number(payload?.quantity ?? "0") +
            (Number(exists?.quantity ?? "0") ?? 0)
        )
          throw Error(
            "You have reached the maximum, there is no more of this product."
          );

        if (!exists) {
          state.products.push(payload);
          setCookie("cart", JSON.stringify(state));
          return;
        }

        const i = state.products.indexOf(exists as never) as number;
        (state.products.at(i) as CartProduct).quantity += payload?.quantity;
        setCookie("cart", JSON.stringify(state));
      } catch (err: any) {
        toast.error(err?.message);
      }
    },
    removeFromCart: (
      state: CartState,
      { payload: { quantity, ...payload } }: PayloadAction<CartProduct>
    ) => {
      try {
        const exists =
          state.products
            .filter(
              ({ product: p, attributes }) =>
                p.id === payload?.product?.id &&
                areArraysEqual(attributes, payload?.attributes)
            )
            .pop() || null;

        if (!exists)
          throw Error("there is no more of this product in your cart.");

        // Get its index
        const i = state.products.indexOf(exists as never) as number;
        (state.products.at(i) as CartProduct).quantity -= quantity;

        // if quantity == 0, then delete the whole product
        if ((state.products.at(i) as CartProduct).quantity < 1)
          state.products = state.products.filter(
            ({ product, attributes }) =>
              !(
                product.id === payload?.product?.id &&
                areArraysEqual(attributes, payload?.attributes)
              )
          );

        setCookie("cart", JSON.stringify(state));
      } catch (err: any) {
        toast.error(err?.message);
      }
    },
    addCartAddress: (
      state: CartState,
      { payload }: PayloadAction<Pick<CartState, "address">>
    ) => {
      state.address = payload?.address;
      setCookie("cart", JSON.stringify(state));
    },
    addCartPayment: (
      state: CartState,
      { payload }: PayloadAction<Pick<CartState, "payment-method">>
    ) => {
      state["payment-method"] = payload?.["payment-method"];
      setCookie("cart", JSON.stringify(state));
    },
    clear: (state: CartState) => {
      state = initialState;
      setCookie("cart", JSON.stringify(state));
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
    removeFromCart: (payload: PayloadAction<CartProduct>["payload"]) => {
      dispatch(cartSlice?.["actions"].removeFromCart(payload));
    },
    addCartAddress: (
      payload: PayloadAction<Pick<CartState, "address">>["payload"]
    ) => {
      dispatch(cartSlice?.["actions"].addCartAddress(payload));
    },
    addCartPayment: (
      payload: PayloadAction<Pick<CartState, "payment-method">>["payload"]
    ) => {
      dispatch(cartSlice?.["actions"].addCartPayment(payload));
    },
    clear: () => {
      dispatch(cartSlice?.["actions"].clear());
    },
  };
};
