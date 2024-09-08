"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/types/locale";
import { orderCreateSchema, orderUpdateSchema } from "@/validations/orders";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

type OrderFormProps = {
  loading: boolean;
  form:
    | UseFormReturn<z.infer<typeof orderCreateSchema>, any, undefined>
    | UseFormReturn<z.infer<typeof orderUpdateSchema>, any, undefined>;
} & Dictionary["order-form"];

export const OrderForm = {
  size: ({
    dic: {
      "order-form": { size: c },
    },
    loading,
    form,
  }: OrderFormProps) => (
    <FormField
      name={`products.${0}.size`}
      // @ts-ignore
      control={form?.["control"]}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{c?.["size"]}</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder={c?.["xl"]}
              disabled={loading}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  ),
  color: ({
    dic: {
      "order-form": { size: c },
    },
    loading,
    form,
  }: OrderFormProps) => (
    <FormField
      name={`products.${0}.color`}
      // @ts-ignore
      control={form?.["control"]}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Color</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="white"
              disabled={loading}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  ),
};
