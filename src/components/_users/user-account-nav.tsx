"use client";

import { logout } from "@/servers/users";
import { SelectItem } from "@/types";
import { DropdownMenuTriggerProps } from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";

import { Dictionary } from "@/types/locale";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/avatar";
import { Link } from "@/components/link";
import { useSession } from "@/components/session-provider";

type UserAccountNavProps = {
	items: SelectItem[];
} & DropdownMenuTriggerProps &
	Dictionary["user-account-nav"];

export function UserAccountNav({
	dic: { "user-account-nav": c },
	items,
	...props
}: UserAccountNavProps) {
	const { user } = useSession();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger {...props}>
				<Avatar user={user} className="h-8 w-8" />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<div className="flex items-start justify-start gap-2 p-2">
					<div className="flex flex-col gap-1 leading-none">
						<div className="flex items-center justify-between gap-4">
							<p className="font-medium">{user?.["name"]}</p>
						</div>
						<p className="w-[200px] truncate text-sm text-muted-foreground">{user?.["email"]}</p>
					</div>
				</div>

				<DropdownMenuSeparator />
				{items?.map((item, i) => (
					<DropdownMenuItem key={i} asChild>
						<Link href={item?.["value"]} disabled={item?.["disabled"]}>
							{item?.["label"]}
						</Link>
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<button className="w-full" onClick={() => toast.promise(logout())}>
						{c?.["logout"]}
					</button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
