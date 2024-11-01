import { Icons } from "@/components/icons";

export type SelectItem = {
	value: string;
	label: string | React.ReactNode;
	icon?: keyof typeof Icons;
	children?: React.ReactNode;
	disabled?: boolean;
};
export type NavItem = SelectItem & {
	segment?: string[] | null;
	indicator?: string | number | React.ReactNode;
};
