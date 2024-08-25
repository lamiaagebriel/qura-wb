import { Icons } from "@/components/icons";

export type NavItem = {
  segment?: string[] | null;
  value: string;
  label: string | React.ReactNode;
  icon?: keyof typeof Icons;
  indicator?: string | number | React.ReactNode;
  // children?: React.ReactNode;
};

export type SelectItem = {
  value: string;
  label: string | React.ReactNode;
  icon?: keyof typeof Icons;
};
