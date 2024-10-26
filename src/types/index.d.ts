import { Icons } from "@/components/icons";

export type SelectItem = {
	value: string;
	label: string | React.ReactNode;
	icon?: keyof typeof Icons;
	children?: React.ReactNode;
};
