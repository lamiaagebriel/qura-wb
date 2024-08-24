"use client";

import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

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
  userAuthLoginSchema,
  userAuthRegisterSchema,
} from "@/validations/users";

type UserFormProps = {
  loading: boolean;
  form: UseFormReturn<
    | z.infer<typeof userAuthRegisterSchema>
    | z.infer<typeof userAuthLoginSchema>,
    any,
    undefined
  >;
} & Dictionary["user-form"];

export const UserForm = {
  name: function Component({
    dic: {
      "user-form": { name: c },
    },
    loading,
    form,
  }: UserFormProps) {
    return (
      <FormField
        control={form?.["control"]}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{c?.["full name"]}</FormLabel>
            <FormControl>
              {/* @ts-ignore */}
              <Input
                type="text"
                placeholder={c?.["joe doe"]}
                disabled={loading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  },
  email: function Component({
    dic: {
      "user-form": { email: c },
    },
    loading,
    form,
  }: UserFormProps) {
    return (
      <FormField
        control={form?.["control"]}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{c?.["email"]}</FormLabel>
            <FormControl>
              <Input
                type="email"
                dir="ltr"
                placeholder="name@example.com"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={loading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  },
  password: function Component({
    dic: {
      "user-form": { password: c },
    },
    loading,
    form,
  }: UserFormProps) {
    return (
      <FormField
        control={form?.["control"]}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{c?.["password"]}</FormLabel>
            <FormControl>
              <Input
                type="password"
                dir="ltr"
                placeholder="******"
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect="off"
                disabled={loading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  },
};
