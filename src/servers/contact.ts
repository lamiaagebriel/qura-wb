"use server";

import { Paths } from "@/constants";

import { getDictionary } from "@/servers/locale";
import { createServerAction } from "@/servers/utils";
import { Validation, validations } from "@/lib/validations";

export const contactUs = createServerAction(
  async (formData: Validation["contact-us"]) => {
    const data = validations["contact-us"]?.parse(formData);
    const { actions: c } = await getDictionary();

    console.log({ data });
    return { ok: true, redirect: Paths.Dashboard };
  },
  { defaultMessage: "your user account was not logged in. please try again." }
);
