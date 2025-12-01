"use client";

import dynamic from "next/dynamic";

import { Paths } from "@/constants";
import { Store } from "@/db/schema";
import { useCartSelectors } from "@/stores/cart-store";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Link, LinkProps } from "@/components/ui/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CartLinkProps = { store: Pick<Store, "id"> } & Omit<LinkProps, "href">;
function CartLinkComponent({
  store: { id: storeId },
  children,
  className,
  ...props
}: CartLinkProps) {
  const selectors = useCartSelectors();
  const count = selectors.getStoreItemCount(storeId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "relative rounded-full",
            className
          )}
          href={`${Paths.Store}/${storeId}${Paths.StoreCart}`}
          {...props}
        >
          {count > 0 && (
            <Badge className="absolute top-0 right-0 aspect-square translate-x-1/2 -translate-y-1/2 rounded-full border-none p-0 px-1 text-xs">
              {count > 99 ? `+99` : count}
            </Badge>
          )}
          <Icons.shoppingBag />
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>cart</p>
      </TooltipContent>
    </Tooltip>
  );
}

export const CartLink = dynamic(() => Promise.resolve(CartLinkComponent), {
  ssr: false,
});
