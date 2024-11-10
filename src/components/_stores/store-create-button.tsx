"use client";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { Dictionary } from "@/types/locale";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StoreCreateSteps, StoreCreateStepsProps } from "@/components/_stores/store-create-steps";

export type StoreCreateButtonProps = {} & ButtonProps &
	Dictionary["store-create-button"] &
	Pick<StoreCreateStepsProps, "dic">;

export function StoreCreateButton({
	dic: { "store-create-button": c, ...dic },
	...props
}: StoreCreateButtonProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="ghost" className="w-full justify-start" {...props}>
					<Icons.add />
					{c?.["create store"]}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
				<AlertDialogTitle className="hidden"></AlertDialogTitle>
				<StoreCreateSteps dic={dic} />
			</AlertDialogContent>
		</AlertDialog>
	);
}
