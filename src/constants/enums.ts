import en from "@/constants/en";
import ar from "@/constants/ar";

import { Locale } from "@/types/locale";
import { getEnumArray } from "@/constants/utils";
import { OrderStatus, ProductStatus } from "@prisma/client";

export const PRODUCT_STATUS_ARR = getEnumArray<ProductStatus>(ProductStatus);
export const productStatus = ({ locale }: { locale: Locale }) =>
	PRODUCT_STATUS_ARR?.map((e) => {
		const t =
			locale === "ar"
				? ar?.["db"]?.["enums"]?.["product-status"]?.find((x) => x?.["value"] === e)
				: en?.["db"]?.["enums"]?.["product-status"]?.find((x) => x?.["value"] === e);

		return t ?? null;
	}).filter((e) => e !== null);

export const ORDER_STATUS_ARR = getEnumArray<OrderStatus>(OrderStatus);
export const orderStatus = ({ locale }: { locale: Locale }) =>
	ORDER_STATUS_ARR?.map((e) => {
		const t =
			locale === "ar"
				? ar?.["db"]?.["enums"]?.["order-status"]?.find((x) => x?.["value"] === e)
				: en?.["db"]?.["enums"]?.["order-status"]?.find((x) => x?.["value"] === e);

		return t ?? null;
	}).filter((e) => e !== null);
