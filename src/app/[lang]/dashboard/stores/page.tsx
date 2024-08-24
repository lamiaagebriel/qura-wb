import { DashboardLayout } from "@/components/dashboard-layout";
import { StoreCreateButton } from "@/components/store-create-button";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionaries";
import { LocaleProps } from "@/types/locale";
import { Metadata } from "next";

type StoresProps = Readonly<{
  params: LocaleProps;
}>;

export async function generateMetadata({
  params: { lang },
}: Readonly<{
  params: LocaleProps;
}>): Promise<Metadata> {
  const {
    dashboard: {
      user: { meta: c },
    },
  } = await getDictionary(lang);

  return {
    title: c?.["title"],
  };
}

export default async function Stores({ params: { lang } }: StoresProps) {
  const dic = await getDictionary(lang);
  const c = dic?.["dashboard"]?.["user"]?.["stores"];

  return (
    <DashboardLayout>
      <DashboardLayout.Header>
        <div>
          <DashboardLayout.Title>{c?.["stores"]}</DashboardLayout.Title>
          <DashboardLayout.Description>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </DashboardLayout.Description>
        </div>

        <div>
          <StoreCreateButton dic={dic}>
            <Button>Create Store</Button>
          </StoreCreateButton>
        </div>
      </DashboardLayout.Header>
      Content
    </DashboardLayout>
  );
}
