import { Separator } from "@/components/ui/separator";
import { LocaleProps } from "@/types/locale";
import { AppearanceForm } from "@/components/appearance-form";
import { getDictionary } from "@/lib/locale";

type AppearanceProps = Readonly<{
	params: Promise<LocaleProps>;
}>;
export default async function Appearance({ params }: AppearanceProps) {
	const { locale } = await params;
	const dic = await getDictionary({ locale });
	const c = dic?.["ss"]?.["store"]?.["settings"]?.["appearance"];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">{c?.["appearance"]}</h3>
				<p className="text-sm text-muted-foreground">
					{c?.["customize your appearance settings and preferences."]}
				</p>
			</div>
			<Separator />
			<AppearanceForm dic={dic} />
		</div>
	);
}
