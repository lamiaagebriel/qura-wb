"use client";

import { Product } from "@/db/schema";
import { useCartStore } from "@/stores/cart-store";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormButton,
  FormControl,
  FormField,
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useLocale } from "./locale-provider";

export type ProductDetailsCartFormProps = {
  product: Product;
};

export function ProductDetailsCartForm({
  product: e,
}: ProductDetailsCartFormProps) {
  const cart = useCartStore();

  const { cmn } = useLocale();
  return (
    <Form
      validation="cart-product-schema"
      onSubmit={async ({ quantity, ...data }) => {
        cart.addProduct({
          ...data,
          attributes: data?.attributes?.map((e) => ({
            ...e,
            quantity: quantity ?? 1,
          })),
        });
        return { ok: true };
      }}
      useForm={{
        defaultValues: {
          ...e,
          images: e?.images ?? [],

          quantity: 1,

          attributes: e?.["attributes"]?.map((a) => ({
            name: a?.name,
            value: a?.values?.[0] ?? undefined,
            quantity: 1, // fake till its updated before adding to cart

            price: Number(e?.price),
          })),
        },
      }}
      className="grid grid-cols-1 gap-6"
    >
      <div className="space-y-4">
        {e?.attributes?.map((e, i) => (
          <FormField
            key={i}
            name={`attributes.${i}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground text-xs">
                  {e?.name}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field?.value}
                    className="flex items-center gap-1"
                  >
                    {e?.values?.map((v, j) => (
                      <FormItem key={`${i}-${j}`}>
                        <FormControl>
                          <RadioGroupItem value={v} className="peer sr-only" />
                        </FormControl>
                        <FormLabel className="border-border hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:hover:bg-primary peer-data-[state=checked]:hover:text-primary-foreground [&:has([data-state=checked])]:border-primary flex cursor-pointer items-center rounded-full border p-4">
                          {v}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        <QuantityFeild />
        <FormButton
          type="submit"
          size="lg"
          className="w-full flex-1 rounded-full py-4"
        >
          {cmn["add to cart"]}
        </FormButton>
        <Button variant="outline" size="icon" className="size-10 rounded-full">
          <Icons.heart />
        </Button>
      </div>
    </Form>
  );
}

const QuantityFeild = () => {
  const form = useForm?.();

  return (
    <div className="border-primary flex items-center justify-center gap-1 rounded-full border p-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 rounded-full"
        onClick={() => {
          form.setValue("quantity", form.getValues("quantity") + 1);
        }}
      >
        <Icons.plus />
      </Button>
      <div className="max-w-16">
        <FormInputField
          type="number"
          label={{
            className: "sr-only",
            children: "Quantity",
          }}
          field={{ name: "quantity", control: form["control"] as any }}
          className="h-full border-none shadow-none focus-visible:ring-0"
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-8 rounded-full"
        onClick={() => {
          form.setValue("quantity", form.getValues("quantity") - 1);
        }}
      >
        <Icons.minus />
      </Button>
    </div>
  );
};
