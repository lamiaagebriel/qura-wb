import * as React from "react";

import { getDictionary, localeSwitcher } from "@/servers/locale";

import { i18n } from "@/lib/locale";

import { Button } from "@/components/ui/button";
import { Form, FormSelectField } from "@/components/ui/form";
import { Icons } from "@/components/icons";

type LocaleSwitcherProps = {};
export async function LocaleSwitcher({}: LocaleSwitcherProps) {
  const { locale, "locale-switcher": c } = await getDictionary();
  return (
    <Form
      validation="locale-switcher"
      formProps={{ defaultValues: { locale } }}
      actions={{ onSubmit: localeSwitcher }}
    >
      <FormSelectField
        field={{ name: "locale" }}
        items={i18n?.["locales"]?.map((e) => ({ value: e, children: c?.[e] }))}
        label="Choose Language"
        placeholder="choose language"
      />
      <Button type="submit" Icon={<Icons.logo />}>
        Submit
      </Button>
    </Form>
  );
}
