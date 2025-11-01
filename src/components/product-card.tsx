"use client";

import { Paths } from "@/constants";
import { Product } from "@/db/schema";

import { formatPrice } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { Tooltip } from "@/components/ui/tooltip";
import { ProductDetailsCartForm } from "@/components/product-details-cart-form";

import { useLocale } from "./locale-provider";

type ProductCardProps = { product: Product };
export function ProductCard({ product: e }: ProductCardProps) {
  const { cmn } = useLocale();
  return (
    <Card className="gap-0 overflow-hidden border-none p-0 outline-none">
      <CardHeader className="relative border-none p-0 outline-none">
        <Link
          href={`${Paths.Store}/${e?.storeId}${Paths.StoreProduct}/${e?.id}`}
        >
          <Image
            src={e?.images?.[0]!}
            alt={`${e?.title}`}
            className="aspect-[9/12] border-none"
          />
        </Link>

        <div className="bg-card absolute right-0 bottom-0 z-10 rounded-tl-xl pt-[6px] pl-[6px]">
          <div className="border-card absolute top-0 right-0 size-4 translate-x-[calc(6px-0.5px)] -translate-y-[calc(100%-6px+0.5px)] rounded-br-xl border-[6px] border-t-0 border-l-0" />
          <div className="border-card absolute bottom-0 left-0 size-4 -translate-x-[calc(100%-6px+0.5px)] translate-y-[calc(6px-0.5px)] rounded-br-xl border-[6px] border-t-0 border-l-0" />
          <div>
            <Dialog>
              <Tooltip
              // tip="add to cart"
              >
                <DialogTrigger asChild>
                  <Button size="icon">
                    <Icons.shoppingBasket />
                  </Button>
                </DialogTrigger>
              </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {cmn["choose"]} {e?.title} {cmn["varients"]}
                  </DialogTitle>
                </DialogHeader>

                <ProductDetailsCartForm product={e} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <Link href={`${Paths.Store}/${e?.storeId}${Paths.StoreProduct}/${e?.id}`}>
        <CardContent className="space-y-1 p-4">
          <CardTitle>{e?.title}</CardTitle>
          <CardTitle className="text-sm">
            {formatPrice(e?.price)} -{" "}
            {e?.compareToPrice ? (
              <span className="text-destructive line-through">
                {formatPrice(e?.compareToPrice)}
              </span>
            ) : null}
          </CardTitle>
        </CardContent>
      </Link>
    </Card>
  );
}
