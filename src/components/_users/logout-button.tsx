"use client";

import { Icons } from "@/components/icons";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { logout } from "@/servers/users";
import { Dictionary } from "@/types/locale";
import { toast } from "sonner";

export type LogoutButtonProps = {} & Dictionary["logout-button"];
export function LogoutButton({ dic: { "logout-button": c } }: LogoutButtonProps) {
	return (
		<DropdownMenuItem
			onClick={() => toast.promise(logout(), { loading: c?.["logging out..."] })}
			className="cursor-pointer"
		>
			<Icons.logout />
			{c?.["logout"]}
		</DropdownMenuItem>
	);
}
