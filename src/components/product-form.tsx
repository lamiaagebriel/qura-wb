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
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/validations/products";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

type ProductFormProps = {
  loading: boolean;
  form:
    | UseFormReturn<z.infer<typeof productCreateSchema>, any, undefined>
    | UseFormReturn<z.infer<typeof productUpdateSchema>, any, undefined>;
} & Dictionary["product-form"];

export const ProductForm = {
  name: ({
    dic: {
      "product-form": { name: c },
    },
    loading,
    form,
  }: ProductFormProps) => (
    <FormField
      name="name"
      // @ts-ignore
      control={form?.["control"]}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{c?.["name"]}</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder={c?.["health center"]}
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
