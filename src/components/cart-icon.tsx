"use client";

import dynamic from "next/dynamic";

import { useCartSelectors } from "@/stores/cart-store";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Link, LinkProps } from "@/components/ui/link";
import { Tooltip } from "@/components/ui/tooltip";

type CartLinkProps = {} & LinkProps;
function CartLinkComponent({ children, className, ...props }: CartLinkProps) {
  const selectors = useCartSelectors();
  const count = selectors.getCartItemCount();

  return (
    <Tooltip
    // tip="cart"
    >
      <Link
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative rounded-full",
          className
        )}
        {...props}
      >
        {count > 0 && (
          <Badge className="absolute top-0 right-0 aspect-square translate-x-1/2 -translate-y-1/2 rounded-full border-none p-0 px-1 text-xs">
            {count > 99 ? `+99` : count}
          </Badge>
        )}
        <Icons.shoppingBag />
      </Link>
    </Tooltip>
  );
}

export const CartLink = dynamic(() => Promise.resolve(CartLinkComponent), {
  ssr: false,
});
