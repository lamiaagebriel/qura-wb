import { Store } from "@/servers/db/schema";
import { getDictionary } from "@/servers/locale";
import { createProduct } from "@/servers/products";
import { getAuth } from "@/lib/auth";

import { ButtonProps } from "@/components/ui/button";
import { FormButton } from "@/components/ui/form";

type ProductCreateButtonProps = { store: Pick<Store, "id"> } & ButtonProps;
export async function ProductCreateButton({
  store,
  children,
  ...props
}: ProductCreateButtonProps) {
  const { cmn } = await getDictionary();
  const { user } = await getAuth();
  if (!user) return;

  return (
    <FormButton
      variant="outline"
      infiniteLoading
      onAction={createProduct}
      useForm={{
        defaultValues: { storeId: store?.id },
      }}
      {...props}
    >
      {children ?? cmn["create product"]}
    </FormButton>
  );
}
