import en from "@/constants/en";
import ar from "@/constants/ar";

import { Locale } from "@/types/locale";
import { getEnumArray } from "@/constants/utils";
import { ProductStatus } from "@prisma/client";

export const PRODUCT_STATUS_ARR = getEnumArray<ProductStatus>(ProductStatus);
export const productStatus = ({ locale }: { locale: Locale }) =>
	PRODUCT_STATUS_ARR?.map((e) => {
		const t = en?.["db"]?.["enums"]?.["product-status"]?.find((x) => x?.["value"] === e);
		return t ?? null;
	}).filter((e) => e !== null);
