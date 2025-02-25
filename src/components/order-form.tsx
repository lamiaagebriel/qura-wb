import { getDictionary } from "@/servers/locale";
import { OrderStatus } from "@/lib/validations";

import { FormSelectField } from "@/components/ui/form";
import { Icons } from "@/components/icons";

export const OrderForm = {
  status: async function Component() {
    const {
      db: { orders: pp },
    } = await getDictionary();

    return (
      <FormSelectField
        field={{ name: "status" }}
        label={{
          className: "sr-only",
          children: pp["status"]["status"],
        }}
        placeholder={pp["status"]["select status..."]}
        items={(Object.keys(pp["status"]["enums"]) as OrderStatus[])?.map(
          (key) => ({
            value: key,
            children: (
              <div className="flex items-center gap-2">
                <Icons.dot
                  style={{
                    backgroundColor: pp["status"]["enums"][key]?.color,
                  }}
                />
                {pp["status"]["enums"][key]?.label}
              </div>
            ),
          })
        )}
      />
    );
  },
};
