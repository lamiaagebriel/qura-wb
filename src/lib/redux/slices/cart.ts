import { ActionCreatorWithPayload, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "../hooks";

type CounterState = {
	value: number;
};

const initialState: CounterState = {
	value: 0,
};

export const cartSlice = createSlice({
	name: "cart",
	initialState,
	reducers: {
		increment: (state) => {
			state.value += 1;
		},
		decrement: (state) => {
			state.value -= 1;
		},
		incrementByAmount: (state, action: PayloadAction<number>) => {
			state.value += action.payload;
		},
	},
});

export const useCart = () => {
	const dispatch = useAppDispatch();

	return {
		...useAppSelector((state) => state.cart),
		...cartSlice.actions,
		increment: () => dispatch(cartSlice?.["actions"].increment()),
		decrement: () => dispatch(cartSlice?.["actions"].decrement()),
		incrementByAmount: (payload: PayloadAction<number>["payload"]) =>
			dispatch(cartSlice?.["actions"].incrementByAmount(payload)),
	};
};
