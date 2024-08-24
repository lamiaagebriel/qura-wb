import { Icons } from "@/components/icons";

export type SelectItem = {
  value: string;
  label: string | React.ReactNode;
  icon?: keyof typeof Icons;
  // segment?: string | null;
  // indicator?: string | number | React.ReactNode;
  // children?: React.ReactNode;
};
