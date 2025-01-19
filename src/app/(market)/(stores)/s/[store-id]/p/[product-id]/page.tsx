import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Paths } from "@/constants/utils";
import { SelectItem } from "@/types";

import { queries } from "@/servers/db/queries";
import { getDictionary } from "@/servers/locale";
import { updateProduct } from "@/servers/products";
import { getAuth } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyPlaceholder,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";
import { Image } from "@/components/image";
import { Link } from "@/components/link";
import { ProductCard } from "@/components/product-card";
import { ProductDetailsCartForm } from "@/components/product-details-cart-form";

type ProductProps = Readonly<{
  params: Promise<{ "store-id": string; "product-id": string }>;
}>;
export const metadata: Metadata = { title: "Product" };
export default async function Product({ params }: ProductProps) {
  const { "store-id": storeId, "product-id": productId } = await params;

  const {
    stores: {
      store: {
        products: { product: c },
      },
    },
    db: { products: pp },
    cmn,
  } = await getDictionary();

  const { data: selectedProduct } = await queries.products.get({
    id: productId,
  });
  const { data: products } = await queries.products.getMany({
    storeId,
  });

  if (!selectedProduct)
    return (
      <main className="flex-1">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="container max-w-screen-sm py-4">
            <EmptyPlaceholder className="border-none">
              <EmptyPlaceholderIcon name="inbox" />
              <EmptyPlaceholderTitle>لا يوجد بيانات.</EmptyPlaceholderTitle>
              <EmptyPlaceholderDescription>
                تحاول الآن الوصول إلي بيانات غير موجودة في خوادمنا.
              </EmptyPlaceholderDescription>

              <Link
                href={`/ss/${storeId}/products`}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                <Icons.shirt />
                <span>جميع المنتجات</span>
              </Link>
            </EmptyPlaceholder>
          </div>
        </div>
      </main>
    );

  return (
    <main className="flex-1">
      <div className="container flex flex-col gap-4 py-4">
        <div className="flex items-center">
          <Link
            href={`${Paths.Store}/${storeId}`}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            <Icons.chevronLeft />
            {cmn["back"]}
          </Link>

          <div className="flex items-center gap-4 text-muted-foreground">
            <Icons.dot />
            <p>Product Details</p>
          </div>
        </div>

        <div className="space-y-16">
          <div className="grid gap-4 overflow-hidden lg:grid-cols-2 lg:gap-10">
            <div>
              <Tabs
                defaultValue="0"
                className="-order-1 flex flex-col items-start gap-2 space-y-0 sm:order-1 sm:flex-row"
              >
                <TabsList className="h-fit gap-2 sm:max-w-24 sm:flex-col">
                  {selectedProduct?.images?.map((e, i) => (
                    <TabsTrigger
                      key={i}
                      value={i?.toString()}
                      className="p-0.5"
                    >
                      <Image
                        priority={true}
                        src={e}
                        alt={`${selectedProduct?.title}`}
                        className="aspect-square"
                      />
                    </TabsTrigger>
                  ))}
                </TabsList>

                {selectedProduct?.images?.map((e, i) => (
                  <TabsContent
                    key={i}
                    value={i?.toString()}
                    className="relative"
                  >
                    {/* <div className="absolute left-0 top-0 flex h-12 w-full items-start gap-2 bg-gradient-to-b from-black to-transparent p-2">
                      {selectedProduct?.images?.map((e, i) => (
                        <div
                          key={i}
                          className={cn("h-1 w-full rounded-md bg-white")}
                        />
                      ))}
                    </div> */}
                    {/* TODO: stickey while scrolling  */}
                    <Image
                      priority={true}
                      src={e}
                      alt={`${selectedProduct?.title}`}
                      className="aspect-square"
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="space-y-4">
              <ProductDetailsCartForm product={selectedProduct} />

              <Accordion type="single" defaultValue="shopping" collapsible>
                <AccordionItem value="description">
                  <AccordionTrigger>Description & Fit</AccordionTrigger>
                  <AccordionContent>
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam!
                    <br />
                    <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam!
                    <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam! <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam! <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam! <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam! <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam! <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam! <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam! <br />
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Fugit tempore esse odit eius at iure assumenda atque
                    officiis tenetur. At, nobis quasi ullam iusto commodi
                    ducimus similique maiores error placeat. Lorem, ipsum dolor
                    sit amet consectetur adipisicing elit. Quia error aut porro
                    eligendi minus aliquid quaerat sequi non nemo minima,
                    ducimus, vel ullam vitae tempore assumenda tempora quibusdam
                    eum provident. Lorem ipsum dolor sit, amet consectetur
                    adipisicing elit. Quidem excepturi est architecto veniam?
                    Iure ab illum, ipsum nisi maiores explicabo eos nemo
                    voluptatum? Quisquam ipsa architecto excepturi alias ab
                    magnam!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shopping">
                  <AccordionTrigger>Shopping</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      {(
                        [
                          {
                            value: "discount",
                            label: "Discount",
                            icon: "percent",
                            children: "Disc 50%",
                          },
                          {
                            value: "Package",
                            label: "package",
                            icon: "package",
                            children: "Regular Package",
                          },
                          {
                            value: "delivery-time",
                            label: "Delivery Time",
                            icon: "calender",
                            children: "3-4 Working Days",
                          },
                          {
                            value: "estimated-arrival",
                            label: "Estimated Arrival",
                            icon: "truck",
                            children: "10-12 Oct. 2024",
                          },
                        ] as (SelectItem & { label: string })[]
                      ).map((e, i) => {
                        const Icon = e?.icon ? Icons[e["icon"]] : null;

                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className="rounded-full bg-muted p-4">
                              <Button size="icon" className="rounded-full">
                                {Icon && <Icon />}
                              </Button>
                            </div>
                            <div>
                              <h1 className="text-sm text-muted-foreground">
                                {e?.label}
                              </h1>
                              {e?.children}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div>
            <h1>Rating & Reviews</h1>

            <div className="grid gap-4 overflow-hidden lg:grid-cols-2 lg:gap-10">
              <div className="grid grid-cols-[150px,1fr] items-center gap-1">
                <div>
                  <p className="text-[5rem] font-bold">
                    4.5
                    <span className="text-base font-normal text-muted-foreground">
                      /5
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    (50 new reviews)
                  </p>
                </div>

                <div>
                  {Array.from({ length: 5 }).map((e, i) => (
                    <div key={i} className="grid grid-cols-[80px,1fr] gap-1">
                      <div className="flex items-center justify-end gap-1">
                        {Array.from({ length: 5 - i }).map((_, ii) => (
                          <Icons.star
                            key={ii}
                            className="fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        {5 - i}
                        <Progress value={70 - i * 15} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card>
                <CardHeader className="flex flex-row justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      {/* <AvatarImage src={null} /> */}
                      <AvatarFallback>
                        <Icons.user />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle>Alex Mathio</CardTitle>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                          <Icons.star className="fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date())}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    &quot;Lorem ipsum dolor sit amet consectetur adipisicing
                    elit. Ab quae inventore blanditiis atque eveniet consequatur
                    quidem! Repudiandae laborum repellendus ducimus explicabo
                    repellat vel temporibus officia. Fugit nulla excepturi
                    fugiat incidunt?&quot;
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mb-6 mt-16 space-y-2">
          <h1>You maight also like: </h1>

          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {[...products, ...products, ...products, ...products]?.map(
                (e, i) => (
                  <CarouselItem
                    key={i}
                    className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                  >
                    <ProductCard product={e} />
                  </CarouselItem>
                )
              )}
            </CarouselContent>

            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </main>
  );
}
