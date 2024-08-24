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
import { storeCreateSchema, storeUpdateSchema } from "@/validations/stores";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

type StoreFormProps = {
  loading: boolean;
  form:
    | UseFormReturn<z.infer<typeof storeCreateSchema>, any, undefined>
    | UseFormReturn<z.infer<typeof storeUpdateSchema>, any, undefined>;
} & Dictionary["store-form"];

export const StoreForm = {
  name: ({
    dic: {
      "store-form": { name: c },
    },
    loading,
    form,
  }: StoreFormProps) => (
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
