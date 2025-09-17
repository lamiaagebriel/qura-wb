import { getDictionary } from "@/servers/locale";
import { createStore } from "@/servers/stores";
import { getAuth } from "@/lib/auth";

import { ButtonProps } from "@/components/ui/button";
import {
  FormAlertDialogButton,
  FormInputField,
  FormTextareaField,
} from "@/components/ui/form";

type StoreCreateButtonProps = {} & ButtonProps;
export async function StoreCreateButton({
  children,
  ...props
}: StoreCreateButtonProps) {
  const {
    cmn,
    db: { stores: ss },
  } = await getDictionary();
  const { user } = await getAuth();
  if (!user) return;

  return (
    <FormAlertDialogButton
      trigger={{
        variant: "outline",
        children: cmn["create store"],
      }}
      title={cmn["are you absolutely sure?"]}
      description={
        cmn[
          "this action cannot be undone. this will permanently delete your account and remove your data from our servers."
        ]
      }
      form={{
        infiniteLoading: true,
        validation: "create-store",
        onSubmit: createStore,
        useForm: {
          defaultValues: {
            username: "",
            name: "",
            logo: "",
            bio: "",
          },
        },
      }}
    >
      <FormInputField
        type="file"
        accept="image/*"
        multiple={false}
        field={{ name: "logo" }}
        label={ss["logo"]["logo"]}
      />
      <FormInputField
        field={{ name: "name" }}
        label={ss["name"]["name"]}
        placeholder={ss["name"]["ovve games"]}
      />
      <FormInputField
        field={{ name: "username" }}
        label={ss["username"]["username"]}
        placeholder={ss["username"]["ovvegames"]}
      />
      <FormTextareaField
        field={{ name: "bio" }}
        label={ss["bio"]["bio"]}
        placeholder={ss["bio"]["type about your store..."]}
      />
    </FormAlertDialogButton>
  );
}
