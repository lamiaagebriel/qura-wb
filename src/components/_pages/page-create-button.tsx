"use client";

import { Icons } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { Dictionary } from "@/types/locale";
import {
	AlertDialog,
	AlertDialogCancelCircle,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageCreateSteps, PageCreateStepsProps } from "@/components/_pages/page-create-steps";

export type PageCreateButtonProps = {} & ButtonProps &
	Dictionary["page-create-button"] &
	Pick<PageCreateStepsProps, "dic" | "store">;

export function PageCreateButton({
	dic: { "page-create-button": c, ...dic },
	store,
	...props
}: PageCreateButtonProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="ghost" size="icon" {...props}>
					<Icons.add />
					{/* {c?.["create page"]} */}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-h-[95svh] overflow-auto rounded-md">
				<AlertDialogTitle className="hidden"></AlertDialogTitle>
				<AlertDialogCancelCircle />
				<PageCreateSteps dic={dic} store={store} />
			</AlertDialogContent>
		</AlertDialog>
	);
}
