"use client";

import { logout } from "@/servers/users";
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
import { LocaleLink } from "@/components/locale-link";
import { useSession } from "@/components/session-provider";
import { SelectItem } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";

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
				<Avatar className="h-8 w-8">
					{user?.["image"] && (
						<AvatarImage src={user?.["image"]} alt={`${user?.["name"]} profile image`} />
					)}

					<AvatarFallback>
						<>
							<span className="sr-only">{user?.["name"]}</span>
							<Icons.user className="h-3 w-3" />
						</>
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<div dir="ltr" className="flex items-start justify-start gap-2 p-2">
					<div className="flex flex-col gap-1 leading-none">
						<div className="flex items-center justify-between gap-4">
							<p className="font-medium">{user?.["name"]}</p>
						</div>
						<p className="text-muted-foreground w-[200px] truncate text-xs">{user?.["email"]}</p>
					</div>
				</div>

				<DropdownMenuSeparator />
				{items?.map((item, i) => (
					<DropdownMenuItem key={i} asChild>
						<LocaleLink href={item?.["value"]} disabled={item?.["disabled"]}>
							{item?.["label"]}
						</LocaleLink>
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
